import {
  ref,
  computed,
  reactive,
  provide,
  Ref,
  ComputedRef,
  inject,
} from 'vue';
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
  serverId?: string;
  puuid: string;
  initialPageSize?: number;
}

// 分页控制对象接口
export interface PaginationControl {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  totalPages: ComputedRef<number>;
  hasNextPage: ComputedRef<boolean>;
  hasPrevPage: ComputedRef<boolean>;
  goToPrevPage: () => Promise<void>;
  goToNextPage: () => Promise<void>;
  changePageSize: (newSize: number) => Promise<void>;
}

// 游戏模式过滤控制对象接口
export interface GameModeFilterControl {
  gameModesFilter: GameModesFilter;
  changeGameModeFilter: (newFilter: GameModesFilter) => Promise<void>;
  updateGameModesFilter: (newFilter: GameModesFilter) => void;
}

// Provider keys
export const PAGINATION_CONTROL_KEY = Symbol('paginationControl');
export const GAME_MODE_FILTER_CONTROL_KEY = Symbol('gameModeFilterControl');

/**
 * 战绩查询通用 Hook
 * 提供分页、过滤、数据加载等完整功能
 */
export function useMatchHistoryQuery(options: MatchHistoryQueryOptions) {
  let { serverId, puuid } = options;

  const userStore = useClientUserStore();
  const matchHistoryStore = useMatchHistoryStore();
  if (!serverId) {
    serverId = userStore.serverId;
  }

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
  const pageSize = ref(20);

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
    if (queryResult.value.totalCount === 0) {
      return false;
    }
    return queryResult.value.totalCount === pageSize.value;
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
      queryResult.value = result;
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

    console.log(
      `loadMatchHistoryPage: ${puuid}`,
      serverId,
      puuid,
      currentPage.value,
      pageSize.value,
      tag
    );

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

  // 跳转到指定页
  const goToPage = async (page: number): Promise<void> => {
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

  // 重置所有状态
  const reset = (): void => {
    clearQueryResult();
    currentPage.value = 1;
    pageSize.value = 20;
    gameModesFilter.selectedTag = 'all';
  };

  // 创建分页控制对象
  const paginationControl: PaginationControl = {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPrevPage,
    goToNextPage,
    changePageSize,
  };

  // 创建游戏模式过滤控制对象
  const gameModeFilterControl: GameModeFilterControl = {
    gameModesFilter,
    changeGameModeFilter,
    updateGameModesFilter,
  };

  // 通过 provide 向下级组件传递控制对象
  provide(PAGINATION_CONTROL_KEY, paginationControl);
  provide(GAME_MODE_FILTER_CONTROL_KEY, gameModeFilterControl);

  return {
    // 状态
    queryResult,
    isLoading,
    currentPage,
    pageSize,
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
    goToPrevPage,
    goToNextPage,
    changePageSize,
    changeGameModeFilter,
    clearQueryResult,
    setError,
    updateGameModesFilter,
    reset,

    // 控制对象
    paginationControl,
    gameModeFilterControl,
  };
}

// 用于子组件注入分页控制的 hook
export function usePaginationControl(): PaginationControl {
  const paginationControl = inject<PaginationControl>(PAGINATION_CONTROL_KEY);
  if (!paginationControl) {
    throw new Error(
      'usePaginationControl must be used within a component that provides pagination control'
    );
  }
  return paginationControl as PaginationControl;
}

// 用于子组件注入游戏模式过滤控制的 hook
export function useGameModeFilterControl(): GameModeFilterControl {
  const gameModeFilterControl = inject<GameModeFilterControl>(
    GAME_MODE_FILTER_CONTROL_KEY
  );
  if (!gameModeFilterControl) {
    throw new Error(
      'useGameModeFilterControl must be used within a component that provides game mode filter control'
    );
  }
  return gameModeFilterControl as GameModeFilterControl;
}
