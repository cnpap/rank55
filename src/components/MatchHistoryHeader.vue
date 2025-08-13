<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Filter, BarChart3 } from 'lucide-vue-next';
import type { GameModesFilter, ProcessedMatch } from '@/types/match-history-ui';

interface Props {
  modelValue: GameModesFilter;
  matches: ProcessedMatch[];
  currentPage: number;
  pageSize: number;
}

interface Emits {
  (e: 'update:modelValue', value: GameModesFilter): void;
  (e: 'update:currentPage', page: number): void;
  (e: 'update:pageSize', size: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 游戏模式选项
const gameModeOptions = [
  { value: 'all', label: '全部模式' },
  { value: 'solo', label: '单双排位' },
  { value: 'flex', label: '灵活排位' },
  { value: 'normal', label: '普通匹配' },
  { value: 'aram', label: '大乱斗' },
  { value: 'arena', label: '斗魂竞技场' },
  { value: 'training', label: '训练模式' },
  { value: 'others', label: '其他模式' },
];

// 每页显示数量选项
const pageSizeOptions = [
  { value: 10, label: '10条' },
  { value: 20, label: '20条' },
  { value: 50, label: '50条' },
];

// 当前选中的游戏模式
const selectedGameMode = ref('all');

// 计算总体统计（简化版）
const overallStats = computed(() => {
  // 使用假数据，实际应该从props.matches计算
  const totalGames = 20;
  const totalWins = 12;
  const totalLosses = 8;
  const winRate = Math.round((totalWins / totalGames) * 100);

  return {
    totalGames,
    totalWins,
    totalLosses,
    winRate,
    avgKDA: 2.4,
  };
});

// 最近使用的英雄（只显示头像）
const recentChampions = computed(() => {
  // 假数据，实际应该从props.matches计算
  return [
    { championId: 157, games: 5 }, // 亚索
    { championId: 64, games: 3 }, // 李青
    { championId: 238, games: 4 }, // 劫
    { championId: 91, games: 2 }, // 塔隆
    { championId: 39, games: 3 }, // 艾瑞莉娅
  ];
});

// 处理游戏模式变更
function handleGameModeChange(value: string) {
  selectedGameMode.value = value;

  const newFilter: GameModesFilter = {
    showSolo: value === 'all' || value === 'solo',
    showFlex: value === 'all' || value === 'flex',
    showNormal: value === 'all' || value === 'normal',
    showARAM: value === 'all' || value === 'aram',
    showArena: value === 'all' || value === 'arena',
    showTraining: value === 'all' || value === 'training',
    showOthers: value === 'all' || value === 'others',
  };

  emit('update:modelValue', newFilter);
}

// 处理分页
function goToPage(page: number) {
  if (page >= 1) {
    emit('update:currentPage', page);
  }
}

function handlePageSizeChange(size: string) {
  emit('update:pageSize', Number(size));
  emit('update:currentPage', 1);
}

// 获取英雄头像URL
function getChampionAvatarUrl(championId: number): string {
  return `/public/dynamic/avatar/${championId}.png`;
}
</script>

<template>
  <div
    class="rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:from-slate-900/80 dark:to-slate-800/80"
  >
    <!-- 第一行：统计信息和筛选器 -->
    <div class="mb-3 flex items-center justify-between">
      <!-- 左侧：统计信息 -->
      <div class="flex items-center gap-6">
        <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
          <!-- 最近对局 -->
        </span>
        <!-- <div class="flex items-center gap-4 text-sm">
          <span class="font-medium text-emerald-600 dark:text-emerald-400">
            {{ overallStats.totalWins }}胜
          </span>
          <span class="font-medium text-red-500 dark:text-red-400">
            {{ overallStats.totalLosses }}负
          </span>
          <span class="font-medium text-slate-700 dark:text-slate-200">
            {{ overallStats.winRate }}%
          </span>
          <span class="font-medium text-blue-600 dark:text-blue-400"
            >{{ overallStats.avgKDA }} KDA</span
          >
        </div> -->
      </div>

      <!-- 右侧：筛选器 -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Filter class="h-4 w-4" />
          <span class="text-sm font-medium">筛选</span>
        </div>
        <Select
          :model-value="selectedGameMode"
          @update:model-value="handleGameModeChange"
        >
          <SelectTrigger
            class="h-8 w-50 border-slate-200 bg-white/80 text-sm dark:border-slate-600 dark:bg-slate-800/80"
          >
            <SelectValue placeholder="选择模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in gameModeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- 第二行：常用英雄和分页控制 -->
    <div class="flex items-center justify-between">
      <!-- 左侧：常用英雄头像 -->
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
          <!-- 常用英雄 -->
        </span>
        <div class="flex items-center gap-2">
          <div
            v-for="champion in recentChampions"
            :key="champion.championId"
            class="group relative"
          >
            <!-- <div class="relative">
              <img
                :src="getChampionAvatarUrl(champion.championId)"
                :alt="`英雄${champion.championId}`"
                class="h-8 w-8 rounded-full border-2 border-white object-cover shadow-sm transition-transform group-hover:scale-110 dark:border-slate-600"
              />
              <div
                class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white shadow-sm"
              >
                {{ champion.games }}
              </div>
            </div> -->
          </div>
        </div>
      </div>

      <!-- 右侧：分页控制 -->
      <div class="flex items-center justify-between gap-3">
        <!-- 每页显示数量 -->
        <Select
          :model-value="String(pageSize)"
          @update:model-value="handlePageSizeChange"
        >
          <SelectTrigger
            class="h-8 w-20 border-slate-200 bg-white/80 text-sm dark:border-slate-600 dark:bg-slate-800/80"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in pageSizeOptions"
              :key="option.value"
              :value="String(option.value)"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 分页按钮 -->
        <div class="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>

          <div
            class="rounded-md border border-slate-200 bg-slate-100/80 px-3 py-1 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-700/80 dark:text-slate-300"
          >
            {{ currentPage }}
          </div>

          <Button
            variant="outline"
            size="sm"
            class="h-8 w-8 border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
