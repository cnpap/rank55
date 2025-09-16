<script setup lang="ts">
import type { Game } from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';
import { useMatchHistoryStore } from '@/stores/match-history';
import { useClientUserStore } from '@/stores/client-user';
import { useGameSettingsStore } from '@/stores/game-settings';
import { computed, inject } from 'vue';

interface Props {
  match: Game;
}

const props = defineProps<Props>();
const puuid = inject<string>('puuid');
const matchHistoryStore = useMatchHistoryStore();
const clientUserStore = useClientUserStore();
const gameSettingsStore = useGameSettingsStore();
const serverId = inject<string>('serverId');

// 获取队伍信息
const teams = computed(() => {
  const blueTeam = props.match.json.participants.filter(p => p.teamId === 100);
  const pinkTeam = props.match.json.participants.filter(p => p.teamId === 200);

  return [
    {
      players: blueTeam.map(p => ({
        puuid: p.puuid,
        championId: p.championId,
        championName: p.championName,
        displayName: p.riotIdGameName || p.summonerName,
        summonerName:
          `${p.riotIdGameName}#${p.riotIdTagline}` || p.summonerName,
        isCurrentPlayer: p.puuid === puuid,
        isClientUser: p.puuid === clientUserStore.user.puuid,
        level: p.champLevel,
        kda: {
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
        },
        stats: {
          damage: p.totalDamageDealtToChampions,
          damageTaken: p.totalDamageTaken,
        },
      })),
    },
    {
      players: pinkTeam.map(p => ({
        puuid: p.puuid,
        championId: p.championId,
        championName: p.championName,
        displayName: p.riotIdGameName || p.summonerName,
        summonerName:
          `${p.riotIdGameName}#${p.riotIdTagline}` || p.summonerName,
        isCurrentPlayer: p.puuid === puuid,
        isClientUser: p.puuid === clientUserStore.user.puuid,
        level: p.champLevel,
        kda: {
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
        },
        stats: {
          damage: p.totalDamageDealtToChampions,
          damageTaken: p.totalDamageTaken,
        },
      })),
    },
  ];
});

// 计算所有玩家中的最佳KDA数据
const bestKdaStats = computed(() => {
  const allPlayers = props.match.json.participants;

  const maxKills = Math.max(...allPlayers.map(p => p.kills));
  const minDeaths = Math.min(...allPlayers.map(p => p.deaths));
  const maxAssists = Math.max(...allPlayers.map(p => p.assists));

  return {
    maxKills,
    minDeaths,
    maxAssists,
  };
});

// 计算最高等级
const bestLevelStats = computed(() => {
  const allPlayers = props.match.json.participants;
  const maxLevel = Math.max(...allPlayers.map(p => p.champLevel));

  return {
    maxLevel,
  };
});

// 判断玩家是否有最佳KDA数据的函数
const hasMaxKills = (kills: number) => kills === bestKdaStats.value.maxKills;
const hasMinDeaths = (deaths: number) =>
  deaths === bestKdaStats.value.minDeaths;
const hasMaxAssists = (assists: number) =>
  assists === bestKdaStats.value.maxAssists;

// 判断玩家是否有最高等级的函数
const hasMaxLevel = (level: number) => level === bestLevelStats.value.maxLevel;

// 搜索玩家战绩函数
const searchPlayerHistory = async (displayName: string) => {
  console.log(`displayName: ${displayName}`);
  await matchHistoryStore.searchSummonerByName(displayName, serverId);
};

// 计算当前模式下所有玩家的最高值
const maxValueForCurrentMode = computed(() => {
  const allPlayers = props.match.json.participants;

  if (gameSettingsStore.dataDisplayMode === 'damage') {
    return Math.max(...allPlayers.map(p => p.totalDamageDealtToChampions));
  } else {
    return Math.max(...allPlayers.map(p => p.totalDamageTaken));
  }
});

// 获取玩家当前模式下的数值
const getPlayerValue = (player: any) => {
  if (gameSettingsStore.dataDisplayMode === 'damage') {
    return player.stats.damage;
  } else {
    return player.stats.damageTaken;
  }
};

