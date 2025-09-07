<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { SummonerData } from '@/types/summoner';
import { formatGameDuration } from '@/lib/rank-helpers';
import {
  findPlayerInGame,
  calculateKDA,
  getPlayerRunes,
} from '@/lib/match-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import { type Game, type Participant } from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';

interface Props {
  matchHistory: Game[];
  summoner: SummonerData;
  maxMatches?: number;
}

const props = defineProps<Props>();

// 获取队列类型名称
const getQueueName = (queueId: number): string => {
  const queueKey = `q_${queueId}` as keyof typeof GAME_MODE_TAGS;
  return GAME_MODE_TAGS[queueKey] || '未知模式';
};

// 过滤出当前召唤师参与的比赛
const validMatches = computed(
  (): Array<{ game: Game; player: Participant }> => {
    const result: Array<{ game: Game; player: Participant }> = [];
    const maxCount = props.maxMatches || props.matchHistory.length;

    for (let i = 0; i < Math.min(props.matchHistory.length, maxCount); i++) {
      const game = props.matchHistory[i];
      const currentPlayer = findPlayerInGame(game, props.summoner);
      if (currentPlayer) {
        result.push({ game, player: currentPlayer });
      }
    }

    return result;
  }
);
</script>

<template>
  <div class="overflow-hidden">
    <div
      v-for="({ game, player }, index) in validMatches"
      :key="game.json.gameId"
      class="relative overflow-hidden border-l-4"
      :class="{
        'border-l-emerald-500 bg-gradient-to-r from-emerald-50/60 via-emerald-50/30 to-emerald-50/10 shadow-emerald-100/50 dark:border-l-emerald-400 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-950/5 dark:shadow-emerald-900/20':
          player.win,
        'border-l-red-500 bg-gradient-to-r from-red-50/60 via-red-50/30 to-red-50/10 shadow-red-100/50 dark:border-l-red-400 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-950/5 dark:shadow-red-900/20':
          !player.win,
      }"
      style="box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1)"
    >
      <!-- 分隔线 (除了第一项) -->
      <div
        v-if="index > 0"
        class="via-border/40 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />

      <!-- 胜负纹理背景 -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.03]"
        :class="{
          'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.400)_0%,_transparent_50%)]':
            player.win,
          'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.red.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.red.400)_0%,_transparent_50%)]':
            !player.win,
        }"
      />

      <!-- 左侧强化指示条 -->
      <div
        class="absolute top-0 left-0 h-full w-1 opacity-80"
        :class="{
          'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600':
            player.win,
          'bg-gradient-to-b from-red-400 via-red-500 to-red-600': !player.win,
        }"
      />

      <!-- 右侧装饰条纹 -->
      <div
        class="absolute top-0 right-0 h-full w-2 opacity-20"
        :class="{
          'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.400),_theme(colors.emerald.400)_2px,_transparent_2px,_transparent_8px)]':
            player.win,
          'bg-[repeating-linear-gradient(45deg,_theme(colors.red.400),_theme(colors.red.400)_2px,_transparent_2px,_transparent_8px)]':
            !player.win,
        }"
      />

      <div class="relative flex items-start gap-1 p-2 pl-3">
        <!-- 英雄头像 -->
        <div class="relative flex-shrink-0">
          <img
            :src="staticAssets.getChampionIcon(`${player.championId}`)"
            :alt="`英雄${player.championId}`"
            class="h-12 w-12 rounded-lg object-cover"
            :class="{
              'shadow-lg ring-2 shadow-emerald-500/25 ring-emerald-400':
                player.win,
              'shadow-lg ring-2 shadow-red-500/25 ring-red-400': !player.win,
            }"
          />
          <!-- 英雄头像装饰光效 -->
          <div
            class="pointer-events-none absolute inset-0 rounded-lg opacity-20"
            :class="{
              'bg-gradient-to-br from-emerald-400/30 to-transparent':
                player.win,
              'bg-gradient-to-br from-red-400/30 to-transparent': !player.win,
            }"
          />
        </div>

        <!-- 召唤师技能 + 天赋 -->
        <div class="mt-0.5 flex flex-shrink-0 items-start gap-1.5">
          <!-- 召唤师技能 -->
          <div class="flex flex-col gap-1">
            <img
              :src="staticAssets.getSpellIcon(`${player.spell1Id}`)"
              :alt="`召唤师技能${player.spell1Id}`"
              class="border-border/40 h-5 w-5 border object-cover shadow-sm"
            />
            <img
              :src="staticAssets.getSpellIcon(`${player.spell2Id}`)"
              :alt="`召唤师技能${player.spell2Id}`"
              class="border-border/40 h-5 w-5 border object-cover shadow-sm"
            />
          </div>

          <!-- 天赋系 -->
          <div class="flex flex-col gap-1">
            <!-- 主要天赋系 -->
            <div class="relative h-5 w-5">
              <img
                v-if="getPlayerRunes(player)[0]"
                :src="staticAssets.getRuneIcon(`${getPlayerRunes(player)[0]}`)"
                :alt="`主要天赋系${getPlayerRunes(player)[0]}`"
                class="border-border/40 h-full w-full rounded border object-cover shadow-sm"
                title="主要天赋系"
              />
              <div
                v-else
                class="border-border/20 bg-muted/30 h-full w-full rounded border"
                title="主要天赋系"
              />
            </div>

            <!-- 次要天赋系 -->
            <div class="relative h-5 w-5">
              <img
                v-if="getPlayerRunes(player)[1]"
                :src="staticAssets.getRuneIcon(`${getPlayerRunes(player)[1]}`)"
                :alt="`次要天赋系${getPlayerRunes(player)[1]}`"
                class="border-border/40 h-full w-full rounded border object-cover shadow-sm"
                title="次要天赋系"
              />
              <div
                v-else
                class="border-border/20 bg-muted/30 h-full w-full rounded border"
                title="次要天赋系"
              />
            </div>
          </div>
        </div>

        <!-- 比赛信息 -->
        <div class="flex h-12 min-w-0 flex-1 flex-col justify-center gap-1">
          <div class="flex items-center justify-between">
            <!-- 游戏模式 -->
            <h4
              class="truncate text-sm font-semibold"
              :class="{
                'text-emerald-800 dark:text-emerald-200': player.win,
                'text-red-800 dark:text-red-200': !player.win,
              }"
            >
              {{ getQueueName(game.json.queueId) }}
            </h4>

            <!-- 游戏开始时间 (在小屏幕时隐藏) -->
            <span
              class="font-tektur-numbers hidden text-xs xl:block"
              :class="{
                'text-emerald-600 dark:text-emerald-400': player.win,
                'text-red-600 dark:text-red-400': !player.win,
              }"
            >
              {{ formatDateToDay(game.json.gameCreation) }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <!-- KDA -->
            <div class="flex items-center gap-1">
              <div
                class="font-tektur-numbers font-bold"
                :class="{
                  'text-emerald-700 dark:text-emerald-300': player.win,
                  'text-red-700 dark:text-red-300': !player.win,
                }"
              >
                {{ player.kills || 0 }}/{{ player.deaths || 0 }}/{{
                  player.assists || 0
                }}
              </div>
              <Badge
                variant="secondary"
                class="font-tektur-numbers px-1 py-0.5 text-xs font-bold shadow-sm"
                :class="{
                  'border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300':
                    calculateKDA(
                      player.kills || 0,
                      player.deaths || 0,
                      player.assists || 0
                    ).ratio >= 3,
                  'border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-300':
                    calculateKDA(
                      player.kills || 0,
                      player.deaths || 0,
                      player.assists || 0
                    ).ratio >= 2 &&
                    calculateKDA(
                      player.kills || 0,
                      player.deaths || 0,
                      player.assists || 0
                    ).ratio < 3,
                  'border border-red-200 bg-red-100 text-red-800 dark:border-red-700 dark:bg-red-900/60 dark:text-red-300':
                    calculateKDA(
                      player.kills || 0,
                      player.deaths || 0,
                      player.assists || 0
                    ).ratio < 2,
                }"
              >
                {{
                  calculateKDA(
                    player.kills || 0,
                    player.deaths || 0,
                    player.assists || 0
                  ).ratio.toFixed(2)
                }}
              </Badge>
            </div>

            <!-- 游戏时长 (在小屏幕时隐藏) -->
            <span
              class="font-tektur-numbers hidden text-xs xl:block"
              :class="{
                'text-emerald-600 dark:text-emerald-400': player.win,
                'text-red-600 dark:text-red-400': !player.win,
              }"
            >
              {{ formatGameDuration(game.json.gameDuration) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
