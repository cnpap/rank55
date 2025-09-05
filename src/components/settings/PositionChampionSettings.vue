<script setup lang="ts">
import { reactive, computed, ref, onMounted, watch } from 'vue';
import { toast } from 'vue-sonner';
import { VueDraggable } from 'vue-draggable-plus';
import { $local, type PositionSettings } from '@/storages/storage-use';
import type { ChampionData } from '@/types/champion';
import ChampionSelector from './ChampionSelector.vue';
import { Plus, GripVertical, X } from 'lucide-vue-next';
import { staticAssets } from '@/assets/data-assets';
import { AssignedPosition } from '@/types/players-info';
import { gameDataStore } from '@/lib/db/game-data-db';
import {
  positions,
  recommendedChampions,
  MAX_BAN_CHAMPIONS,
  MAX_PICK_CHAMPIONS,
} from '@/config/position-config';

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

// 英雄数据
const champions = ref<ChampionData[]>([]);
const isLoadingChampions = ref(false);

// 位置设置
const positionSettings = reactive<PositionSettings>({ ...props.modelValue });

// 英雄选择状态
const championSelection = reactive<{
  isOpen: boolean;
  currentPosition: AssignedPosition;
  currentType: '' | 'ban' | 'pick';
}>({
  isOpen: false,
  currentPosition: '' as any,
  currentType: '', // 'ban' 或 'pick'
});

// 拖拽用的本地数据
const localBanChampions = ref<Record<AssignedPosition, ChampionData[]>>({
  top: [],
  jungle: [],
  middle: [],
  bottom: [],
  support: [],
});

const localPickChampions = ref<Record<AssignedPosition, ChampionData[]>>({
  top: [],
  jungle: [],
  middle: [],
  bottom: [],
  support: [],
});

// 获取显示的英雄列表（用户选择的 + 推荐的）
function getDisplayChampions(position: AssignedPosition, type: 'ban' | 'pick') {
  const setting = positionSettings[position];
  const userChampions =
    type === 'ban' ? setting.banChampions : setting.pickChampions;
  const maxCount = type === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;
  const recommended = recommendedChampions[position];
  const recommendedList =
    type === 'ban' ? recommended.banChampions : recommended.pickChampions;

  // 用户选择的英雄（转换为字符串key）
  const userChampionKeys = userChampions.slice(0, maxCount);

  // 获取推荐英雄，排除用户已选择的
  const availableRecommended = recommendedList
    .map(r => r.championId.toString())
    .filter(key => !userChampionKeys.includes(key));

  // 计算需要填充的推荐英雄数量
  const needRecommendedCount = maxCount - userChampionKeys.length;
  const recommendedToShow = availableRecommended.slice(0, needRecommendedCount);

  // 返回显示列表：用户选择的 + 推荐的
  return {
    userChampions: userChampionKeys
      .map(key => getChampionByKey(key))
      .filter(Boolean) as ChampionData[],
    recommendedChampions: recommendedToShow
      .map(key => getChampionByKey(key))
      .filter(Boolean) as ChampionData[],
    totalDisplay: [...userChampionKeys, ...recommendedToShow],
  };
}

// 同步本地拖拽数据
function syncLocalChampions() {
  positions.forEach(position => {
    const displayData = getDisplayChampions(position.key, 'ban');
    localBanChampions.value[position.key] = displayData.userChampions;

    const pickDisplayData = getDisplayChampions(position.key, 'pick');
    localPickChampions.value[position.key] = pickDisplayData.userChampions;
  });
}

// 监听设置变化，同步本地数据
watch(
  () => positionSettings,
  () => {
    syncLocalChampions();
  },
  { deep: true }
);

// 当前选择的英雄列表
const currentSelectedChampions = computed(() => {
  if (!championSelection.currentPosition || !championSelection.currentType)
    return [];

  const setting = positionSettings[championSelection.currentPosition];
  const championKeys =
    championSelection.currentType === 'ban'
      ? setting.banChampions
      : setting.pickChampions;

  return championKeys
    .map(key => getChampionByKey(key))
    .filter(Boolean) as ChampionData[];
});