// 格式化数值显示
const formatValue = (value: number) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k';
  }
  return value.toString();
};
</script>

<template>
  <div class="font-tektur-numbers flex gap-1">
    <!-- 队伍循环 -->
    <template v-for="(team, teamIndex) in teams" :key="teamIndex">
      <!-- 队伍玩家列表 -->
      <div class="w-82">
        <div class="">
          <div
            v-for="player in team?.players || []"
            :key="player.puuid"
            class="relative flex"
            :class="{
              'bg-blue-100 dark:bg-blue-900/40':
                teamIndex === 0 && player.isCurrentPlayer,
              'bg-red-100 dark:bg-red-900/40':
                teamIndex === 1 && player.isCurrentPlayer,
            }"
          >
            <!-- 最高伤害和防御图标 -->
            <!-- <div
              class="absolute top-1/2 -right-0 z-10 flex -translate-y-1/2 gap-0.5"
            >
              <img
                v-if="hasMaxDamage(player.stats.damage)"
                class="h-4 w-4 text-xs"
                title="最高伤害"
                :src="staticAssets.getIcon('fire')"
              />
              <img
                v-if="hasMaxDamageTaken(player.stats.damageTaken)"
                class="h-4 w-4 text-xs"
                title="最高承伤"
                :src="staticAssets.getIcon('protection')"
              />
            </div> -->
            <span class="relative flex w-40 items-center gap-0.5">
              <img
                :src="staticAssets.getChampionIcon(`${player.championId}`)"
                :alt="player.championName"
                class="h-4 w-4 flex-shrink-0 object-cover"
              />
              <!-- 等级显示 -->
              <span
                class="w-9 text-center text-xs font-medium"
                :class="{
                  'font-bold text-green-600 dark:text-green-500/80':
                    hasMaxLevel(player.level),
                }"
                :title="`等级: ${player.level}`"
              >
                {{ player.level }}
              </span>
              <button
                @click="searchPlayerHistory(player.summonerName)"
                class="w-30 cursor-pointer truncate text-sm font-medium transition-colors hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                :title="`点击查询 ${player.displayName} 的战绩`"
                :disabled="
                  player.displayName === '未知玩家' ||
                  matchHistoryStore.isSearching
                "
              >
                {{ player.displayName }}
              </button>
            </span>
            <span class="flex w-20 items-center justify-center">
              <span class="text-center text-xs font-medium">
                <span
                  :class="{
                    'font-bold text-green-600 dark:text-green-500/80':
                      hasMaxKills(player.kda.kills),
                  }"
                  >{{ player.kda.kills }}</span
                >
                /
                <span
                  :class="{
                    'font-bold text-green-600 dark:text-green-500/80':
                      hasMinDeaths(player.kda.deaths),
                  }"
                  >{{ player.kda.deaths }}</span
                >
                /
                <span
                  :class="{
                    'font-bold text-green-600 dark:text-green-500/80':
                      hasMaxAssists(player.kda.assists),
                  }"
                  >{{ player.kda.assists }}</span
                >
              </span>
            </span>

            <span class="flex w-24 items-center">
              <!-- 数值 -->
              <span
                class="w-8 text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {{ formatValue(getPlayerValue(player)) }}
              </span>
              <!-- 进度条 -->
              <div class="ml-1 flex-1">
                <div
                  class="relative h-2 w-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                >
                  <div
                    class="h-full"
                    :class="{
                      'bg-green-500 dark:bg-green-600/70':
                        getPlayerValue(player) === maxValueForCurrentMode,
                      'bg-slate-600 dark:bg-slate-600':
                        teamIndex === 0 &&
                        getPlayerValue(player) !== maxValueForCurrentMode,
                      'bg-slate-500 dark:bg-slate-500':
                        teamIndex === 1 &&
                        getPlayerValue(player) !== maxValueForCurrentMode,
                    }"
                    :style="{
                      width:
                        maxValueForCurrentMode > 0
                          ? `${Math.min(100, (getPlayerValue(player) / maxValueForCurrentMode) * 100)}%`
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped></style>
