<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive } from 'vue';
import SummonerProfileComponent from '@/components/SummonerProfile.vue';
import Loading from '@/components/Loading.vue';
import { useMatchHistoryStore } from '@/stores/match-history';
import {
  ChampionState,
  GameModesFilter,
  MatchPlayer,
  MatchTeam,
  ProcessedMatch,
} from '@/types/match-history-ui';
import { ChampionData } from '@/types/champion';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import { ref } from 'vue';
import MatchHistoryView from '@/components/MatchHistoryView.vue';
import MatchHistoryHeader from '@/components/MatchHistoryHeader.vue';

// 使用 Pinia store
const matchHistoryStore = useMatchHistoryStore();

// 计算属性，从 store 中获取数据
const currentSummoner = computed(() => matchHistoryStore.currentSummoner);
const rankedStats = computed(() => matchHistoryStore.rankedStats);
const matchHistory = computed(() => matchHistoryStore.matchHistory);
const errorMessage = computed(() => matchHistoryStore.errorMessage);
const hasAnyData = computed(() => matchHistoryStore.hasAnyData);
const showMatchHistory = computed(() => matchHistoryStore.showMatchHistory);
const isSearching = computed(() => matchHistoryStore.isSearching);
const expandedMatches = ref(new Set<number>());
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

// 游戏模式过滤选项 - 使用新的tag系统
const gameModesFilter = reactive<GameModesFilter>({
  selectedTag: 'all', // 默认显示所有模式
});

// 过滤后的战绩数据 - 重构以适配SGP数据结构
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
          damageTaken: participant.totalDamageTaken, // 添加承受伤害数据
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
  matchHistoryStore.loadMatchHistoryPage(1, undefined, newFilter.selectedTag);
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
  matchHistoryStore.loadMatchHistoryPage(
    page,
    undefined,
    gameModesFilter.selectedTag
  );
}

function handlePageSizeChange(size: number) {
  matchHistoryStore.setPageSize(size);
  matchHistoryStore.loadMatchHistoryPage(1, size, gameModesFilter.selectedTag);
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
        // 与 sticky 容器的 top-10 (2.5rem => 40px) 保持一致
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

// 组件挂载时自动查询当前登录的召唤师
onMounted(async () => {
  // 延迟 500 ms，等待数据加载完成
  if (!hasAnyData.value) {
    await matchHistoryStore.searchCurrentSummoner();
  }
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
                  class="sticky top-10 z-50 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm dark:from-slate-900/80 dark:to-slate-800/80"
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
                    :current-page="matchHistoryStore.currentPage"
                    :page-size="matchHistoryStore.pageSize"
                    :total-matches="matchHistoryStore.searchResult.totalCount"
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
                    :current-page="matchHistoryStore.currentPage"
                    :page-size="matchHistoryStore.pageSize"
                    :total-matches="matchHistoryStore.searchResult.totalCount"
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
