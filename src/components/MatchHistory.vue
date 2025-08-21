<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SummonerProfileComponent from '@/components/SummonerProfile.vue';
import Loading from '@/components/Loading.vue';
import {
  ChampionState,
  GameModesFilter,
  MatchPlayer,
  MatchTeam,
  ProcessedMatch,
} from '@/types/match-history-ui';
import { ChampionData } from '@/types/champion';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import MatchHistoryView from '@/components/MatchHistoryView.vue';
import MatchHistoryHeader from '@/components/MatchHistoryHeader.vue';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import type { Game } from '@/types/match-history-sgp';
import { useUserStore } from '@/stores/user';
import { useMatchHistoryStore } from '@/stores/match-history';

// 组件内部状态管理
interface LocalSearchResult {
  summoner?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: Game[];
  serverId?: string;
  totalCount: number;
  error?: string;
}

// 本地状态
const searchResult = ref<LocalSearchResult>({
  summoner: undefined,
  rankedStats: undefined,
  matchHistory: undefined,
  serverId: undefined,
  totalCount: 0,
  error: undefined,
});

const isSearching = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const expandedMatches = ref(new Set<number>());
const userStore = useUserStore();
const matchHistoryStore = useMatchHistoryStore();

// 服务实例
const { summonerService, sgpMatchService } = matchHistoryStore.getServices();

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
const setSearchResult = (result: LocalSearchResult) => {
  searchResult.value = result;
};

// 加载分页数据
const loadMatchHistoryPage = async (tag: string): Promise<void> => {
  if (isSearching.value || !searchResult.value.summoner) return;

  const targetPageSize = pageSize.value;
  const startIndex = (currentPage.value - 1) * targetPageSize;

  isSearching.value = true;

  try {
    const sgpResult = await sgpMatchService.getServerMatchHistory(
      searchResult.value.serverId,
      searchResult.value.summoner.puuid,
      startIndex,
      targetPageSize,
      tag
    );

    // 更新搜索结果
    searchResult.value = {
      ...searchResult.value,
      matchHistory: sgpResult.games,
      totalCount: sgpResult.totalCount,
    };
  } catch (error: any) {
    console.error('加载分页数据失败:', error);
    setError(error.message || '加载数据失败');
  } finally {
    isSearching.value = false;
  }
};

