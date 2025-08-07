<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { MatchHistory as MatchHistoryType } from '@/types/match-history';
import type { SummonerData } from '@/types/summoner';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';
import { processBriefMatch, type BriefMatchData } from '@/lib/match-helpers';
import { gameAssets } from '@/assets/data-assets';
import { formatDateToDay } from '@/utils/date-utils';

interface Props {
  matchHistory: MatchHistoryType | null | undefined;
  summoner: SummonerData | null | undefined;
  maxMatches?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxMatches: 5,
});

// 处理后的比赛数据
const processedMatches = computed((): BriefMatchData[] => {
  if (!props.matchHistory?.games?.games || !props.summoner) {
    return [];
  }

  const matches = props.matchHistory.games.games.slice(0, props.maxMatches);
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
        class="group relative overflow-hidden transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/20"
        :class="{
          'bg-gradient-to-r from-emerald-50/30 via-emerald-50/10 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/5 dark:to-transparent':
            match.result === 'victory',
          'bg-gradient-to-r from-red-50/30 via-red-50/10 to-transparent dark:from-red-950/20 dark:via-red-950/5 dark:to-transparent':
            match.result === 'defeat',
        }"
      >
        <!-- 分隔线 (除了第一项) -->
        <div
          v-if="index > 0"
          class="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-600/60"
        />

        <!-- 胜负状态指示条 -->
        <div
          class="absolute top-0 left-0 h-full w-1"
          :class="{
            'bg-gradient-to-b from-emerald-500/90 to-emerald-600/90':
              match.result === 'victory',
            'bg-gradient-to-b from-red-500/90 to-red-600/90':
              match.result === 'defeat',
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

        <div class="flex items-center gap-1.5 p-1.5 pl-2.5">
          <!-- 英雄头像 -->
          <div class="relative flex-shrink-0">
            <img
              :src="gameAssets.getChampionIcon(`${match.championId}`)"
              :alt="`英雄${match.championId}`"
              class="h-11 w-11 rounded object-cover ring-1 ring-slate-300/40 dark:ring-slate-600/40"
            />
          </div>

          <!-- 召唤师技能 + 天赋 -->
          <div class="flex flex-shrink-0 items-center gap-1.5">
            <!-- 召唤师技能 -->
            <div class="flex flex-col gap-1">
              <img
                :src="gameAssets.getSpellIcon(`${match.spells[0]}`)"
                :alt="`召唤师技能${match.spells[0]}`"
                class="h-5 w-5 rounded object-cover shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50"
              />
              <img
                :src="gameAssets.getSpellIcon(`${match.spells[1]}`)"
                :alt="`召唤师技能${match.spells[1]}`"
                class="h-5 w-5 rounded object-cover shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50"
              />
            </div>

            <!-- 天赋系 -->
            <div class="flex flex-col gap-1">
              <!-- 主要天赋系 -->
              <div class="relative h-5 w-5">
                <img
                  v-if="match.runes[0]"
                  :src="gameAssets.getRuneIcon(`${match.runes[0]}`)"
                  :alt="`主要天赋系${match.runes[0]}`"
                  class="h-full w-full rounded object-cover shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50"
                  title="主要天赋系"
                />
                <div
                  v-else
                  class="h-full w-full rounded border border-slate-200/60 bg-slate-100/50 dark:border-slate-600/40 dark:bg-slate-700/30"
                  title="主要天赋系"
                />
              </div>

              <!-- 次要天赋系 -->
              <div class="relative h-5 w-5">
                <img
                  v-if="match.runes[1]"
                  :src="gameAssets.getRuneIcon(`${match.runes[1]}`)"
                  :alt="`次要天赋系${match.runes[1]}`"
                  class="h-full w-full rounded object-cover shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50"
                  title="次要天赋系"
                />
                <div
                  v-else
                  class="h-full w-full rounded border border-slate-200/60 bg-slate-100/50 dark:border-slate-600/40 dark:bg-slate-700/30"
                  title="次要天赋系"
                />
              </div>
            </div>
          </div>

          <!-- 比赛信息 -->
          <div class="flex h-11 min-w-0 flex-1 flex-col justify-center gap-0.5">
            <div class="flex items-center justify-between">
              <!-- 游戏模式 -->
              <span
                class="text-muted-foreground truncate text-sm font-medium"
                >{{ match.queueType }}</span
              >

              <!-- 游戏开始时间 (在小屏幕时隐藏) -->
              <span class="text-muted-foreground hidden text-sm xl:block">
                {{ formatDateToDay(match.createdAt.toString()) }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <!-- KDA -->
              <div class="flex items-center gap-1.5">
                <span class="font-tektur-numbers font-semibold">
                  {{ match.kda.kills }}/{{ match.kda.deaths }}/{{
                    match.kda.assists
                  }}
                </span>
                <Badge
                  variant="secondary"
                  class="font-tektur-numbers px-1.5 py-0.5 text-sm"
                  :class="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                      match.kda.ratio >= 3,
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                      match.kda.ratio >= 2 && match.kda.ratio < 3,
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                      match.kda.ratio < 2,
                  }"
                >
                  {{ match.kda.ratio.toFixed(1) }}
                </Badge>
              </div>

              <!-- 游戏时长 (在小屏幕时隐藏) -->
              <span class="text-muted-foreground hidden text-sm xl:block">
                {{ match.duration }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
