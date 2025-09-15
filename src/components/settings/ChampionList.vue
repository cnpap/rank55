<script setup lang="ts">
import { computed } from 'vue';
import Loading from '@/components/Loading.vue';
import { staticAssets } from '@/assets/data-assets';
import { ChampionSummary } from '@/types/lol-game-data';
import type { AssignedPosition } from '@/types/players-info';

interface Props {
  champions: ChampionSummary[];
  selectedChampionIds: string[];
  searchTerm: string;
  positionFilter: AssignedPosition | 'all';
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
  let champions = props.champions;

  // 过滤掉末日人机
  champions = champions.filter(
    champion => !champion.name.startsWith('末日人机')
  );

  // 位置过滤
  if (props.positionFilter !== 'all') {
    champions = champions.filter(champion => {
      // 检查英雄的positions数组中是否包含选中的位置
      return (
        champion.positions &&
        champion.positions.some(
          position => position.name.toLowerCase() === props.positionFilter
        )
      );
    });
  }

  // 搜索过滤
  if (props.searchTerm) {
    const term = props.searchTerm.toLowerCase();
    champions = champions.filter(champion =>
      champion.query.toLowerCase().includes(term)
    );
  }

  return champions;
});

function handleToggleChampion(champion: ChampionSummary) {
  emit('toggle-champion', champion);
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <!-- 加载状态 - 在可滚动区域的水平垂直中心 -->
    <div v-if="isLoading" class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center text-center">
        <Loading size="lg" class="text-primary mb-4" />
        <p class="text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 英雄网格 -->
    <div v-else class="grid grid-cols-7 gap-2 p-3 !pt-0">
      <div
        v-for="champion in filteredChampions"
        :key="champion.id"
        @click="handleToggleChampion(champion)"
        class="aspect-square cursor-pointer transition-colors"
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
          class="h-full w-full object-cover transition-all duration-200"
          :class="
            selectedChampionIds.includes(champion.id.toString())
              ? selectionType === 'ban'
                ? 'border-2 border-red-500'
                : 'border-2 border-green-500'
              : 'border-2 border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义grid列数 */
@media (min-width: 1024px) {
  .lg\:grid-cols-14 {
    grid-template-columns: repeat(14, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .xl\:grid-cols-16 {
    grid-template-columns: repeat(16, minmax(0, 1fr));
  }
}
</style>
