import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SummonerService } from '@/lib/service/summoner-service';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import type { MatchHistory as MatchHistoryType } from '@/types/match-history';

export interface SearchResult {
  summoner: SummonerData | null;
  rankedStats: RankedStats | null;
  matchHistory: MatchHistoryType | null;
  error: string | null;
}

export const useMatchHistoryStore = defineStore('matchHistory', () => {
  // 状态
  const searchResult = ref<SearchResult>({
    summoner: null,
    rankedStats: null,
    matchHistory: null,
    error: null,
  });
  const isSearching = ref(false);
  const searchHistory = ref<string[]>([]);
  const pageSize = 20; // 修改为20条

  // 服务实例
  let summonerService = new SummonerService();

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

  // 验证用户ID格式
  const validateUserIdFormat = (userId: string): boolean => {
    const userIdPattern = /^.+#\d{5,}$/;
    return userIdPattern.test(userId);
  };

  // 清空搜索结果
  const clearSearchResult = () => {
    searchResult.value = {
      summoner: null,
      rankedStats: null,
      matchHistory: null,
      error: null,
    };
  };

  // 设置错误信息
  const setError = (error: string) => {
    searchResult.value = {
      summoner: null,
      rankedStats: null,
      matchHistory: null,
      error,
    };
  };

  // 设置搜索结果
  const setSearchResult = (result: SearchResult) => {
    searchResult.value = result;
  };

  // 搜索当前登录的召唤师
  const searchCurrentSummoner = async (): Promise<void> => {
    if (isSearching.value) return;

    isSearching.value = true;
    clearSearchResult();

    try {
      // 检查 LCU 连接状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 获取当前召唤师
      const summoner = await summonerService.getCurrentSummoner();

      // 执行搜索
      await performSearch(summoner);
    } catch (error: any) {
      console.error('获取当前召唤师失败:', error);
      setError(error.message || '获取当前召唤师失败，请检查客户端连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 根据召唤师名称搜索
  const searchSummonerByName = async (summonerName: string): Promise<void> => {
    if (isSearching.value || !summonerName.trim()) return;

    // 验证用户ID格式
    if (!validateUserIdFormat(summonerName.trim())) {
      setError(
        '召唤师名称格式不正确，请使用格式：召唤师名#标签（标签至少5位数字）'
      );
      return;
    }

    isSearching.value = true;
    clearSearchResult();

    try {
      // 检查 LCU 连接状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 获取召唤师信息
      const summoner = await summonerService.getSummonerByName(
        summonerName.trim()
      );

      // 执行搜索
      await performSearch(summoner);

      // 添加到搜索历史（避免重复）
      const trimmedName = summonerName.trim();
      if (!searchHistory.value.includes(trimmedName)) {
        searchHistory.value.unshift(trimmedName);
        // 限制历史记录数量
        // if (searchHistory.value.length > 5) {
        //   searchHistory.value = searchHistory.value.slice(0, 5);
        // }
      }
    } catch (error: any) {
      console.error('搜索召唤师失败:', error);
      setError(error.message || '搜索失败，请检查召唤师名称或网络连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 执行搜索逻辑
  const performSearch = async (summoner: SummonerData): Promise<void> => {
    try {
      // 获取排位统计
      const stats = await summonerService.getRankedStats(summoner.puuid);

      const startIndex = 0; // 从0开始
      const endIndex = pageSize - 1; // 一次性加载20条：0-19

      // 获取比赛历史（最近20场）
      const history = await summonerService.getMatchHistory(
        summoner.puuid,
        startIndex,
        endIndex
      );
      console.log('搜索 history:', history);
      console.log('索引范围:', { startIndex, endIndex });

      // 设置搜索结果
      setSearchResult({
        summoner,
        rankedStats: stats,
        matchHistory: history,
        error: null,
      });

      console.log('搜索召唤师成功:', summoner.displayName || summoner.gameName);
    } catch (error: any) {
      console.error('获取召唤师数据失败:', error);
      throw error;
    }
  };

  // 从搜索历史中搜索
  const searchFromHistory = async (name: string): Promise<void> => {
    await searchSummonerByName(name);
  };

  return {
    // 状态
    searchResult,
    isSearching,
    searchHistory,

    // 计算属性
    currentSummoner,
    rankedStats,
    matchHistory,
    errorMessage,
    hasAnyData,
    showMatchHistory,

    // 方法
    clearSearchResult,
    setError,
    setSearchResult,
    searchCurrentSummoner,
    searchSummonerByName,
    searchFromHistory,
    validateUserIdFormat,
  };
});
