<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { SummonerData } from '@/types/summoner';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import { processBriefMatch, type BriefMatchData } from '@/lib/match-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import { SgpMatchHistoryResult } from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  // matchHistory: MatchHistoryType | null | undefined;
  matchHistory: SgpMatchHistoryResult | null | undefined;
  summoner: SummonerData | null | undefined;
}

const props = defineProps<Props>();

// 处理后的比赛数据
const processedMatches = computed((): BriefMatchData[] => {
  if (!props.matchHistory?.games || !props.summoner) {
    return [];
  }

  const matches = props.matchHistory.games;
  const result: BriefMatchData[] = [];

  for (const game of matches) {
    const briefMatch = processBriefMatch(
      game,
      props.summoner,
      formatGameDuration,
      getQueueName
    );

    if (briefMatch) {
      result.push(briefMatch);
    }
  }

  return result;
});
</script>

<template>
  <div>
    <div
      v-if="!matchHistory || processedMatches.length === 0"
      class="py-4 text-center"
    >
      <p class="text-muted-foreground text-xs">暂无战绩数据</p>
    </div>

    <div v-else class="overflow-hidden">
      <div
        v-for="(match, index) in processedMatches"
        :key="match.gameId"
        class="group hover:bg-muted/30 relative overflow-hidden transition-all duration-200"
        :class="{
          'border-emerald-200/70 bg-gradient-to-r from-emerald-50/30 to-emerald-50/10 dark:border-emerald-800/50 dark:from-emerald-950/20 dark:to-emerald-950/5':
            match.result === 'victory',
          'border-red-200/70 bg-gradient-to-r from-red-50/30 to-red-50/10 dark:border-red-800/50 dark:from-red-950/20 dark:to-red-950/5':
            match.result === 'defeat',
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
            'bg-emerald-500': match.result === 'victory',
            'bg-red-500': match.result === 'defeat',
          }"
        />

        <!-- 右侧微妙的胜负指示 -->
        <div
          class="absolute top-0 right-0 h-full w-0.5 opacity-30"
          :class="{
            'bg-gradient-to-b from-emerald-400/60 to-emerald-500/60':
              match.result === 'victory',
            'bg-gradient-to-b from-red-400/60 to-red-500/60':
              match.result === 'defeat',
          }"
        />

        <div class="flex items-center gap-2 p-2 pl-3">
          <!-- 英雄头像 -->
          <div class="relative flex-shrink-0">
            <img
              :src="staticAssets.getChampionIcon(`${match.championId}`)"
              :alt="`英雄${match.championId}`"
              class="ring-border/30 h-12 w-12 object-cover ring-2"
            />
          </div>

          <!-- 召唤师技能 + 天赋 -->
          <div class="flex flex-shrink-0 items-center gap-1.5">
            <!-- 召唤师技能 -->
            <div class="flex flex-col gap-1">
              <img
                :src="staticAssets.getSpellIcon(`${match.spells[0]}`)"
                :alt="`召唤师技能${match.spells[0]}`"
                class="border-border/40 h-5 w-5 border object-cover shadow-sm"
              />
              <img
                :src="staticAssets.getSpellIcon(`${match.spells[1]}`)"
                :alt="`召唤师技能${match.spells[1]}`"
                class="border-border/40 h-5 w-5 border object-cover shadow-sm"
              />
            </div>

            <!-- 天赋系 -->
            <div class="flex flex-col gap-1">
              <!-- 主要天赋系 -->
              <div class="relative h-5 w-5">
                <img
                  v-if="match.runes[0]"
                  :src="staticAssets.getRuneIcon(`${match.runes[0]}`)"
                  :alt="`主要天赋系${match.runes[0]}`"
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
                  v-if="match.runes[1]"
                  :src="staticAssets.getRuneIcon(`${match.runes[1]}`)"
                  :alt="`次要天赋系${match.runes[1]}`"
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
                {{ match.queueType }}
              </h4>

              <!-- 游戏开始时间 (在小屏幕时隐藏) -->
              <span class="text-muted-foreground hidden text-xs xl:block">
                {{ formatDateToDay(match.createdAt.toString()) }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <!-- KDA -->
              <div class="flex items-center gap-2">
                <div class="font-tektur-numbers text-foreground font-bold">
                  {{ match.kda.kills }}/{{ match.kda.deaths }}/{{
                    match.kda.assists
                  }}
                </div>
                <Badge
                  variant="secondary"
                  class="font-tektur-numbers px-1.5 py-0.5 text-xs font-bold"
                  :class="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                      match.kda.ratio >= 3,
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                      match.kda.ratio >= 2 && match.kda.ratio < 3,
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                      match.kda.ratio < 2,
                  }"
                >
                  {{ match.kda.ratio.toFixed(2) }}
                </Badge>
              </div>

              <!-- 游戏时长 (在小屏幕时隐藏) -->
              <span class="text-muted-foreground hidden text-xs xl:block">
                {{ match.duration }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
