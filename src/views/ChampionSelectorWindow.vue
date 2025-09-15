<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import ChildWindowControls from '@/components/ChildWindowControls.vue';
import ChampionList from '@/components/settings/ChampionList.vue';
import SelectedChampionsList from '@/components/settings/SelectedChampionsList.vue';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-vue-next';
import { ChampionSummary } from '@/types/lol-game-data';
import { usePositionChampionSettings } from '@/lib/composables/usePositionChampionSettings';
import type { AssignedPosition } from '@/types/players-info';

// 路由参数
const route = useRoute();
const routePosition = route.params.position as AssignedPosition;
const routeType = route.params.type as 'ban' | 'pick';

// 使用业务逻辑 composable
const {
  champions,
  isLoadingChampions,
  championSelection,
  currentSelectedChampions,
  currentPosition,
  loadSettings,
  loadChampionSummaries,
  openChampionSelector,
  closeChampionSelector,
  toggleChampion,
  removeChampion,
  reorderChampions,
} = usePositionChampionSettings();

// 搜索功能
const searchTerm = ref('');

// 计算属性
const selectedChampionIds = computed(() =>
  currentSelectedChampions.value.map(c => c.id.toString())
);

// 生成包含操作类型的标题
const windowTitle = computed(() => {
  const positionName = currentPosition.value?.name || '英雄选择器';
  const typeText =
    championSelection.currentType === 'ban'
      ? '禁用英雄'
      : championSelection.currentType === 'pick'
        ? '优选英雄'
        : '英雄选择器';
  return `${positionName} - ${typeText}`;
});

function handleToggleChampion(champion: ChampionSummary) {
  toggleChampion(champion);
}

function handleRemoveChampion(index: number) {
  removeChampion(index);
}

function handleReorderChampions(champions: ChampionSummary[]) {
  reorderChampions(champions);
}

import { gameDataDB } from '@/storages';
const isConnected = ref(false);

// 组件挂载时的初始化逻辑
onMounted(async () => {
  console.log('英雄选择器窗口已加载');
  await gameDataDB.loadAll();
  loadSettings();
  loadChampionSummaries();

  // 监听来自主进程的参数（保留兼容性）
  if (window.electronAPI && window.electronAPI.onChampionSelectorParams) {
    window.electronAPI.onChampionSelectorParams(params => {
      console.log('接收到英雄选择器参数:', params);
      openChampionSelector(params.position, params.type);
    });
  }

  // 使用路由参数初始化（优先使用路由参数）
  if (routePosition && routeType) {
    console.log('使用路由参数初始化:', {
      position: routePosition,
      type: routeType,
    });
    openChampionSelector(routePosition, routeType);
  } else {
    // 如果没有路由参数，使用默认值
    console.log('使用默认参数初始化');
    openChampionSelector('top', 'ban');
  }

  isConnected.value = true;
  console.log('isConnected', isConnected.value);
});

// 组件卸载时清理监听器
onUnmounted(() => {
  if (
    window.electronAPI &&
    window.electronAPI.removeChampionSelectorParamsListener
  ) {
    window.electronAPI.removeChampionSelectorParamsListener();
  }
});
</script>

<template>
  <div v-if="isConnected" class="flex h-screen flex-col font-sans">
    <!-- 使用统一的标题栏组件 -->
    <div class="bg-background border-border border-b">
      <div
        class="bg-background flex h-10 w-full items-center justify-between"
        style="-webkit-app-region: drag"
      >
        <!-- 左侧标题区域 -->
        <div
          class="flex h-full flex-1 items-center px-4 select-none"
          style="-webkit-app-region: drag"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="currentPosition"
              :src="`./role/${currentPosition.icon}`"
              :alt="currentPosition.name"
              class="h-6 w-6 object-cover opacity-70 brightness-0 dark:invert"
            />
            <h1 class="text-foreground text-sm font-medium">
              {{ windowTitle }}
            </h1>
          </div>
        </div>

        <!-- 右侧窗口控制按钮 -->
        <div
          class="flex h-full items-center"
          style="-webkit-app-region: no-drag"
        >
          <ChildWindowControls />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- 已选英雄区域 -->
      <div v-if="currentSelectedChampions.length > 0" class="flex-shrink-0">
        <SelectedChampionsList
          :champions="currentSelectedChampions"
          :type="championSelection.currentType as 'ban' | 'pick'"
          @remove="handleRemoveChampion"
          @reorder="handleReorderChampions"
        />
      </div>

      <!-- 搜索区域 -->
      <div class="flex-shrink-0 px-3 pb-3">
        <div class="relative">
          <Search
            class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          />
          <Input
            v-model="searchTerm"
            type="text"
            placeholder="搜索英雄名称、拼音，例如 安妮、an、anni..."
            class="pl-10"
          />
        </div>
      </div>

      <!-- 英雄列表区域 -->
      <!-- <div class="bg-background min-h-0 flex-1 overflow-hidden">
        <ChampionList
          :champions="champions"
          :selected-champion-ids="selectedChampionIds"
          :search-term="searchTerm"
          :is-loading="isLoadingChampions"
          :selection-type="championSelection.currentType as 'ban' | 'pick'"
          @toggle-champion="handleToggleChampion"
        />
      </div> -->
    </div>
  </div>
</template>

<style scoped>
/* 所有样式已转换为 Tailwind CSS 类 */
</style>
