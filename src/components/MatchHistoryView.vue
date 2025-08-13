<script setup lang="ts">
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

defineEmits<Emits>();
</script>

<template>
  <div class="space-y-4">
    <!-- 新的战绩头部组件 -->
    <MatchHistoryHeader
      :model-value="gameModesFilter"
      :matches="filteredMatches"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-matches="totalMatches"
      @update:model-value="$emit('update:gameModesFilter', $event)"
      @update:current-page="$emit('update:currentPage', $event)"
      @update:page-size="$emit('update:pageSize', $event)"
    />

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
