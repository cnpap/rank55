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
const getQueueName = (queueId: number, gameDuration: number): string => {
  // 如果游戏时长小于5分钟，显示为重开
  if (gameDuration < 300) {
    return '重开';
  }
  const queueKey = `q_${queueId}` as keyof typeof GAME_MODE_TAGS;
  return GAME_MODE_TAGS[queueKey] || '未知模式';
};

// 判断是否为重开游戏
const isRemakeGame = (gameDuration: number): boolean => {
  return gameDuration < 300; // 5分钟 = 300秒
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
  <div class="gap-2 overflow-hidden pt-1">
    <div
      v-for="({ game, player }, index) in validMatches"
      :key="game.json.gameId"
      class="group bg-card relative mb-1 overflow-hidden border transition-all duration-300"
    >
      <!-- 胜负纹理背景 -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.04]"
        :class="{
          'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.300)_0%,_transparent_50%)]':
            player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.pink.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.pink.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.rose.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.rose.300)_0%,_transparent_50%)]':
            !player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gray.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.gray.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gray.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.gray.300)_0%,_transparent_50%)]':
            isRemakeGame(game.json.gameDuration),
        }"
      />

      <!-- 左侧装饰条纹 -->
      <div
        class="absolute top-0 left-0 h-full w-2 opacity-60 dark:opacity-40"
        :class="{
          'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.600),_theme(colors.emerald.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.500),_theme(colors.emerald.500)_3px,_transparent_3px,_transparent_6px)]':
            player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[repeating-linear-gradient(45deg,_theme(colors.pink.600),_theme(colors.pink.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.rose.500),_theme(colors.rose.500)_3px,_transparent_3px,_transparent_6px)]':
            !player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[repeating-linear-gradient(45deg,_theme(colors.gray.600),_theme(colors.gray.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.gray.500),_theme(colors.gray.500)_3px,_transparent_3px,_transparent_6px)]':
            isRemakeGame(game.json.gameDuration),
        }"
      />

      <!-- 右侧装饰条纹 -->
      <div
        class="absolute top-0 right-0 h-full w-2 opacity-60 dark:opacity-40"
        :class="{
          'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.600),_theme(colors.emerald.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.500),_theme(colors.emerald.500)_3px,_transparent_3px,_transparent_6px)]':
            player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[repeating-linear-gradient(45deg,_theme(colors.pink.600),_theme(colors.pink.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.rose.500),_theme(colors.rose.500)_3px,_transparent_3px,_transparent_6px)]':
            !player.win && !isRemakeGame(game.json.gameDuration),
          'bg-[repeating-linear-gradient(45deg,_theme(colors.gray.600),_theme(colors.gray.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.gray.500),_theme(colors.gray.500)_3px,_transparent_3px,_transparent_6px)]':
            isRemakeGame(game.json.gameDuration),
        }"
      />

      <div class="relative flex items-start gap-1 p-2 px-3">
        <!-- 英雄头像 -->
        <div class="relative flex-shrink-0">
          <img
            :src="staticAssets.getChampionIcon(`${player.championId}`)"
            :alt="`英雄${player.championId}`"
            class="h-12 w-12"
          />
          <!-- 英雄头像装饰光效 -->
          <div
            class="pointer-events-none absolute inset-0 rounded-lg opacity-20"
            :class="{
              'bg-gradient-to-br from-emerald-400/30 to-transparent':
                player.win && !isRemakeGame(game.json.gameDuration),
              'bg-gradient-to-br from-pink-400/30 to-transparent dark:from-rose-400/30':
                !player.win && !isRemakeGame(game.json.gameDuration),
              'bg-gradient-to-br from-gray-400/30 to-transparent': isRemakeGame(
                game.json.gameDuration
              ),
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
            <h4 class="truncate text-sm font-semibold">
              {{ getQueueName(game.json.queueId, game.json.gameDuration) }}
            </h4>

            <!-- 游戏开始时间 (在小屏幕时隐藏) -->
            <span
              class="font-tektur-numbers hidden text-xs xl:block"
              :class="{
                'text-emerald-600 dark:text-emerald-400':
                  player.win && !isRemakeGame(game.json.gameDuration),
                'text-pink-600 dark:text-rose-400':
                  !player.win && !isRemakeGame(game.json.gameDuration),
                'text-gray-600 dark:text-gray-400': isRemakeGame(
                  game.json.gameDuration
                ),
              }"
            >
              {{ formatDateToDay(game.json.gameCreation) }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <!-- KDA -->
            <div class="flex items-center gap-1">
              <div class="font-tektur-numbers font-bold">
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
                  'border border-pink-200 bg-pink-100 text-pink-800 dark:border-rose-700 dark:bg-rose-900/60 dark:text-rose-300':
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
                'text-emerald-600 dark:text-emerald-400':
                  player.win && !isRemakeGame(game.json.gameDuration),
                'text-pink-600 dark:text-rose-400':
                  !player.win && !isRemakeGame(game.json.gameDuration),
                'text-gray-600 dark:text-gray-400': isRemakeGame(
                  game.json.gameDuration
                ),
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
