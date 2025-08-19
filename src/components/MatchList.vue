<script setup lang="ts">
import type { ProcessedMatch } from '@/types/match-history-ui';
import MatchListItem from './MatchListItem.vue';

interface Props {
  matches: ProcessedMatch[];
  expandedMatches: Set<number>;
  isLoading: boolean;
  hasData: boolean;
  hasSummoner: boolean;
}

interface Emits {
  (e: 'toggle-match-detail', gameId: number): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <!-- 加载状态 -->
  <div
    v-if="isLoading"
    class="bg-card/50 border-border/40 border-r border-b border-l p-8 text-center backdrop-blur-sm"
  >
    <div
      class="bg-muted/40 mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full"
    >
      <svg
        class="text-muted-foreground h-8 w-8 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        ></path>
      </svg>
    </div>
    <h3 class="text-foreground mb-2 text-base font-medium">正在加载数据...</h3>
    <p class="text-muted-foreground text-sm">请稍候</p>
  </div>
  <template v-else>
    <!-- 无匹配结果提示 -->
    <div
      v-if="matches.length === 0"
      class="bg-card/50 hover:bg-card/70 border-border/40 h-screen border-r border-b border-l p-8 text-center backdrop-blur-sm transition-all duration-200"
    >
      <div
        class="bg-muted/40 hover:bg-muted/60 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200"
      >
        <svg
          class="text-muted-foreground h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      </div>
      <h3 class="text-foreground mb-2 text-base font-medium">
        <div v-if="!hasData">暂无比赛历史数据</div>
        <div v-else-if="!hasSummoner">暂无召唤师信息</div>
        <div v-else>没有符合筛选条件的比赛记录</div>
      </h3>
      <p class="text-muted-foreground text-sm">请调整筛选条件或稍后再试</p>
    </div>
    <!-- 战绩列表 -->
    <MatchListItem
      v-else
      v-for="match in matches"
      :key="match.gameId"
      :match="match"
      :is-expanded="expandedMatches.has(match.gameId)"
      @toggle-detail="$emit('toggle-match-detail', match.gameId)"
    />
  </template>
</template>
