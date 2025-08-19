import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SimpleSgpApi } from '@/lib/sgp/sgp-api';
import { SgpMatchService } from '@/lib/sgp/sgp-match-service';
import { LCUClient } from '@/lib/client/lcu-client';
import { SummonerService } from '@/lib/service/summoner-service';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import type { Game } from '@/types/match-history-sgp';
import { $local, SearchHistoryItem } from '@/storages/storage-use'; // 添加导入
import serverConfig from '../../public/config/league-servers.json';

// SGP API 搜索结果接口
export interface SgpSearchResult {
  summoner?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: Game[];
  serverId?: string;
  totalCount: number;
  error?: string;
}

// 服务器选项接口
export interface ServerOption {
  id: string;
  name: string;
}

export const useMatchHistoryStore = defineStore('matchHistory', () => {
  // 状态
  const searchResult = ref<SgpSearchResult>({
    summoner: undefined,
    rankedStats: undefined,
    matchHistory: undefined,
    serverId: undefined,
    totalCount: 0,
    error: undefined,
  });
  const isSearching = ref(false);

  // 从 localStorage 初始化搜索历史
  const searchHistory = ref<SearchHistoryItem[]>(
    $local.getItem('searchHistory') || []
  );

  const selectedServerId = ref<string>('TENCENT_HN1');

  // 添加分页状态
  const currentPage = ref(1);
  const pageSize = ref(20);

  // 服务实例 - 移除 lcuClient 变量
  let summonerService: SummonerService | null = null;
  let sgpApi: SimpleSgpApi | null = null;
  let sgpMatchService: SgpMatchService | null = null;

  // 初始化服务
  const initializeServices = async () => {
    try {
      if (!summonerService) {
        // 不传入 client 参数，让 BaseService 自动处理环境检测
        summonerService = new SummonerService();
        sgpApi = new SimpleSgpApi();
        sgpMatchService = new SgpMatchService(sgpApi); // 不传入 lcuClient
      }
    } catch (error) {
      console.warn('初始化服务失败:', error);
      throw error;
    }
  };

  // 计算属性
  const currentSummoner = computed(() => searchResult.value.summoner);
  const rankedStats = computed(() => searchResult.value.rankedStats);
  const matchHistory = computed(() => searchResult.value.matchHistory);
  const errorMessage = computed(() => searchResult.value.error);
  const hasAnyData = computed(
    () => !!(currentSummoner.value || errorMessage.value)
  );
  const showMatchHistory = computed(() => {
    return !!(currentSummoner.value && rankedStats.value && matchHistory.value);
  });

  // 获取可用服务器列表
  const availableServers = computed((): ServerOption[] => {
    const servers: ServerOption[] = [];
    const serverNames = (serverConfig as any).serverNames['zh-CN'];

    // 只显示腾讯服务器
    const tencentServers = [
      'TENCENT_HN1',
      'TENCENT_HN10',
      'TENCENT_TJ100',
      'TENCENT_TJ101',
      'TENCENT_NJ100',
      'TENCENT_GZ100',
      'TENCENT_CQ100',
      'TENCENT_BGP2',
    ];

    tencentServers.forEach(serverId => {
      if (serverNames[serverId]) {
        servers.push({
          id: serverId,
          name: serverNames[serverId],
        });
      }
    });

    return servers;
  });

  // 验证用户ID格式
  const validateUserIdFormat = (userId: string): boolean => {
    const userIdPattern = /^.+#\d{5,}$/;
    return userIdPattern.test(userId);
  };

  // 清空搜索结果
  const clearSearchResult = () => {
    searchResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: undefined,
      serverId: undefined,
      totalCount: 0,
      error: undefined,
    };
  };

  // 设置错误信息
  const setError = (error: string) => {
    searchResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: undefined,
      serverId: undefined,
      totalCount: 0,
      error,
    };
  };

  // 设置搜索结果
  const setSearchResult = (result: SgpSearchResult) => {
    searchResult.value = result;
  };

  // 设置选中的服务器
  const setSelectedServerId = (serverId: string) => {
    selectedServerId.value = serverId;
  };

  // 搜索当前登录的召唤师
  const searchCurrentSummoner = async (): Promise<void> => {
    if (isSearching.value) return;

    isSearching.value = true;
    clearSearchResult();

    try {
      await initializeServices();

      if (!summonerService || !sgpMatchService) {
        throw new Error('服务初始化失败');
      }

      // 检查 LCU 连接状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 获取当前召唤师
      const summoner = await summonerService.getCurrentSummoner();

      // 执行搜索（当前用户自动推断服务器）
      await performCurrentUserSearch(summoner);
    } catch (error: any) {
      console.error('获取当前召唤师失败:', error);
      setError(error.message || '获取当前召唤师失败，请检查客户端连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 保存搜索历史到 localStorage
  const saveSearchHistory = () => {
    $local.setItem('searchHistory', searchHistory.value);
  };

  // 根据召唤师名称搜索（需要指定服务器）
  const searchSummonerByName = async (
    summonerName: string,
    serverId?: string
  ): Promise<void> => {
    if (isSearching.value || !summonerName.trim()) return;

    // 验证用户ID格式
    if (!validateUserIdFormat(summonerName.trim())) {
      setError(
        '召唤师名称格式不正确，请使用格式：召唤师名#标签（标签至少5位数字）'
      );
      return;
    }

    // 使用指定的服务器ID或当前选中的服务器ID
    const targetServerId = serverId || selectedServerId.value;
    if (!targetServerId) {
      setError('请选择服务器');
      return;
    }

    isSearching.value = true;
    clearSearchResult();

    try {
      await initializeServices();

      if (!summonerService || !sgpMatchService) {
        throw new Error('服务初始化失败');
      }

      // 检查 LCU 连接状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 获取召唤师信息
      const summoner = await summonerService.getSummonerByName(
        summonerName.trim()
      );

      // 执行搜索（指定服务器）
      await performServerSearch(summoner, targetServerId);

      // 添加到搜索历史（避免重复）
      const trimmedName = summonerName.trim();
      const existingIndex = searchHistory.value.findIndex(
        item => item.name === trimmedName && item.serverId === targetServerId
      );

      // 在 searchSummonerByName 方法的最后添加
      if (existingIndex !== -1) {
        // 如果已存在，移动到最前面并更新 puuid
        const existingItem = searchHistory.value.splice(existingIndex, 1)[0];
        existingItem.puuid = summoner.puuid; // 更新 puuid
        searchHistory.value.unshift(existingItem);
      } else {
        // 如果不存在，添加新项到最前面
        searchHistory.value.unshift({
          name: trimmedName,
          serverId: targetServerId,
          serverName:
            availableServers.value.find(server => server.id === targetServerId)
              ?.name || '',
          puuid: summoner.puuid, // 添加 puuid
        });
        // 限制历史记录数量为10条
        if (searchHistory.value.length > 10) {
          searchHistory.value = searchHistory.value.slice(0, 10);
        }
      }

      // 重要：保存到 localStorage
      saveSearchHistory();
    } catch (error: any) {
      console.error('搜索召唤师失败:', error);
      setError(error.message || '搜索失败，请检查召唤师名称或网络连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = [];
    saveSearchHistory();
  };

  const setCurrentPage = (page: number) => {
    currentPage.value = page;
  };

  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1; // 重置到第一页
  };

  // 修改搜索方法以支持分页和tag过滤
  const loadMatchHistoryPage = async (
    page: number,
    size?: number,
    tag?: string
  ): Promise<void> => {
    if (isSearching.value || !searchResult.value.summoner) return;

    const targetPageSize = size || pageSize.value;
    const startIndex = (page - 1) * targetPageSize;

    isSearching.value = true;

    try {
      await initializeServices();

      if (!summonerService || !sgpMatchService) {
        throw new Error('服务未初始化');
      }

      let sgpResult;
      if (searchResult.value.serverId) {
        // 使用指定服务器搜索
        sgpResult = await sgpMatchService.getServerMatchHistory(
          searchResult.value.serverId,
          searchResult.value.summoner.puuid,
          startIndex,
          targetPageSize,
          tag // 传递tag参数
        );
      } else {
        // 使用当前用户搜索
        sgpResult = await sgpMatchService.getCurrentUserMatchHistory(
          searchResult.value.summoner.puuid,
          startIndex,
          targetPageSize,
          tag // 传递tag参数
        );
      }

      // 更新搜索结果
      searchResult.value = {
        ...searchResult.value,
        matchHistory: sgpResult.games,
        totalCount: sgpResult.totalCount,
      };

      currentPage.value = page;
      if (size) {
        pageSize.value = size;
      }
    } catch (error: any) {
      console.error('加载分页数据失败:', error);
      setError(error.message || '加载数据失败');
    } finally {
      isSearching.value = false;
    }
  };

  // 修改现有搜索方法，使用第一页数据
  const performCurrentUserSearch = async (
    summoner: SummonerData
  ): Promise<void> => {
    try {
      if (!summonerService || !sgpMatchService) {
        throw new Error('服务未初始化');
      }

      const stats = await summonerService.getRankedStats(summoner.puuid);
      const sgpResult = await sgpMatchService.getCurrentUserMatchHistory(
        summoner.puuid,
        0,
        pageSize.value
      );

      setSearchResult({
        summoner,
        rankedStats: stats,
        matchHistory: sgpResult.games,
        serverId: sgpResult.serverId,
        totalCount: sgpResult.totalCount,
        error: undefined,
      });

      // 设置查询成功后的服务器ID
      if (sgpResult.serverId) {
        selectedServerId.value = sgpResult.serverId;
      }

      currentPage.value = 1;

      console.log(
        '搜索当前召唤师成功:',
        summoner.displayName || summoner.gameName
      );
    } catch (error: any) {
      console.error('获取当前用户数据失败:', error);
      throw error;
    }
  };

  const performServerSearch = async (
    summoner: SummonerData,
    serverId: string
  ): Promise<void> => {
    try {
      if (!summonerService || !sgpMatchService) {
        throw new Error('服务未初始化');
      }

      const stats = await summonerService.getRankedStats(summoner.puuid);
      const sgpResult = await sgpMatchService.getServerMatchHistory(
        serverId,
        summoner.puuid,
        0,
        pageSize.value
      );

      setSearchResult({
        summoner,
        rankedStats: stats,
        matchHistory: sgpResult.games,
        serverId: sgpResult.serverId,
        totalCount: sgpResult.totalCount,
        error: undefined,
      });

      // 设置查询成功后的服务器ID
      if (sgpResult.serverId) {
        selectedServerId.value = sgpResult.serverId;
      }

      currentPage.value = 1;

      console.log('搜索召唤师成功:', summoner.displayName || summoner.gameName);
    } catch (error: any) {
      console.error('获取指定服务器数据失败:', error);
      throw error;
    }
  };

  // 从搜索历史中搜索
  const searchFromHistory = async (
    historyItem: SearchHistoryItem
  ): Promise<void> => {
    await searchSummonerByName(historyItem.name, historyItem.serverId);
  };

  // 获取可用服务器列表
  const getAvailableServers = (): string[] => {
    if (sgpApi) {
      return sgpApi.getAvailableServers();
    }
    return [];
  };

  return {
    // 状态
    searchResult,
    isSearching,
    searchHistory,
    selectedServerId,
    currentPage,
    pageSize,

    // 计算属性
    currentSummoner,
    rankedStats,
    matchHistory,
    errorMessage,
    hasAnyData,
    showMatchHistory,
    availableServers,

    // 方法
    clearSearchResult,
    setError,
    setSearchResult,
    setSelectedServerId,
    setCurrentPage,
    setPageSize,
    searchCurrentSummoner,
    searchSummonerByName,
    searchFromHistory,
    loadMatchHistoryPage,
    validateUserIdFormat,
    getAvailableServers,
    clearSearchHistory, // 添加清除历史的方法
  };
});
