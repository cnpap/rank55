<script setup lang="ts">
import { computed } from 'vue';
import Loading from '@/components/Loading.vue';
import { staticAssets } from '@/assets/data-assets';
import { ChampionSummary } from '@/types/lol-game-data';

interface Props {
  champions: ChampionSummary[];
  selectedChampionIds: string[];
  searchTerm: string;
  isLoading: boolean;
  selectionType: 'ban' | 'pick';
}
console.log();

interface Emits {
  (e: 'toggle-champion', champion: ChampionSummary): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const filteredChampions = computed(() => {
  if (!props.searchTerm) {
    return props.champions;
  }

  const term = props.searchTerm.toLowerCase();
  return props.champions.filter(
    champion =>
      champion.name.toLowerCase().includes(term) ||
      champion.id.toString().toLowerCase().includes(term) ||
      champion.description.toLowerCase().includes(term) ||
      champion.alias.toLowerCase().includes(term)
  );
});

function handleToggleChampion(champion: ChampionSummary) {
  emit('toggle-champion', champion);
}
</script>

<template>
  <div class="h-full overflow-y-auto p-1">
    <!-- 加载状态 - 在可滚动区域的水平垂直中心 -->
    <div v-if="isLoading" class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center text-center">
        <Loading size="lg" class="text-primary mb-4" />
        <p class="text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 英雄网格 -->
    <div v-else class="grid grid-cols-8 gap-0.5">
      <div
        v-for="champion in filteredChampions"
        :key="champion.id"
        @click="handleToggleChampion(champion)"
        class="cursor-pointer p-1 transition-colors"
        :class="
          selectedChampionIds.includes(champion.id.toString())
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        "
      >
        <img
          :src="staticAssets.getChampionIcon(champion.id)"
          :alt="champion.name"
          :title="champion.name"
          class="border-2 object-cover"
          :class="
            selectedChampionIds.includes(champion.id.toString())
              ? selectionType === 'ban'
                ? 'border-red-500'
                : 'border-blue-500'
              : 'border-gray-300 dark:border-gray-600'
          "
        />
      </div>
    </div>
  </div>
</template>
