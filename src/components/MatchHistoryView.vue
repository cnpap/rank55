<script setup lang="ts">
import type { GameModesFilter, ProcessedMatch } from '@/types/match-history-ui';
import GameModeFilter from './GameModeFilter.vue';
import MatchList from './MatchList.vue';

interface Props {
  filteredMatches: ProcessedMatch[];
  gameModesFilter: GameModesFilter;
  expandedMatches: Set<number>;
  isLoading: boolean;
  hasData: boolean;
  hasSummoner: boolean;
}

interface Emits {
  (e: 'update:gameModesFilter', value: GameModesFilter): void;
  (e: 'toggleMatchDetail', gameId: number): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div class="space-y-4">
    <!-- 游戏模式过滤器 -->
    <GameModeFilter
      :model-value="gameModesFilter"
      @update:model-value="$emit('update:gameModesFilter', $event)"
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
