<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import type { Champion, ChampionData } from '@/types/champion';
import type {
  MatchHistory as MatchHistoryType,
  Participant,
} from '@/types/match-history';
import type { SummonerData } from '@/types/summoner';
import type {
  GameModesFilter,
  ProcessedMatch,
  ChampionState,
  DetailedMatchInfo,
} from '@/types/match-history-ui';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import { dataLoader } from '@/lib/data-loader';
import MatchHistoryView from './MatchHistoryView.vue';
import { dataUtils } from '@/assets/versioned-assets';

const props = defineProps<{
  matchHistory: MatchHistoryType | null;
  summoner: SummonerData | null;
  isLoadingMore?: boolean;
  canLoadMore?: boolean;
}>();

const emit = defineEmits<{
  loadMore: [];
}>();

// 游戏模式过滤选项
const gameModesFilter = reactive<GameModesFilter>({
  showSolo: true, // 单双排位 (420)
  showFlex: true, // 灵活排位 (440)
  showNormal: true, // 匹配模式 (400, 430)
  showARAM: true, // 极地大乱斗 (450)
  showArena: true, // 斗魂竞技场 (1700)
  showTraining: true, // 训练模式 (0)
  showOthers: true, // 其他模式
});

// 英雄数据状态
const championState = reactive<ChampionState>({
  champions: [] as ChampionData[],
  championNames: new Map<string, string>(),
  isLoading: false,
});

// 展开状态
const expandedMatches = ref(new Set<number>());

// 过滤后的战绩数据
const filteredMatchHistory = computed((): ProcessedMatch[] => {
  if (!props.matchHistory?.games?.games || !props.summoner) {
    return [];
  }

  const processedMatches: ProcessedMatch[] = [];

  for (const game of props.matchHistory.games.games) {
    // 找到当前玩家的参与者ID
    let currentParticipantID = 0;
    if (game.participantIdentities) {
      for (const identity of game.participantIdentities) {
        if (identity.player?.summonerId === props.summoner.accountId) {
          currentParticipantID = identity.participantId;
          break;
        }
      }
    }

    // 找到对应的参与者数据
    let currentPlayer: Participant | null = null;
    if (game.participants) {
      for (const participant of game.participants) {
        if (participant.participantId === currentParticipantID) {
          currentPlayer = participant;
          break;
        }
      }
    }

    if (!currentPlayer) continue;

    // 过滤队列类型 - 修改为更灵活的逻辑
    const shouldShow = (() => {
      // 如果是已知的队列类型，按过滤器设置
      if (game.queueId === 420) return gameModesFilter.showSolo;
      if (game.queueId === 440) return gameModesFilter.showFlex;
      if (game.queueId === 400 || game.queueId === 430)
        return gameModesFilter.showNormal;
      if (game.queueId === 450) return gameModesFilter.showARAM;
      if (game.queueId === 1700) return gameModesFilter.showArena;
      if (game.queueId === 0) return gameModesFilter.showTraining;

      // 对于其他未知的队列类型，使用"其他模式"过滤器
      return gameModesFilter.showOthers;
    })();

    if (!shouldShow) continue;

    const kills = currentPlayer.stats?.kills || 0;
    const deaths = currentPlayer.stats?.deaths || 0;
    const assists = currentPlayer.stats?.assists || 0;
    const kda = (kills + assists) / Math.max(deaths, 1);

    const cs =
      (currentPlayer.stats?.totalMinionsKilled || 0) +
      (currentPlayer.stats?.neutralMinionsKilled || 0);

    const items = [
      currentPlayer.stats?.item0,
      currentPlayer.stats?.item1,
      currentPlayer.stats?.item2,
      currentPlayer.stats?.item3,
      currentPlayer.stats?.item4,
      currentPlayer.stats?.item5,
      currentPlayer.stats?.item6,
    ].filter(item => item && item !== 0) as number[];

    const championName =
      championState.championNames.get(String(currentPlayer.championId)) ||
      `英雄${currentPlayer.championId}`;

    processedMatches.push({
      gameId: game.gameId,
      championId: currentPlayer.championId,
      championName,
      result: currentPlayer.stats?.win ? 'victory' : 'defeat',
      queueType: getQueueName(game.queueId),
      queueId: game.queueId,
      duration: formatGameDuration(game.gameDuration),
      createdAt: game.gameCreationDate,
      kda: {
        kills,
        deaths,
        assists,
        ratio: kda,
      },
      stats: {
        cs,
        gold: currentPlayer.stats?.goldEarned || 0,
        damage: currentPlayer.stats?.totalDamageDealtToChampions || 0,
        damageTaken: currentPlayer.stats?.totalDamageTaken || 0,
        level: currentPlayer.stats?.champLevel || 0,
      },
      items,
      spells: [currentPlayer.spell1Id, currentPlayer.spell2Id],
      runes: [
        currentPlayer.stats?.perkPrimaryStyle || 0,
        currentPlayer.stats?.perkSubStyle || 0,
      ],
      expanded: expandedMatches.value.has(game.gameId),
    });
  }

  return processedMatches;
});

// 计算属性：数据状态
const hasData = computed(() =>
  Boolean(props.matchHistory?.games?.games?.length)
);
const hasSummoner = computed(() => Boolean(props.summoner));
const isLoading = computed(() => championState.isLoading);

// 加载英雄数据
async function loadChampionData() {
  championState.isLoading = true;
  try {
    const championData: Champion = await dataUtils.fetchChampionData();
    championState.champions = Object.values(championData.data);

    // 如果有比赛历史，预加载英雄名称
    if (props.matchHistory?.games?.games) {
      const championIds = new Set<number>();
      for (const game of props.matchHistory.games.games) {
        if (game.participants) {
          for (const participant of game.participants) {
            championIds.add(participant.championId);
          }
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

// 获取详细比赛信息
function getDetailedMatchInfo(gameId: number): DetailedMatchInfo | null {
  if (!props.matchHistory?.games?.games) return null;

  const game = props.matchHistory.games.games.find(g => g.gameId === gameId);
  if (!game) return null;

  return {
    game,
    allParticipants: game.participants || [],
    teams: game.teams || [],
  };
}

// 更新游戏模式过滤器
function updateGameModesFilter(newFilter: GameModesFilter) {
  Object.assign(gameModesFilter, newFilter);
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
    @update:game-modes-filter="updateGameModesFilter"
    @toggle-match-detail="toggleMatchDetail"
    @load-more="emit('loadMore')"
  />
</template>
