import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { RiotApiService } from '@/lib/service/riot-api-service';
import { SummonerService } from '@/lib/service/summoner-service';
import type { SummonerData } from '@/types/summoner';
import { $local, SearchHistoryItem } from '@/storages/storage-use';
import serverConfig from '../../public/config/league-servers.json';
import { useRouter } from 'vue-router';
import { SgpMatchService } from '@/lib/sgp/sgp-match-service';
import { SimpleSgpApi } from '@/lib/sgp/sgp-api';

// 简化的搜索结果接口 - 只包含基本信息
export interface PuuidSearchResult {
  puuid: string;
  summoner?: SummonerData;
  serverId?: string;
  error?: string;
}

// 服务器选项接口
export interface ServerOption {
  id: string;
  name: string;
}

export const useMatchHistoryStore = defineStore('matchHistory', () => {
  const router = useRouter();

  // 只保留导航组件需要的状态
  const isSearching = ref(false);
  const searchHistory = ref<SearchHistoryItem[]>(
    $local.getItem('searchHistory') || []
  );
  const selectedServerId = ref<string>('TENCENT_HN1');

  // 服务实例
  const riotApiService = new RiotApiService();
  // 服务实例
  let summonerService: SummonerService = new SummonerService();
  let sgpApi: SimpleSgpApi = new SimpleSgpApi();
  let sgpMatchService: SgpMatchService = new SgpMatchService(sgpApi);

  // 获取可用服务器列表
  const availableServers = computed((): ServerOption[] => {
    const servers: ServerOption[] = [];
    const serverNames = (serverConfig as any).serverNames['zh-CN'];

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

  // 设置选中的服务器
  const setSelectedServerId = (serverId: string) => {
    selectedServerId.value = serverId;
  };

  // 保存搜索历史到 localStorage
  const saveSearchHistory = () => {
    $local.setItem('searchHistory', searchHistory.value);
  };

  // 根据召唤师名称搜索 - 只获取 puuid 并跳转
  const searchSummonerByName = async (
    summonerName: string,
    serverId?: string
  ): Promise<void> => {
    // 验证用户ID格式
    if (!validateUserIdFormat(summonerName.trim())) {
      throw new Error(
        '召唤师名称格式不正确，请使用格式：召唤师名#标签（标签至少5位数字）'
      );
    }

    // 使用指定的服务器ID或当前选中的服务器ID
    const targetServerId = serverId || selectedServerId.value;

    isSearching.value = true;

    try {
      // 获取玩家 puuid
      const playerAccountAlias = await riotApiService.lookupPlayerAccount(
        summonerName.trim()
      );

      // 获取召唤师信息（用于保存到历史记录）
      const summoner = await summonerService.getSummonerByPUUID(
        playerAccountAlias.puuid
      );

      // 添加到搜索历史（避免重复）
      const trimmedName = summonerName.trim();
      const existingIndex = searchHistory.value.findIndex(
        item => item.name === trimmedName && item.serverId === targetServerId
      );

      if (existingIndex !== -1) {
        // 如果已存在，移动到最前面并更新 puuid
        const existingItem = searchHistory.value.splice(existingIndex, 1)[0];
        existingItem.puuid = summoner.puuid;
        searchHistory.value.unshift(existingItem);
      } else {
        // 如果不存在，添加新项到最前面
        searchHistory.value.unshift({
          name: trimmedName,
          serverId: targetServerId,
          serverName:
            availableServers.value.find(server => server.id === targetServerId)
              ?.name || '',
          puuid: summoner.puuid,
        });
        // 限制历史记录数量为10条
        if (searchHistory.value.length > 10) {
          searchHistory.value = searchHistory.value.slice(0, 10);
        }
      }

      // 保存到 localStorage
      saveSearchHistory();

      // 跳转到 Home 页面，带上 puuid 和 serverId 参数
      await router.push({
        name: 'Home',
        query: {
          puuid: summoner.puuid,
          serverId: targetServerId,
        },
      });
    } catch (error: any) {
      console.error('搜索召唤师失败:', error);
      throw new Error(error.message || '搜索失败，请检查召唤师名称或网络连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = [];
    saveSearchHistory();
  };

  const getServices = () => {
    return {
      summonerService,
      sgpApi,
      sgpMatchService,
    };
  };

  return {
    // 状态
    isSearching,
    searchHistory,
    selectedServerId,

    // 计算属性
    availableServers,

    // 方法
    setSelectedServerId,
    searchSummonerByName,
    validateUserIdFormat,
    clearSearchHistory,
    getServices,
  };
});