// 过滤后的战绩数据
const filteredMatchHistory = computed((): ProcessedMatch[] => {
  if (!matchHistory.value || !currentSummoner.value) {
    return [];
  }

  const processedMatches: ProcessedMatch[] = [];

  for (const game of matchHistory.value) {
    const gameInfo = game.json;

    // 找到当前玩家的参与者数据
    const currentPlayer = gameInfo.participants.find(
      participant => participant.puuid === currentSummoner.value?.puuid
    );

    if (!currentPlayer) continue;

    const kills = currentPlayer.kills;
    const deaths = currentPlayer.deaths;
    const assists = currentPlayer.assists;
    const kda = (kills + assists) / Math.max(deaths, 1);

    const cs =
      currentPlayer.totalMinionsKilled +
      currentPlayer.totalAllyJungleMinionsKilled +
      currentPlayer.totalEnemyJungleMinionsKilled;

    const items = [
      currentPlayer.item0,
      currentPlayer.item1,
      currentPlayer.item2,
      currentPlayer.item3,
      currentPlayer.item4,
      currentPlayer.item5,
      currentPlayer.item6,
    ].filter(item => item && item !== 0) as number[];

    const championName =
      championState.championNames.get(String(currentPlayer.championId)) ||
      currentPlayer.championName ||
      `英雄${currentPlayer.championId}`;

    // 处理所有玩家信息
    const allPlayers: MatchPlayer[] = gameInfo.participants.map(participant => {
      const playerKills = participant.kills;
      const playerDeaths = participant.deaths;
      const playerAssists = participant.assists;
      const playerKda =
        (playerKills + playerAssists) / Math.max(playerDeaths, 1);

      const playerCs =
        participant.totalMinionsKilled +
        participant.totalAllyJungleMinionsKilled +
        participant.totalEnemyJungleMinionsKilled;

      const playerItems = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6,
      ].filter(item => item && item !== 0) as number[];

      const playerChampionName =
        championState.championNames.get(String(participant.championId)) ||
        participant.championName ||
        `英雄${participant.championId}`;

      const displayName =
        participant.riotIdGameName && participant.riotIdTagline
          ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
          : participant.summonerName || 'Unknown';

      return {
        puuid: participant.puuid,
        riotIdGameName: participant.riotIdGameName || '',
        riotIdTagline: participant.riotIdTagline || '',
        displayName,
        championId: participant.championId,
        championName: playerChampionName,
        teamId: participant.teamId,
        teamPosition:
          participant.teamPosition ||
          participant.individualPosition ||
          'UNKNOWN',
        isCurrentPlayer: participant.puuid === currentSummoner.value?.puuid,
        kda: {
          kills: playerKills,
          deaths: playerDeaths,
          assists: playerAssists,
          ratio: playerKda,
        },
        stats: {
          level: participant.champLevel,
          cs: playerCs,
          gold: participant.goldEarned,
          damage: participant.totalDamageDealtToChampions,
          damageTaken: participant.totalDamageTaken,
        },
        items: playerItems,
        spells: [participant.spell1Id, participant.spell2Id],
        runes: [
          participant.perks?.styles?.[0]?.style || 0,
          participant.perks?.styles?.[1]?.style || 0,
        ],
      };
    });

    // 按队伍分组
    const blueTeam: MatchTeam = {
      teamId: 100,
      win: gameInfo.teams.find(t => t.teamId === 100)?.win || false,
      players: allPlayers.filter(p => p.teamId === 100),
    };

    const redTeam: MatchTeam = {
      teamId: 200,
      win: gameInfo.teams.find(t => t.teamId === 200)?.win || false,
      players: allPlayers.filter(p => p.teamId === 200),
    };

    processedMatches.push({
      gameId: gameInfo.gameId,
      championId: currentPlayer.championId,
      championName,
      result: currentPlayer.win ? 'victory' : 'defeat',
      queueType: getQueueName(gameInfo.queueId),
      queueId: gameInfo.queueId,
      duration: formatGameDuration(gameInfo.gameDuration),
      createdAt: gameInfo.gameCreation,
      kda: {
        kills,
        deaths,
        assists,
        ratio: kda,
      },
      stats: {
        cs,
        gold: currentPlayer.goldEarned,
        damage: currentPlayer.totalDamageDealtToChampions,
        damageTaken: currentPlayer.totalDamageTaken,
        level: currentPlayer.champLevel,
      },
      items,
      spells: [currentPlayer.spell1Id, currentPlayer.spell2Id],
      runes: [
        currentPlayer.perks?.styles?.[0]?.style || 0,
        currentPlayer.perks?.styles?.[1]?.style || 0,
      ],
      expanded: expandedMatches.value.has(gameInfo.gameId),
      teams: [blueTeam, redTeam],
      allPlayers,
    });
  }

  return processedMatches;
});

// 更新游戏模式过滤器
function updateGameModesFilter(newFilter: GameModesFilter) {
  Object.assign(gameModesFilter, newFilter);
  // 触发重新加载数据
  loadMatchHistoryPage(newFilter.selectedTag);
}

// 控制对局展开/收起状态
function toggleMatchDetail(gameId: number) {
  if (expandedMatches.value.has(gameId)) {
    expandedMatches.value.delete(gameId);
  } else {
    expandedMatches.value.add(gameId);
  }
}

// 添加分页处理方法
function handlePageChange(page: number) {
  currentPage.value = page;
  loadMatchHistoryPage(gameModesFilter.selectedTag);
}

function handlePageSizeChange(size: number) {
  pageSize.value = size;
  loadMatchHistoryPage(gameModesFilter.selectedTag);
}

