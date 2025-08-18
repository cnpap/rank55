<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import type { Champion, ChampionData } from '@/types/champion';
import type { Game } from '@/types/match-history-sgp';
import type { SummonerData } from '@/types/summoner';
import type {
  GameModesFilter,
  ProcessedMatch,
  ChampionState,
  DetailedMatchInfo,
  MatchTeam,
  MatchPlayer,
} from '@/types/match-history-ui';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import { dataLoader } from '@/lib/data-loader';
import MatchHistoryView from './MatchHistoryView.vue';
import { dataUtils } from '@/assets/versioned-assets';
import { useMatchHistoryStore } from '@/stores/match-history';

const props = defineProps<{
  matchHistory: Game[] | null;
  summoner: SummonerData | null;
  isLoadingMore?: boolean;
  canLoadMore?: boolean;
}>();

const emit = defineEmits<{
  loadMore: [];
}>();

// 游戏模式过滤选项 - 使用新的tag系统
const gameModesFilter = reactive<GameModesFilter>({
  selectedTag: 'all', // 默认显示所有模式
});

// 英雄数据状态
const championState = reactive<ChampionState>({
  champions: [] as ChampionData[],
  championNames: new Map<string, string>(),
  isLoading: false,
});

// 展开状态
const expandedMatches = ref(new Set<number>());

// 过滤后的战绩数据 - 重构以适配SGP数据结构
const filteredMatchHistory = computed((): ProcessedMatch[] => {
  if (!props.matchHistory || !props.summoner) {
    return [];
  }

  const processedMatches: ProcessedMatch[] = [];

  for (const game of props.matchHistory) {
    const gameInfo = game.json;

    // 找到当前玩家的参与者数据
    const currentPlayer = gameInfo.participants.find(
      participant => participant.puuid === props.summoner!.puuid
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
        isCurrentPlayer: participant.puuid === props.summoner!.puuid,
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

// 计算属性：数据状态
const hasData = computed(() => Boolean(props.matchHistory?.length));
const hasSummoner = computed(() => Boolean(props.summoner));
const isLoading = computed(() => championState.isLoading);

// 加载英雄数据 - 更新以适配SGP数据结构
async function loadChampionData() {
  championState.isLoading = true;
  try {
    const championData: Champion = await dataUtils.fetchChampionData();
    championState.champions = Object.values(championData.data);

    // 如果有比赛历史，预加载英雄名称
    if (props.matchHistory) {
      const championIds = new Set<number>();
      for (const game of props.matchHistory) {
        for (const participant of game.json.participants) {
          championIds.add(participant.championId);
        }
      }

      const championNames = await dataLoader.getChampionNames(
        Array.from(championIds)
      );
      championState.championNames = championNames;
    }
  } catch (error) {
    console.error('加载英雄数据失败:', error);
  } finally {
    championState.isLoading = false;
  }
}

// 根据championId获取英雄信息
function getChampionByKey(championId: number): ChampionData | undefined {
  return championState.champions.find(
    champion => champion.key === String(championId)
  );
}

// 控制对局展开/收起状态
function toggleMatchDetail(gameId: number) {
  if (expandedMatches.value.has(gameId)) {
    expandedMatches.value.delete(gameId);
  } else {
    expandedMatches.value.add(gameId);
  }
}

// 获取详细比赛信息 - 更新以适配SGP数据结构
function getDetailedMatchInfo(gameId: number): DetailedMatchInfo | null {
  if (!props.matchHistory) return null;

  const game = props.matchHistory.find(g => g.json.gameId === gameId);
  if (!game) return null;

  return {
    game,
    allParticipants: game.json.participants,
    teams: game.json.teams,
  };
}

// 更新游戏模式过滤器
function updateGameModesFilter(newFilter: GameModesFilter) {
  Object.assign(gameModesFilter, newFilter);
  // 触发重新加载数据
  matchHistoryStore.loadMatchHistoryPage(1, undefined, newFilter.selectedTag);
}

// 暴露给父组件的方法和数据
defineExpose({
  loadChampionData,
  getChampionByKey,
  getDetailedMatchInfo,
  championState,
  filteredMatchHistory,
  gameModesFilter,
  expandedMatches,
});

onMounted(() => {
  loadChampionData();
});

// 添加 store
const matchHistoryStore = useMatchHistoryStore();

// 添加分页处理方法
function handlePageChange(page: number) {
  matchHistoryStore.loadMatchHistoryPage(page);
}

function handlePageSizeChange(size: number) {
  matchHistoryStore.setPageSize(size);
  matchHistoryStore.loadMatchHistoryPage(1, size);
}
</script>

<template>
  <MatchHistoryView
    :filtered-matches="filteredMatchHistory"
    :game-modes-filter="gameModesFilter"
    :expanded-matches="expandedMatches"
    :is-loading="isLoading"
    :is-loading-more="isLoadingMore || false"
    :has-data="hasData"
    :has-summoner="hasSummoner"
    :can-load-more="canLoadMore || false"
    :current-page="matchHistoryStore.currentPage"
    :page-size="matchHistoryStore.pageSize"
    :total-matches="matchHistoryStore.searchResult.totalCount"
    @update:game-modes-filter="updateGameModesFilter"
    @toggle-match-detail="toggleMatchDetail"
    @update:current-page="handlePageChange"
    @update:page-size="handlePageSizeChange"
    @load-more="emit('loadMore')"
  />
</template>
