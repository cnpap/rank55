<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { PositionSettings } from '@/storages/storage-use';
import type { AssignedPosition } from '@/types/players-info';
import ChampionSelector from './ChampionSelector.vue';
import ChampionListItem from './ChampionListItem.vue';
import { GripVertical, Plus } from 'lucide-vue-next';
import { staticAssets } from '@/assets/data-assets';
import { positions } from '@/config/position-config';
import { usePositionChampionSettings } from '@/lib/composables/usePositionChampionSettings';

// Props
interface Props {
  modelValue?: PositionSettings;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    top: { banChampions: [], pickChampions: [] },
    jungle: { banChampions: [], pickChampions: [] },
    middle: { banChampions: [], pickChampions: [] },
    bottom: { banChampions: [], pickChampions: [] },
    support: { banChampions: [], pickChampions: [] },
  }),
});

// 当前选中的位置
const selectedPosition = ref<AssignedPosition>('top');

// 使用业务逻辑 composable
const {
  champions,
  isLoadingChampions,
  championSelection,
  localBanChampions,
  localPickChampions,
  currentSelectedChampions,
  currentPosition,
  loadSettings,
  loadChampionSummaries,
  resetSettings,
  openChampionSelector,
  closeChampionSelector,
  toggleChampion,
  removeChampion,
  reorderChampions,
  handleReorderBan,
  handleReorderPick,
  removeUserChampion,
} = usePositionChampionSettings(props.modelValue);

// 视图相关的辅助函数
function getChampionImageUrl(championKey: string | number): string {
  return staticAssets.getChampionIcon(championKey as string);
}

// 获取当前选中位置的英雄数据
const currentPositionBanChampions = computed(() => {
  return localBanChampions.value[selectedPosition.value] || [];
});

const currentPositionPickChampions = computed(() => {
  return localPickChampions.value[selectedPosition.value] || [];
});

// 选择位置
function selectPosition(position: AssignedPosition) {
  selectedPosition.value = position;
}

// 添加英雄 - 原有模态框方式
function addBanChampion() {
  openChampionSelector(selectedPosition.value, 'ban');
}

function addPickChampion() {
  openChampionSelector(selectedPosition.value, 'pick');
}

// // 添加英雄 - 新窗口方式
// function addBanChampionWindow() {
//   if (window.electronAPI) {
//     window.electronAPI.openChampionSelectorWindow(
//       selectedPosition.value,
//       'ban'
//     );
//   }
// }

// function addPickChampionWindow() {
//   if (window.electronAPI) {
//     window.electronAPI.openChampionSelectorWindow(
//       selectedPosition.value,
//       'pick'
//     );
//   }
// }

onMounted(() => {
  loadSettings();
  loadChampionSummaries();

  // 监听窗口关闭事件（通用API）
  if (window.electronAPI && window.electronAPI.onWindowClosed) {
    window.electronAPI.onWindowClosed((event, data) => {
      if (data.windowType === 'champion-selector') {
        console.log('英雄选择器窗口已关闭22');
        loadSettings();
        // 在这里可以添加窗口关闭后的处理逻辑
        // 例如：刷新数据、更新UI状态等
      }
    });
  }
});

