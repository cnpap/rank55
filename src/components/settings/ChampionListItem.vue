<script setup lang="ts">
import { computed } from 'vue';
import { staticAssets } from '@/assets/data-assets';
import type { ChampionSummary } from '@/types/lol-game-data';
import type { Position } from '@/lib/service/opgg/types';
import type { AssignedPosition } from '@/types/players-info';
import { GripVertical, X } from 'lucide-vue-next';

interface Props {
  champion: ChampionSummary;
  position?: AssignedPosition; // 当前位置，用于获取对应位置的段位信息
  index?: number; // 序号
  showDragHandle?: boolean; // 是否显示拖拽手柄
  showIndex?: boolean; // 是否显示序号
  showTierInfo?: boolean; // 是否显示段位信息
  showDeleteButton?: boolean; // 是否显示删除按钮
  variant?: 'ban' | 'pick' | 'default'; // 样式变体
}

interface Emits {
  (e: 'delete'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showDragHandle: false,
  showIndex: false,
  showTierInfo: true,
  showDeleteButton: false,
  variant: 'default',
});

const emit = defineEmits<Emits>();

// 获取当前位置的段位信息
const positionData = computed((): Position | null => {
  if (!props.position || !props.champion.positions) return null;

  return (
    props.champion.positions.find(
      pos => pos.name.toLowerCase() === props.position?.toLowerCase()
    ) || null
  );
});

// 获取段位颜色样式
function getTierColorClass(tier: number): string {
  switch (tier) {
    case 1:
      return 'bg-blue-500'; // 蓝色
    case 2:
      return 'bg-green-500'; // 绿色
    case 3:
      return 'bg-yellow-500'; // 黄色
    case 4:
      return 'bg-gray-500'; // 灰色
    case 5:
      return 'bg-amber-700'; // 褐色
    default:
      return 'bg-gray-400'; // 默认灰色
  }
}

// 获取英雄头像URL
function getChampionImageUrl(championKey: string | number): string {
  return staticAssets.getChampionIcon(championKey as string);
}

// 处理删除事件
function handleDelete() {
  emit('delete');
}
</script>

<template>
  <div class="font-tektur-numbers bg-card flex items-center border">
    <!-- 拖拽手柄 -->
    <div
      v-if="showDragHandle"
      class="drag-handle flex cursor-move items-center justify-center self-stretch border-r border-gray-200 px-2 dark:border-gray-700"
    >
      <GripVertical class="h-4 w-4 text-gray-400" />
    </div>

    <div class="flex flex-1 items-center gap-3 py-1 pl-2">
      <!-- 英雄头像 -->
      <img
        :src="getChampionImageUrl(champion.id)"
        :alt="champion.name"
        :title="champion.name"
        class="h-10 w-10 flex-shrink-0 border-1"
      />

      <!-- 英雄信息 -->
      <div class="min-w-0 flex-1">
        <!-- 英雄名称 -->
        <div
          class="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ champion.name }}
        </div>

        <!-- 段位信息 -->
        <div v-if="showTierInfo && positionData?.stats?.tier_data">
          <span
            :class="`inline-flex items-center rounded-md px-1.5 text-xs font-bold text-white ${getTierColorClass(positionData.stats.tier_data.tier)}`"
          >
            T{{ positionData.stats.tier_data.tier }}
            <span class="ml-1 text-xs opacity-75">
              #{{ positionData.stats.tier_data.rank || '-' }}
            </span>
          </span>
        </div>

        <!-- 无段位信息时的占位 -->
        <div v-else-if="showTierInfo">
          <span class="text-xs text-gray-400">#</span>
        </div>
      </div>
    </div>

    <!-- 序号 -->
    <!-- <div
      v-if="showIndex"
      class="mx-2 flex h-5 w-7 items-center justify-center text-xs font-bold"
    >
      {{ index !== undefined ? (index === 0 ? '首选' : index + 1) : '' }}
    </div> -->

    <!-- 删除按钮 -->
    <div
      v-if="showDeleteButton"
      @click="handleDelete"
      class="delete-btn flex cursor-pointer items-center justify-center self-stretch border-l border-gray-200 px-2 dark:border-gray-700"
    >
      <X class="h-4 w-4" />
    </div>
  </div>
</template>

<style scoped>
/* 组件样式继承父组件的拖拽样式 */

.delete-btn {
  transition: all 0.15s ease;
}

.delete-btn:hover {
  background-color: #ef4444;
}

.delete-btn:hover svg {
  color: white;
}

.delete-btn:active {
  transform: scale(0.95);
}
</style>
