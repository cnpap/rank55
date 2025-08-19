<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { GameModesFilter, ProcessedMatch } from '@/types/match-history-ui';
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

withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 20,
  totalMatches: 0,
});

defineEmits<Emits>();
</script>

<template>
  <!-- 对局列表 -->
  <MatchList
    :matches="filteredMatches"
    :expanded-matches="expandedMatches"
    :is-loading="isLoading"
    :has-data="hasData"
    :has-summoner="hasSummoner"
    @toggle-match-detail="$emit('toggleMatchDetail', $event)"
  />
</template>
