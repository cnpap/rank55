<script setup lang="ts">
import { ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { ChampionData } from '@/types/champion';
import { gameAssets, staticAssets } from '@/assets/data-assets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical } from 'lucide-vue-next';

interface Props {
  champions: ChampionData[];
  type: 'ban' | 'pick';
}

interface Emits {
  (e: 'remove', index: number): void;
  (e: 'reorder', champions: ChampionData[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用本地响应式数据来处理拖拽
const localChampions = ref<ChampionData[]>([...props.champions]);

// 监听props变化，同步到本地数据
watch(
  () => props.champions,
  newChampions => {
    localChampions.value = [...newChampions];
  },
  { deep: true }
);

function getChampionImageUrl(championKey: string): string {
  return gameAssets.getChampionIcon(championKey);
}

function handleRemove(index: number) {
  emit('remove', index);
}

// 拖拽结束时触发
function onEnd() {
  emit('reorder', localChampions.value);
}
</script>

<template>
  <div>
    <!-- 拖拽列表 -->
    <VueDraggable
      v-if="champions.length > 0"
      v-model="localChampions"
      :animation="200"
      :delay="0"
      :force-fallback="false"
      :fallback-tolerance="0"
      :touch-start-threshold="5"
      :disabled="false"
      ghost-class="ghost-item"
      chosen-class="chosen-item"
      drag-class="drag-item"
      handle=".drag-handle"
      class="grid grid-cols-8 gap-3"
      @end="onEnd"
    >
      <div
        v-for="(champion, index) in localChampions"
        :key="champion.id"
        class="group relative aspect-square"
      >
        <!-- 英雄头像容器 -->
        <div class="relative h-full w-full">
          <img
            :src="getChampionImageUrl(champion.key)"
            :alt="champion.name"
            :title="champion.name"
            class="h-full w-full border-2 object-cover transition-all duration-200 group-hover:scale-105"
            :class="type === 'ban' ? 'border-red-500' : 'border-blue-500'"
          />

          <!-- 拖拽手柄 -->
          <div
            class="drag-handle absolute inset-0 cursor-move opacity-0 transition-opacity group-hover:opacity-100"
          >
            <div
              class="absolute inset-0 flex items-center justify-center bg-black/40"
            >
              <GripVertical class="h-4 w-4 text-white" />
            </div>
          </div>

          <!-- 删除按钮 -->
          <span
            @click="handleRemove(index)"
            class="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <img
              :src="staticAssets.getIcon('close')"
              alt="删除"
              class="h-5 w-5"
            />
          </span>
        </div>
      </div>
    </VueDraggable>

    <!-- 当没有选择英雄时显示空占位符 -->
    <div v-else class="grid grid-cols-8 gap-3">
      <div class="aspect-square border-2 border-dashed border-gray-300">
        <div class="flex h-full w-full items-center justify-center">
          <span class="text-xs text-gray-400 dark:text-gray-500">?</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 被选中的元素样式 */
:global(.chosen-item) {
  transform: scale(1.05) !important;
  z-index: 1000;
}

/* 拖拽中的元素样式 */
:global(.drag-item) {
  opacity: 0.9 !important;
  transform: rotate(2deg) scale(1.05) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  border-radius: 4px !important;
  z-index: 1001 !important;
}

/* 占位符样式 - 保持grid布局稳定 */
:global(.ghost-item) {
  opacity: 0.4 !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border-radius: 4px !important;
  transform: none !important;
  border: 2px dashed rgba(59, 130, 246, 0.3) !important;
  /* 保持aspect-ratio，避免布局抖动 */
  aspect-ratio: 1 !important;
}

:global(.ghost-item *) {
  opacity: 0 !important;
}

/* 确保拖拽容器稳定 */
:global(.vue-draggable-plus) {
  min-height: 48px;
}

/* 自定义grid列数 */
@media (min-width: 1024px) {
  .lg\:grid-cols-14 {
    grid-template-columns: repeat(14, minmax(0, 1fr));
  }
}
</style>
