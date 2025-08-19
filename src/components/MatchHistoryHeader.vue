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
import { AcceptableValue } from 'reka-ui';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';

interface Props {
  modelValue: GameModesFilter;
  matches: ProcessedMatch[];
  currentPage: number;
  pageSize: number;
  isSticky?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: GameModesFilter): void;
  (e: 'update:currentPage', page: number): void;
  (e: 'update:pageSize', size: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 游戏模式选项 - 使用新的tag系统
const gameModeOptions = Object.entries(GAME_MODE_TAGS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// 每页显示数量选项
const pageSizeOptions = [
  { value: 10, label: '10条' },
  { value: 20, label: '20条' },
  { value: 50, label: '50条' },
];

// 当前选中的游戏模式
const selectedGameMode = ref('all');

// 计算总体统计（基于真实数据）
const overallStats = computed(() => {
  if (!props.matches || props.matches.length === 0) {
    return {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      avgKDA: 0,
    };
  }

  const totalGames = props.matches.length;
  const totalWins = props.matches.filter(
    match => match.result === 'victory'
  ).length;
  const totalLosses = totalGames - totalWins;
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  // 计算平均KDA
  const totalKDA = props.matches.reduce(
    (sum, match) => sum + match.kda.ratio,
    0
  );
  const avgKDA =
    totalGames > 0 ? Number((totalKDA / totalGames).toFixed(1)) : 0;

  return {
    totalGames,
    totalWins,
    totalLosses,
    winRate,
    avgKDA,
  };
});

// 最近使用的英雄（基于真实数据）
const recentChampions = computed(() => {
  if (!props.matches || props.matches.length === 0) {
    return [];
  }

  // 统计每个英雄的使用次数和胜负
  const championStats = new Map<
    number,
    { games: number; wins: number; losses: number; winRate: number }
  >();

  props.matches.forEach(match => {
    const existing = championStats.get(match.championId) || {
      games: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    };
    existing.games += 1;
    if (match.result === 'victory') {
      existing.wins += 1;
    } else {
      existing.losses += 1;
    }
    existing.winRate =
      existing.games > 0
        ? Math.round((existing.wins / existing.games) * 100)
        : 0;
    championStats.set(match.championId, existing);
  });

  // 转换为数组并按使用次数排序，取前5个
  return Array.from(championStats.entries())
    .map(([championId, stats]) => ({ championId, ...stats }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);
});

// 处理游戏模式变更
function handleGameModeChange(value: AcceptableValue) {
  const newFilter: GameModesFilter = {
    selectedTag: value as string,
  };

  emit('update:modelValue', newFilter);
}

// 处理分页
function goToPage(page: number) {
  if (page >= 1) {
    emit('update:currentPage', page);
  }
}

function handlePageSizeChange(size: AcceptableValue) {
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
    :class="[
      // 基础样式
      'border border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:from-slate-900/80 dark:to-slate-800/80',
      // 吸附时：占满视口宽度并移除圆角
      isSticky ? '-mx-[calc(50vw-50%)] w-[100vw] rounded-none' : 'rounded',
    ]"
  >
    <div class="mx-auto max-w-4xl p-4">
      <!-- 第一行：统计信息和筛选器 -->
      <div class="mb-3 flex items-center justify-between">
        <!-- 左侧：统计信息 -->
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
            最近对局
          </span>
          <div class="font-tektur-numbers flex items-center gap-4 text-sm">
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
          </div>
        </div>

        <!-- 右侧：筛选器 -->
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-2 text-slate-600 dark:text-slate-300"
          >
            <Filter class="h-4 w-4" />
            <span class="text-sm font-medium">筛选</span>
          </div>
          <Select
            :model-value="modelValue.selectedTag"
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
            常用英雄
          </span>
          <div class="flex items-center gap-2">
            <div
              v-for="champion in recentChampions"
              :key="champion.championId"
              class="group relative"
            >
              <div class="relative">
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

                <!-- Tooltip -->
                <div
                  class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block dark:bg-slate-700"
                >
                  <div class="font-tektur-numbers whitespace-nowrap">
                    <div class="mt-1 space-y-0.5">
                      <div class="flex justify-between gap-2">
                        <span class="text-emerald-400"
                          >{{ champion.wins }}胜</span
                        >
                        <span class="text-red-400"
                          >{{ champion.losses }}负</span
                        >
                      </div>
                      <div class="text-center font-medium">
                        胜率 {{ champion.winRate }}%
                      </div>
                    </div>
                  </div>
                  <!-- Tooltip arrow -->
                  <div
                    class="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-slate-800 dark:border-t-slate-700"
                  ></div>
                </div>
              </div>
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
  </div>
</template>