// 添加吸附状态监测
const isSticky = ref(false);
const sentinelRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (sentinelRef.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        isSticky.value = !entry.isIntersecting;
      },
      {
        threshold: 0,
        rootMargin: '-40px 0px 0px 0px',
      }
    );
    observer.observe(sentinelRef.value);
  }
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});

const route = useRoute();

// 根据路由参数获取数据
const loadDataFromRoute = async (): Promise<void> => {
  const puuid = route.query.puuid as string;
  const serverId = route.query.serverId as string;

  if (isSearching.value) return;
  isSearching.value = true;
  clearSearchResult();

  try {
    // 根据 puuid 获取召唤师信息
    const summoner = await summonerService.getSummonerByID(
      userStore.currentUser!.summonerId
    );

    // 获取排位数据
    const stats = await summonerService.getRankedStats(puuid);

    // 获取战绩数据
    const sgpResult = await sgpMatchService.getServerMatchHistory(
      serverId,
      puuid,
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

    currentPage.value = 1;
  } catch (error: any) {
    console.error('获取数据失败:', error);
    setError(error.message || '获取数据失败');
  } finally {
    isSearching.value = false;
  }
};

// 监听路由变化
watch(
  () => route.query,
  async () => {
    await loadDataFromRoute();
  },
  { immediate: false }
);

// 组件挂载时根据路由参数加载数据
onMounted(async () => {
  await loadDataFromRoute();
});
</script>

<template>
  <main class="relative flex h-[calc(100vh-40px)] flex-col">
    <!-- 主内容容器 -->
    <div class="relative z-10 mx-auto flex flex-1 flex-col">
      <!-- 主内容区域 - 调整为单列布局 -->
      <div class="flex flex-1 justify-center">
        <!-- 战绩查询区域 -->
        <div class="flex w-full max-w-4xl flex-col">
          <div class="relative flex h-full w-4xl flex-col">
            <!-- 加载遮罩层 -->
            <div
              v-if="isSearching && !hasAnyData"
              class="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            >
              <div class="flex flex-col items-center space-y-4">
                <Loading size="lg" class="text-primary" />
                <p class="text-muted-foreground text-sm">
                  正在获取当前账号信息...
                </p>
              </div>
            </div>

            <!-- 内容区域 - 始终显示 -->
            <div class="flex-1" v-else>
              <!-- 错误信息 -->
              <div
                v-if="errorMessage"
                class="border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm"
              >
                <svg
                  class="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {{ errorMessage }}
              </div>

              <div v-else>
                <!-- 用于监测 sticky 的哨兵元素 -->
                <div ref="sentinelRef" class="h-0"></div>
                <!-- 召唤师资料 -->
                <div
                  class="sticky top-10 z-50 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm dark:from-[#131313]/80 dark:to-[#151515]/90"
                >
                  <div class="pl-4">
                    <SummonerProfileComponent
                      :summoner-data="currentSummoner"
                      :ranked-stats="rankedStats"
                    />
                  </div>

                  <!-- 头部组件 -->
                  <MatchHistoryHeader
                    :model-value="gameModesFilter"
                    :matches="filteredMatchHistory"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total-matches="searchResult.totalCount"
                    :is-sticky="isSticky"
                    @update:model-value="updateGameModesFilter"
                    @update:current-page="handlePageChange"
                    @update:page-size="handlePageSizeChange"
                  />
                </div>
                <!-- 历史战绩 -->
                <div v-if="showMatchHistory && matchHistory && currentSummoner">
                  <MatchHistoryView
                    :filtered-matches="filteredMatchHistory"
                    :game-modes-filter="gameModesFilter"
                    :expanded-matches="expandedMatches"
                    :is-loading="isLoading"
                    :has-data="hasData"
                    :has-summoner="hasSummoner"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :total-matches="searchResult.totalCount"
                    @update:game-modes-filter="updateGameModesFilter"
                    @toggle-match-detail="toggleMatchDetail"
                    @update:current-page="handlePageChange"
                    @update:page-size="handlePageSizeChange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
