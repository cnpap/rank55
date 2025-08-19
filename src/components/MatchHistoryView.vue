<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GameModesFilter, ProcessedMatch } from '@/types/match-history-ui';
import MatchHistoryHeader from './MatchHistoryHeader.vue';
import MatchList from './MatchList.vue';

interface Props {
  filteredMatches: ProcessedMatch[];
  gameModesFilter: GameModesFilter;
  expandedMatches: Set<number>;
  isLoading: boolean;
  hasData: boolean;
  hasSummoner: boolean;
  currentPage?: number;
  pageSize?: number;
  totalMatches?: number;
}

interface Emits {
  (e: 'update:gameModesFilter', value: GameModesFilter): void;
  (e: 'toggleMatchDetail', gameId: number): void;
  (e: 'update:currentPage', page: number): void;
  (e: 'update:pageSize', size: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 20,
  totalMatches: 0,
});

const emit = defineEmits<Emits>();

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
</script>

<template>
  <div class="space-y-4">
    <!-- 用于监测 sticky 的哨兵元素 -->
    <div ref="sentinelRef" class="h-0"></div>

    <!-- 新的战绩头部组件 - 添加 sticky 定位和背景遮罩 -->
    <div class="sticky top-10 z-50">
      <!-- 头部组件 -->
      <div class="relative">
        <MatchHistoryHeader
          :model-value="gameModesFilter"
          :matches="filteredMatches"
          :current-page="currentPage"
          :page-size="pageSize"
          :total-matches="totalMatches"
          :is-sticky="isSticky"
          @update:model-value="$emit('update:gameModesFilter', $event)"
          @update:current-page="$emit('update:currentPage', $event)"
          @update:page-size="$emit('update:pageSize', $event)"
        />
      </div>
    </div>

    <!-- 对局列表 -->
    <MatchList
      :matches="filteredMatches"
      :expanded-matches="expandedMatches"
      :is-loading="isLoading"
      :has-data="hasData"
      :has-summoner="hasSummoner"
      @toggle-match-detail="$emit('toggleMatchDetail', $event)"
    />
  </div>
</template>
