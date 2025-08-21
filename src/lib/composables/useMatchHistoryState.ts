import { computed, reactive, ref } from 'vue';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import type { Game } from '@/types/match-history-sgp';
import type { ChampionState, GameModesFilter } from '@/types/match-history-ui';
import type { ChampionData } from '@/types/champion';

// 组件内部状态管理
export interface LocalSearchResult {
  summoner?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: Game[];
  totalCount: number;
  error?: string;
}

/**
 * 战绩历史状态管理 Composable
 */
export function useMatchHistoryState() {
  // 本地状态
  const searchResult = ref<LocalSearchResult>({
    summoner: undefined,
    rankedStats: undefined,
    matchHistory: undefined,
    totalCount: 0,
    error: undefined,
  });

  const isSearching = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const expandedMatches = ref(new Set<number>());

  // 英雄数据状态
  const championState = reactive<ChampionState>({
    champions: [] as ChampionData[],
    championNames: new Map<string, string>(),
    isLoading: false,
  });

  // 游戏模式过滤选项
  const gameModesFilter = reactive<GameModesFilter>({
    selectedTag: 'all',
  });

  // 计算属性：从本地状态获取数据
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

  // 计算属性：数据状态
  const hasData = computed(() => Boolean(matchHistory.value?.length));
  const hasSummoner = computed(() => Boolean(currentSummoner.value));
  const isLoading = computed(() => championState.isLoading);

  // 状态操作方法
  const clearSearchResult = () => {
    searchResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: undefined,
      totalCount: 0,
      error: undefined,
    };
  };

  const setError = (error: string) => {
    searchResult.value = {
      summoner: undefined,
      rankedStats: undefined,
      matchHistory: undefined,
      totalCount: 0,
      error,
    };
  };

  const setSearchResult = (result: LocalSearchResult) => {
    searchResult.value = result;
  };

  const updateGameModesFilter = (newFilter: GameModesFilter) => {
    Object.assign(gameModesFilter, newFilter);
  };

  return {
    // 状态
    searchResult,
    isSearching,
    currentPage,
    pageSize,
    expandedMatches,
    championState,
    gameModesFilter,

    // 计算属性
    currentSummoner,
    rankedStats,
    matchHistory,
    errorMessage,
    hasAnyData,
    showMatchHistory,
    hasData,
    hasSummoner,
    isLoading,

    // 方法
    clearSearchResult,
    setError,
    setSearchResult,
    updateGameModesFilter,
  };
}