// 当前位置信息
const currentPosition = computed(() => {
  return (
    positions.find(p => p.key === championSelection.currentPosition) ||
    positions[0]
  );
});

// 加载英雄数据
async function loadChampionData() {
  if (champions.value.length > 0) return;

  isLoadingChampions.value = true;
  champions.value = Object.values(gameDataStore.champions);

  // 加载完成后同步本地数据
  syncLocalChampions();
}

// 加载设置
function loadSettings() {
  const savedPositionSettings = $local.getItem('positionSettings');
  if (savedPositionSettings) {
    Object.assign(positionSettings, savedPositionSettings);
  }
}

// 保存设置
function saveSettings() {
  $local.setItem('positionSettings', positionSettings);
  toast.success('位置设置已保存');
}

// 重置设置
function resetSettings() {
  Object.keys(positionSettings).forEach(key => {
    positionSettings[key as AssignedPosition] = {
      banChampions: [],
      pickChampions: [],
    };
  });
  saveSettings();
}

// 打开英雄选择器
function openChampionSelector(position: string, type: 'ban' | 'pick') {
  championSelection.currentPosition = position as AssignedPosition;
  championSelection.currentType = type;
  championSelection.isOpen = true;
  loadChampionData();
}

// 关闭英雄选择器
function closeChampionSelector() {
  championSelection.isOpen = false;
}

// 切换英雄选择状态
function toggleChampion(champion: ChampionData) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];
  const maxCount =
    currentType === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;

  if (currentType === 'ban') {
    const index = setting.banChampions.indexOf(champion.key);
    if (index > -1) {
      setting.banChampions.splice(index, 1);
    } else if (setting.banChampions.length < maxCount) {
      setting.banChampions.push(champion.key);
    } else {
      toast.error(`最多只能选择 ${maxCount} 个禁用英雄`);
      return;
    }
  } else {
    const index = setting.pickChampions.indexOf(champion.key);
    if (index > -1) {
      setting.pickChampions.splice(index, 1);
    } else if (setting.pickChampions.length < maxCount) {
      setting.pickChampions.push(champion.key);
    } else {
      toast.error(`最多只能选择 ${maxCount} 个优先英雄`);
      return;
    }
  }

  saveSettings();
}

// 从已选列表中移除英雄
function removeChampion(index: number) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];

  if (currentType === 'ban') {
    setting.banChampions.splice(index, 1);
  } else {
    setting.pickChampions.splice(index, 1);
  }

  saveSettings();
}

// 重新排序英雄
function reorderChampions(newChampions: ChampionData[]) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];
  const newKeys = newChampions.map(c => c.key);

  if (currentType === 'ban') {
    setting.banChampions.splice(0, setting.banChampions.length, ...newKeys);
  } else {
    setting.pickChampions.splice(0, setting.pickChampions.length, ...newKeys);
  }

  saveSettings();
}

// 拖拽重新排序
function handleReorderBan(
  position: AssignedPosition,
  newChampions: ChampionData[]
) {
  const newKeys = newChampions.map(c => c.key);
  positionSettings[position].banChampions.splice(
    0,
    positionSettings[position].banChampions.length,
    ...newKeys
  );
  saveSettings();
}

function handleReorderPick(
  position: AssignedPosition,
  newChampions: ChampionData[]
) {
  const newKeys = newChampions.map(c => c.key);
  positionSettings[position].pickChampions.splice(
    0,
    positionSettings[position].pickChampions.length,
    ...newKeys
  );
  saveSettings();
}

// 移除用户选择的英雄
function removeUserChampion(
  position: AssignedPosition,
  type: 'ban' | 'pick',
  index: number
) {
  const setting = positionSettings[position];

  if (type === 'ban') {
    setting.banChampions.splice(index, 1);
  } else {
    setting.pickChampions.splice(index, 1);
  }

  saveSettings();
}

// 点击推荐英雄
function selectRecommendedChampion(
  position: AssignedPosition,
  type: 'ban' | 'pick',
  championKey: string
) {
  const setting = positionSettings[position];
  const maxCount = type === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;

  if (type === 'ban') {
    if (
      setting.banChampions.length < maxCount &&
      !setting.banChampions.includes(championKey)
    ) {
      setting.banChampions.push(championKey);
      saveSettings();
    }
  } else {
    if (
      setting.pickChampions.length < maxCount &&
      !setting.pickChampions.includes(championKey)
    ) {
      setting.pickChampions.push(championKey);
      saveSettings();
    }
  }
}

