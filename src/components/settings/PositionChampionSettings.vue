<script setup lang="ts">
import { onMounted } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { PositionSettings } from '@/storages/storage-use';
import ChampionSelector from './ChampionSelector.vue';
import PositionHelpGuide from './PositionHelpGuide.vue';
import { GripVertical, Plus } from 'lucide-vue-next';
import { staticAssets } from '@/assets/data-assets';
import {
  positions,
  MAX_BAN_CHAMPIONS,
  MAX_PICK_CHAMPIONS,
} from '@/config/position-config';
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

// 使用业务逻辑 composable
const {
  champions,
  isLoadingChampions,
  championSelection,
  localBanChampions,
  localPickChampions,
  currentSelectedChampions,
  currentPosition,
  getDisplayChampions,
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
  selectRecommendedChampion,
} = usePositionChampionSettings(props.modelValue);

// 视图相关的辅助函数
function getChampionImageUrl(championKey: string | number): string {
  return staticAssets.getChampionIcon(championKey as string);
}

onMounted(() => {
  loadSettings();
  loadChampionSummaries();
});

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="space-y-4">
    <!-- 列标题和说明 -->
    <div
      class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"
    >
      <div class="flex min-w-[56px] items-center justify-center">
        <span class="font-medium">位置</span>
      </div>
      <div class="w-[240px]">
        <div class="flex items-center gap-2">
          <span class="font-medium text-red-500 dark:text-red-400">
            禁用英雄
          </span>
          <span class="text-xs">(最多 {{ MAX_BAN_CHAMPIONS }} 个)</span>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          拖拽调整优先级，点击推荐英雄快速添加
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium text-emerald-500 dark:text-emerald-400">
            优先英雄
          </span>
          <span class="text-xs">(最多 {{ MAX_PICK_CHAMPIONS }} 个)</span>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          拖拽调整选择优先级，点击推荐英雄快速添加
        </div>
      </div>
    </div>

    <!-- 位置设置行 -->
    <div
      v-for="position in positions"
      :key="position.key"
      class="flex items-center gap-3"
    >
      <!-- 位置图标 -->
      <div class="flex min-w-[56px] items-center justify-center border">
        <div class="flex h-[56px] w-[56px] items-center justify-center p-3">
          <img
            :src="`./role/${position.icon}`"
            :alt="position.name"
            :title="position.name"
            class="h-6 w-6 object-cover opacity-70 brightness-0 dark:invert"
          />
        </div>
      </div>

      <!-- 禁用框 (较小宽度) -->
      <div class="w-[240px]">
        <div class="relative">
          <div
            class="flex h-[56px] items-center justify-start border-2 border-dashed border-red-200 bg-red-50/30 p-2 dark:border-red-800/50 dark:bg-red-950/20"
          >
            <!-- 空状态提示 -->
            <div
              v-if="
                localBanChampions[position.key].length === 0 &&
                getDisplayChampions(position.key, 'ban').recommendedChampions
                  .length === 0
              "
              class="flex w-full items-center justify-center text-xs text-gray-400"
            >
              点击设置按钮添加禁用英雄
            </div>
            <div v-else class="flex w-full">
              <!-- 用户选择的英雄 - 支持拖拽 -->
              <VueDraggable
                v-model="localBanChampions[position.key]"
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
                class="flex"
                @end="
                  () =>
                    handleReorderBan(
                      position.key,
                      localBanChampions[position.key]
                    )
                "
              >
                <div
                  v-for="(champion, index) in localBanChampions[position.key]"
                  :key="`user-ban-${champion.id}`"
                  class="group relative mr-1"
                >
                  <img
                    :src="getChampionImageUrl(champion.id)"
                    :alt="champion.name"
                    :title="champion.name"
                    class="h-10 w-10 cursor-pointer border-2 border-red-500 object-cover"
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
                  <button
                    @click="removeUserChampion(position.key, 'ban', index)"
                    class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <img
                      :src="staticAssets.getIcon('close')"
                      alt="删除"
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </VueDraggable>

              <!-- 推荐的英雄 (置灰) -->
              <div
                v-for="champion in getDisplayChampions(position.key, 'ban')
                  .recommendedChampions"
                :key="`rec-ban-${champion.id}`"
                class="group relative mr-1"
              >
                <img
                  :src="getChampionImageUrl(champion.id)"
                  :alt="champion.name"
                  :title="`推荐禁用: ${champion.name}`"
                  class="h-8 w-8 cursor-pointer border border-red-300 object-cover grayscale transition-all hover:grayscale-0"
                  @click="
                    selectRecommendedChampion(position.key, 'ban', champion.id)
                  "
                />
              </div>
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'ban')"
            :title="`添加${position.name}位置的禁用英雄`"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
          >
            <Plus class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- 选用框 (较大宽度) -->
      <div class="flex-1">
        <div class="relative">
          <div
            class="flex h-[56px] items-center justify-start border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-2 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          >
            <!-- 空状态提示 -->
            <div
              v-if="
                localPickChampions[position.key].length === 0 &&
                getDisplayChampions(position.key, 'pick').recommendedChampions
                  .length === 0
              "
              class="flex w-full items-center justify-center text-xs text-gray-400"
            >
              点击设置按钮添加优先英雄
            </div>
            <div v-else class="flex w-full">
              <!-- 用户选择的英雄 - 支持拖拽 -->
              <VueDraggable
                v-model="localPickChampions[position.key]"
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
                class="flex"
                @end="
                  () =>
                    handleReorderPick(
                      position.key,
                      localPickChampions[position.key]
                    )
                "
              >
                <div
                  v-for="(champion, index) in localPickChampions[position.key]"
                  :key="`user-pick-${champion.id}`"
                  class="group relative mr-1"
                >
                  <img
                    :src="getChampionImageUrl(champion.id)"
                    :alt="champion.name"
                    :title="champion.name"
                    class="h-10 w-10 cursor-pointer border-2 border-emerald-500 object-cover"
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
                  <button
                    @click="removeUserChampion(position.key, 'pick', index)"
                    class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <img
                      :src="staticAssets.getIcon('close')"
                      alt="删除"
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </VueDraggable>

              <!-- 推荐的英雄 (置灰) -->
              <div
                v-for="champion in getDisplayChampions(position.key, 'pick')
                  .recommendedChampions"
                :key="`rec-pick-${champion.id}`"
                class="group relative mr-1"
              >
                <img
                  :src="getChampionImageUrl(champion.id)"
                  :alt="champion.name"
                  :title="`推荐选择: ${champion.name}`"
                  class="h-8 w-8 cursor-pointer border border-emerald-300 object-cover grayscale transition-all hover:grayscale-0"
                  @click="
                    selectRecommendedChampion(position.key, 'pick', champion.id)
                  "
                />
              </div>
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'pick')"
            :title="`添加${position.name}位置的优先英雄`"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600"
          >
            <Plus class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 英雄选择器组件 -->
    <ChampionSelector
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

    <!-- 帮助说明组件 -->
    <PositionHelpGuide />
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

/* 占位符样式 - 保持布局稳定 */
:global(.ghost-item) {
  opacity: 0.4 !important;
  background: rgba(59, 130, 246, 0.1) !important;
  border-radius: 4px !important;
  transform: none !important;
  border: 2px dashed rgba(59, 130, 246, 0.3) !important;
  width: 32px !important;
  height: 32px !important;
}

:global(.ghost-item *) {
  opacity: 0 !important;
}

/* 确保拖拽容器稳定 */
:global(.vue-draggable-plus) {
  min-height: 32px;
}
</style>
