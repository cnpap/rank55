<script setup lang="ts">
import { computed } from 'vue';
import type { ChampionData } from '@/types/champion';
import Loading from '@/components/Loading.vue';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  champions: ChampionData[];
  selectedChampionIds: string[];
  searchTerm: string;
  isLoading: boolean;
  selectionType: 'ban' | 'pick';
}

interface Emits {
  (e: 'toggle-champion', champion: ChampionData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const filteredChampions = computed(() => {
  if (!props.searchTerm) {
    return props.champions;
  }

  const term = props.searchTerm.toLowerCase();
  return props.champions.filter(champion => {
    // 优先使用 query 字段进行搜索（包含拼音）
    if (champion.query) {
      return champion.query.toLowerCase().includes(term);
    }

    // 降级处理：如果没有 query 字段，使用原有逻辑
    return (
      champion.name.toLowerCase().includes(term) ||
      champion.id.toLowerCase().includes(term) ||
      champion.title.toLowerCase().includes(term)
    );
  });
});

function getChampionImageUrl(championKey: string): string {
  return staticAssets.getChampionIcon(championKey);
}

function isChampionSelected(championId: string): boolean {
  return props.selectedChampionIds.includes(championId);
}

function handleToggleChampion(champion: ChampionData) {
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
        class="cursor-pointer rounded p-1 transition-colors"
        :class="
          isChampionSelected(champion.id)
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        "
      >
        <img
          :src="getChampionImageUrl(champion.key)"
          :alt="champion.name"
          :title="champion.name"
          class="rounded border-2 object-cover"
          :class="
            isChampionSelected(champion.id)
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