// 通过英雄key获取英雄信息
function getChampionByKey(championKey: string): ChampionData | undefined {
  return champions.value.find(c => c.key === championKey);
}

function getChampionImageUrl(championKey: string): string {
  return staticAssets.getChampionIcon(championKey);
}

function getPositionIconUrl(iconName: string): string {
  return `./role/${iconName}`;
}

onMounted(() => {
  loadSettings();
  loadChampionData();
});

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="position in positions"
      :key="position.key"
      class="flex items-center gap-3"
    >
      <!-- 位置图标 -->
      <div class="flex min-w-[56px] items-center justify-center border">
        <div class="flex h-[56px] w-[56px] items-center justify-center p-3">
          <img
            :src="getPositionIconUrl(position.icon)"
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
            <div class="flex w-full">
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
                class="flex gap-1"
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
                  :key="`user-ban-${champion.key}`"
                  class="group relative mr-1"
                >
                  <img
                    :src="getChampionImageUrl(champion.key)"
                    :alt="champion.name"
                    :title="champion.name"
                    class="h-8 w-8 cursor-pointer border-2 border-red-500 object-cover"
                  />

                  <!-- 拖拽手柄 -->
                  <div
                    class="drag-handle absolute inset-0 cursor-move opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/40"
                    >
                      <GripVertical class="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <!-- 删除按钮 -->
                  <button
                    @click="removeUserChampion(position.key, 'ban', index)"
                    class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X class="h-2 w-2 text-white" />
                  </button>
                </div>
              </VueDraggable>

              <!-- 推荐的英雄 (置灰) -->
              <div
                v-for="champion in getDisplayChampions(position.key, 'ban')
                  .recommendedChampions"
                :key="`rec-ban-${champion.key}`"
                class="group relative mr-1"
              >
                <img
                  :src="getChampionImageUrl(champion.key)"
                  :alt="champion.name"
                  :title="`推荐禁用: ${champion.name}`"
                  class="h-8 w-8 cursor-pointer border border-red-300 object-cover grayscale transition-all hover:grayscale-0"
                  @click="
                    selectRecommendedChampion(position.key, 'ban', champion.key)
                  "
                />
              </div>
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'ban')"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- 选用框 (较大宽度) -->
      <div class="flex-1">
        <div class="relative">
          <div
            class="flex h-[56px] items-center justify-start border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-2 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          >
            <div class="flex w-full">
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
                  :key="`user-pick-${champion.key}`"
                  class="group relative mr-1"
                >
                  <img
                    :src="getChampionImageUrl(champion.key)"
                    :alt="champion.name"
                    :title="champion.name"
                    class="h-8 w-8 cursor-pointer border-2 border-emerald-500 object-cover"
                  />

                  <!-- 拖拽手柄 -->
                  <div
                    class="drag-handle absolute inset-0 cursor-move opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/40"
                    >
                      <GripVertical class="h-3 w-3 text-white" />
                    </div>
                  </div>

                  <!-- 删除按钮 -->
                  <button
                    @click="removeUserChampion(position.key, 'pick', index)"
                    class="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X class="h-3 w-3 text-white" />
                  </button>
                </div>
              </VueDraggable>

              <!-- 推荐的英雄 (置灰) -->
              <div
                v-for="champion in getDisplayChampions(position.key, 'pick')
                  .recommendedChampions"
                :key="`rec-pick-${champion.key}`"
                class="group relative mr-1"
              >
                <img
                  :src="getChampionImageUrl(champion.key)"
                  :alt="champion.name"
                  :title="`推荐选择: ${champion.name}`"
                  class="h-8 w-8 cursor-pointer border border-emerald-300 object-cover grayscale transition-all hover:grayscale-0"
                  @click="
                    selectRecommendedChampion(
                      position.key,
                      'pick',
                      champion.key
                    )
                  "
                />
              </div>
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'pick')"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600"
          >
            <Plus class="h-3 w-3" />
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
