<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { SummonerData } from '@/types/summoner';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import {
  findPlayerInGame,
  calculateKDA,
  getPlayerRunes,
} from '@/lib/match-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import {
  SgpMatchHistoryResult,
  type Game,
  type Participant,
} from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  matchHistory: SgpMatchHistoryResult;
  summoner: SummonerData;
}

const props = defineProps<Props>();

// 过滤出当前召唤师参与的比赛
const validMatches = computed(
  (): Array<{ game: Game; player: Participant }> => {
    const result: Array<{ game: Game; player: Participant }> = [];

    for (const game of props.matchHistory.games) {
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
      class="group hover:bg-muted/30 relative overflow-hidden transition-all duration-200"
      :class="{
        'border-emerald-200/70 bg-gradient-to-r from-emerald-50/30 to-emerald-50/10 dark:border-emerald-800/50 dark:from-emerald-950/20 dark:to-emerald-950/5':
          player.win,
        'border-red-200/70 bg-gradient-to-r from-red-50/30 to-red-50/10 dark:border-red-800/50 dark:from-red-950/20 dark:to-red-950/5':
          !player.win,
      }"
    >
      <!-- 分隔线 (除了第一项) -->
      <div
        v-if="index > 0"
        class="via-border/60 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />

      <!-- 胜负状态指示条 -->
      <div
        class="absolute top-0 left-0 h-full w-[1.5px]"
        :class="{
          'bg-emerald-500': player.win,
          'bg-red-500': !player.win,
        }"
      />

      <!-- 右侧微妙的胜负指示 -->
      <div
        class="absolute top-0 right-0 h-full w-0.5 opacity-30"
        :class="{
          'bg-gradient-to-b from-emerald-400/60 to-emerald-500/60': player.win,
          'bg-gradient-to-b from-red-400/60 to-red-500/60': !player.win,
        }"
      />

      <div class="flex items-center gap-2 p-2 pl-3">
        <!-- 英雄头像 -->
        <div class="relative flex-shrink-0">
          <img
            :src="staticAssets.getChampionIcon(`${player.championId}`)"
            :alt="`英雄${player.championId}`"
            class="ring-border/30 h-12 w-12 object-cover ring-2"
          />
        </div>

        <!-- 召唤师技能 + 天赋 -->
        <div class="flex flex-shrink-0 items-center gap-1.5">
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
            <h4 class="text-foreground truncate text-sm font-semibold">
              {{ getQueueName(game.json.queueId) }}
            </h4>

            <!-- 游戏开始时间 (在小屏幕时隐藏) -->
            <span class="text-muted-foreground hidden text-xs xl:block">
              {{ formatDateToDay(game.json.gameCreation.toString()) }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <!-- KDA -->
            <div class="flex items-center gap-2">
              <div class="font-tektur-numbers text-foreground font-bold">
                {{ player.kills || 0 }}/{{ player.deaths || 0 }}/{{
                  player.assists || 0
                }}
              </div>
              <Badge
                variant="secondary"
                class="font-tektur-numbers px-1.5 py-0.5 text-xs font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                    calculateKDA(
                      player.kills || 0,
                      player.deaths || 0,
                      player.assists || 0
                    ).ratio >= 3,
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
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
                  'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
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
            <span class="text-muted-foreground hidden text-xs xl:block">
              {{ formatGameDuration(game.json.gameDuration) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
