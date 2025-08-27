import { ref, computed, reactive } from 'vue';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import type { Game } from '@/types/match-history-sgp';
import type { GameModesFilter } from '@/types/match-history-ui';
import { MatchDataLoader } from '@/lib/match-data-loader';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';

// 查询结果接口
export interface MatchHistoryQueryResult {
  summoner?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory: Game[];
  totalCount: number;
  error?: string;
}

// Hook 配置选项
export interface MatchHistoryQueryOptions {
  serverId: string;
  puuid: string;
  initialPageSize?: number;
  autoLoad?: boolean;
}

/**
 * 战绩查询通用 Hook
 * 提供分页、过滤、数据加载等完整功能
 */
export function useMatchHistoryQuery(options: MatchHistoryQueryOptions) {
  const { serverId, puuid, initialPageSize = 20, autoLoad = true } = options;

  const userStore = useClientUserStore();
  const matchHistoryStore = useMatchHistoryStore();

  // 基础状态
  const queryResult = ref<MatchHistoryQueryResult>({
    summoner: undefined,
    rankedStats: undefined,
    matchHistory: [],
    totalCount: 0,
    error: undefined,
  });

  const isLoading = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(initialPageSize);
  const expandedMatches = ref(new Set<number>());

  // 游戏模式过滤器
  const gameModesFilter = reactive<GameModesFilter>({
    selectedTag: 'all',
  });

  // 数据加载器
  const { summonerService, sgpMatchService } = matchHistoryStore.getServices();
  const dataLoader = new MatchDataLoader(
    summonerService,
    sgpMatchService,
    userStore.user!,
    userStore.serverId,
    serverId
  );

  // 计算属性
  const summoner = computed(() => queryResult.value.summoner);
  const rankedStats = computed(() => queryResult.value.rankedStats);
  const matchHistory = computed(() => queryResult.value.matchHistory);
  const errorMessage = computed(() => queryResult.value.error);
  const hasAnyData = computed(() => !!(summoner.value || errorMessage.value));
  const showMatchHistory = computed(() => {
    return !!(summoner.value && rankedStats.value && matchHistory.value);
  });

  // 总页数
  const totalPages = computed(() => {
    return Math.ceil(queryResult.value.totalCount / pageSize.value);
  });

  // 是否有下一页
  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value;
  });

  // 是否有上一页
  const hasPrevPage = computed(() => {
    return currentPage.value > 1;
  });

  // 清除查询结果
  const clearQueryResult = () => {
    queryResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: [],
      totalCount: 0,
      error: undefined,
    };
  };

  // 设置错误
  const setError = (error: string) => {
    queryResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: [],
      totalCount: 0,
      error,
    };
  };

  // 设置查询结果
  const setQueryResult = (result: MatchHistoryQueryResult) => {
    queryResult.value = result;
  };

  // 更新游戏模式过滤器
  const updateGameModesFilter = (newFilter: GameModesFilter) => {
    Object.assign(gameModesFilter, newFilter);
  };

  // 加载完整的战绩数据（初始加载）
  const loadCompleteMatchData = async (): Promise<void> => {
    if (isLoading.value) return;

    isLoading.value = true;
    clearQueryResult();

    try {
      const result = await dataLoader.loadCompleteMatchData(
        puuid,
        pageSize.value
      );

      setQueryResult(result);
      currentPage.value = 1;
    } catch (error: any) {
      console.error('获取完整战绩数据失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      isLoading.value = false;
    }
  };

  // 加载分页数据
  const loadMatchHistoryPage = async (
    tag: string = gameModesFilter.selectedTag
  ): Promise<void> => {
    if (isLoading.value || !queryResult.value.summoner) return;

    isLoading.value = true;

    try {
      const result = await dataLoader.loadMatchHistoryPage(
        serverId,
        puuid,
        currentPage.value,
        pageSize.value,
        tag
      );

      // 更新查询结果
      queryResult.value = {
        ...queryResult.value,
        matchHistory: result.games,
        totalCount: result.totalCount,
      };
    } catch (error: any) {
      console.error('加载分页数据失败:', error);
      setError(error.message || '加载数据失败');
    } finally {
      isLoading.value = false;
    }
  };

  // 刷新当前页数据
  const refreshCurrentPage = async (): Promise<void> => {
    await loadMatchHistoryPage();
  };

  // 跳转到指定页
  const goToPage = async (page: number): Promise<void> => {
    if (page < 1 || page > totalPages.value || page === currentPage.value) {
      return;
    }

    currentPage.value = page;
    await loadMatchHistoryPage();
  };

  // 上一页
  const goToPrevPage = async (): Promise<void> => {
    if (hasPrevPage.value) {
      await goToPage(currentPage.value - 1);
    }
  };

  // 下一页
  const goToNextPage = async (): Promise<void> => {
    if (hasNextPage.value) {
      await goToPage(currentPage.value + 1);
    }
  };

  // 更改每页显示数量
  const changePageSize = async (newSize: number): Promise<void> => {
    pageSize.value = newSize;
    currentPage.value = 1;
    await loadMatchHistoryPage();
  };

  // 更改游戏模式过滤器并重新加载
  const changeGameModeFilter = async (
    newFilter: GameModesFilter
  ): Promise<void> => {
    updateGameModesFilter(newFilter);
    currentPage.value = 1;
    await loadMatchHistoryPage(newFilter.selectedTag);
  };

  // 切换对局详情展开状态
  const toggleMatchDetail = (gameId: number): void => {
    if (expandedMatches.value.has(gameId)) {
      expandedMatches.value.delete(gameId);
    } else {
      expandedMatches.value.add(gameId);
    }
  };

  // 重置所有状态
  const reset = (): void => {
    clearQueryResult();
    currentPage.value = 1;
    pageSize.value = initialPageSize;
    expandedMatches.value.clear();
    gameModesFilter.selectedTag = 'all';
  };

  return {
    // 状态
    queryResult,
    isLoading,
    currentPage,
    pageSize,
    expandedMatches,
    gameModesFilter,

    // 计算属性
    summoner,
    rankedStats,
    matchHistory,
    errorMessage,
    hasAnyData,
    showMatchHistory,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // 方法
    loadCompleteMatchData,
    loadMatchHistoryPage,
    refreshCurrentPage,
    goToPage,
    goToPrevPage,
    goToNextPage,
    changePageSize,
    changeGameModeFilter,
    toggleMatchDetail,
    clearQueryResult,
    setError,
    setQueryResult,
    updateGameModesFilter,
    reset,
  };
}