// 组件卸载时清理监听器
onUnmounted(() => {
  // 清理监听器
  if (window.electronAPI && window.electronAPI.removeWindowClosedListener) {
    window.electronAPI.removeWindowClosedListener((event, data) => {
      if (data.windowType === 'champion-selector') {
        console.log('英雄选择器窗口已关闭');
      }
    });
  }
});

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="space-y-6">
    <!-- 位置选择器 -->
    <div class="flex h-10 items-center border-b">
      <button
        v-for="position in positions"
        :key="position.key"
        @click="selectPosition(position.key)"
        class="relative flex h-full items-center gap-2 px-4 text-sm font-medium transition-all duration-200"
        :class="{
          'bg-primary/10': selectedPosition === position.key,
          'text-muted-foreground hover:text-foreground hover:bg-muted/50':
            selectedPosition !== position.key,
        }"
      >
        <img
          :src="`./role/${position.icon}`"
          :alt="position.name"
          class="h-4 w-4 object-cover opacity-70 brightness-0 dark:invert"
        />
        <span>{{ position.name }}</span>
        <!-- 活跃指示器 -->
        <div
          v-if="selectedPosition === position.key"
          class="bg-primary absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2"
        ></div>
      </button>
    </div>

    <!-- 英雄设置区域 -->
    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
      <!-- 禁用英雄列表 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-red-600 dark:text-red-400">
            禁用英雄
          </h4>
          <div class="flex gap-2">
            <button
              @click="addBanChampion"
              class="flex items-center gap-1 rounded-md bg-red-500 px-3 py-1 text-xs text-white transition-colors hover:bg-red-600"
            >
              <Plus class="h-3 w-3" />
              添加
            </button>
            <!-- <button
              @click="addBanChampionWindow"
              class="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
            >
              <Plus class="h-3 w-3" />
              添加(新窗口)
            </button> -->
          </div>
        </div>

        <!-- 英雄列表区域 -->
        <div
          class="h-[300px] overflow-y-auto border bg-red-50/30 p-2 dark:bg-red-950/20"
        >
          <div
            v-if="currentPositionBanChampions.length === 0"
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            点击添加按钮选择禁用英雄
          </div>

          <VueDraggable
            v-else
            v-model="localBanChampions[selectedPosition]"
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
            class="space-y-2"
            @end="
              () =>
                handleReorderBan(
                  selectedPosition,
                  localBanChampions[selectedPosition]
                )
            "
          >
            <ChampionListItem
              v-for="(champion, index) in currentPositionBanChampions"
              :key="`ban-${champion.id}`"
              :champion="champion"
              :position="selectedPosition"
              :index="index"
              :show-drag-handle="true"
              :show-index="true"
              :show-tier-info="true"
              :show-delete-button="true"
              variant="ban"
              @delete="removeUserChampion(selectedPosition, 'ban', index)"
            />
          </VueDraggable>
        </div>
      </div>

      <!-- 优先英雄列表 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4
            class="text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            优选英雄
          </h4>
          <div class="flex gap-2">
            <button
              @click="addPickChampion"
              class="flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-1 text-xs text-white transition-colors hover:bg-emerald-600"
            >
              <Plus class="h-3 w-3" />
              添加
            </button>
            <!-- <button
              @click="addPickChampionWindow"
              class="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs text-white transition-colors hover:bg-emerald-700"
            >
              <Plus class="h-3 w-3" />
              添加(新窗口)
            </button> -->
          </div>
        </div>

        <!-- 英雄列表区域 -->
        <div
          class="h-[300px] overflow-y-auto border bg-emerald-50/30 p-2 dark:bg-emerald-950/20"
        >
          <div
            v-if="currentPositionPickChampions.length === 0"
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            点击添加按钮选择优先英雄
          </div>

          <VueDraggable
            v-else
            v-model="localPickChampions[selectedPosition]"
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
            class="space-y-2"
            @end="
              () =>
                handleReorderPick(
                  selectedPosition,
                  localPickChampions[selectedPosition]
                )
            "
          >
            <ChampionListItem
              v-for="(champion, index) in currentPositionPickChampions"
              :key="`pick-${champion.id}`"
              :champion="champion"
              :position="selectedPosition"
              :index="index"
              :show-drag-handle="true"
              :show-index="true"
              :show-tier-info="true"
              :show-delete-button="true"
              variant="pick"
              @delete="removeUserChampion(selectedPosition, 'pick', index)"
            />
          </VueDraggable>
        </div>
      </div>
    </div>

    <!-- 英雄选择器组件 -->
    <ChampionSelector
      v-if="championSelection.isOpen"
      :is-open="championSelection.isOpen"
      :champions="champions"
      :selected-champions="currentSelectedChampions"
      :position="currentPosition"
      :selection-type="championSelection.currentType as 'ban' | 'pick'"
      :is-loading="isLoadingChampions"
      @close="closeChampionSelector"
      @toggle-champion="toggleChampion"
      @remove-champion="removeChampion"
      @reorder-champions="reorderChampions"
    />
  </div>
</template>

<style scoped>
/* 被选中的元素样式 */
:global(.chosen-item) {
  transform: scale(1.02) !important;
  z-index: 1000;
}

/* 拖拽中的元素样式 */
:global(.drag-item) {
  opacity: 0.9 !important;
  transform: rotate(1deg) scale(1.02) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
  z-index: 1001 !important;
}

/* 占位符样式 */
:global(.ghost-item) {
  opacity: 0.4 !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border-radius: 0px !important;
  transform: none !important;
  border: 2px dashed rgba(59, 130, 246, 0.3) !important;
  height: 56px !important; /* 固定高度，与原始元素高度一致 */
  min-height: 56px !important;
  max-height: 56px !important;
  width: 100% !important; /* 宽度占满容器 */
  overflow: hidden !important;
}

:global(.ghost-item *) {
  opacity: 0 !important;
  visibility: hidden !important;
}
</style>
