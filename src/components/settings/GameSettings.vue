<script setup lang="ts">
import { toast } from 'vue-sonner';
import { RotateCcw } from 'lucide-vue-next';
import Button from '../ui/button/Button.vue';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AcceptableValue } from 'reka-ui';
import type { RegionType, TierType } from '@/lib/service/opgg/types';
import { getRankMiniImageUrl } from '@/lib/rank-helpers';
import {
  useGameSettingsStore,
  GAME_MODE_OPTIONS,
  REGION_OPTIONS,
  TIER_OPTIONS,
  MATCH_HISTORY_TYPE_OPTIONS,
  DATA_DISPLAY_MODE_OPTIONS,
} from '@/stores/game-settings';
import { gameDataDB } from '@/storages/game-data-db';

// 使用游戏设置store
const gameSettingsStore = useGameSettingsStore();

// 处理游戏模式变更
function handleGameModeChange(value: AcceptableValue) {
  gameSettingsStore.setDefaultGameMode(value as string);
  toast.success('游戏设置已保存');
}

// 处理服务器变更
async function handleRegionChange(value: AcceptableValue) {
  gameSettingsStore.setDefaultRegion(value as RegionType);
  try {
    // 重置并重新加载排名数据，更新英雄位置信息
    await gameDataDB.resetAndReloadRankedData({
      region: value as RegionType,
      tier: gameSettingsStore.defaultTier,
    });
    toast.success('游戏设置已保存，英雄数据已更新');
  } catch (error) {
    console.error('更新英雄数据失败:', error);
    toast.success('游戏设置已保存');
  }
}

// 处理分段变更
async function handleTierChange(value: AcceptableValue) {
  gameSettingsStore.setDefaultTier(value as TierType);
  try {
    // 重置并重新加载排名数据，更新英雄位置信息
    await gameDataDB.resetAndReloadRankedData({
      region: gameSettingsStore.defaultRegion,
      tier: value as TierType,
    });
    toast.success('游戏设置已保存，英雄数据已更新');
  } catch (error) {
    console.error('更新英雄数据失败:', error);
    toast.success('游戏设置已保存');
  }
}

// 处理自动接受游戏变更
function handleAutoAcceptChange() {
  toast.success('游戏设置已保存');
}

// 处理战绩类型变更
function handleMatchHistoryTypeChange(value: AcceptableValue) {
  gameSettingsStore.setMatchHistoryType(value as 'lightweight' | 'detailed');
  toast.success('游戏设置已保存');
}

// 处理数据展示模式变更
function handleDataDisplayModeChange(value: AcceptableValue) {
  gameSettingsStore.setDataDisplayMode(value as 'damage' | 'tank');
  toast.success('游戏设置已保存');
}

// 重置设置
function resetSettings() {
  gameSettingsStore.resetSettings();
  toast.success('游戏设置已重置');
}

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <!-- 卡片头部 -->
  <div class="flex items-center justify-between px-6 py-4">
    <h3 class="text-foreground text-lg font-medium">游戏设置</h3>
    <!-- 重置按钮 -->
    <Button @click="resetSettings" variant="outline">
      <RotateCcw class="h-4 w-4" />
      重置
    </Button>
  </div>

  <!-- 卡片内容 -->
  <div class="p-6">
    <!-- 自动接受游戏对局 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">自动接受游戏对局</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          当找到对局时自动接受，无需手动点击
        </p>
      </div>

      <!-- 开关 -->
      <label class="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          v-model="gameSettingsStore.autoAcceptGame"
          @change="handleAutoAcceptChange"
          class="peer sr-only"
        />
        <div
          class="bg-muted-foreground/20 peer relative h-6 w-11 rounded-full peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
        ></div>
      </label>
    </div>

    <!-- 战绩类型 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">战绩类型</h4>
        <p class="text-muted-foreground mt-1 text-sm">选择战绩显示的详细程度</p>
      </div>

      <!-- 战绩类型选择器 -->
      <Select
        :model-value="gameSettingsStore.matchHistoryType"
        @update:model-value="handleMatchHistoryTypeChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
          <SelectValue placeholder="选择类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in MATCH_HISTORY_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 数据展示模式 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">数据展示模式</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          选择关注输出还是承受伤害（仅在详细模式下生效）
        </p>
      </div>

      <!-- 数据展示模式选择器 -->
      <Select
        :model-value="gameSettingsStore.dataDisplayMode"
        @update:model-value="handleDataDisplayModeChange"
        :disabled="gameSettingsStore.matchHistoryType === 'lightweight'"
      >
        <SelectTrigger
          :class="[
            'h-8 w-48 text-sm',
            gameSettingsStore.matchHistoryType === 'lightweight'
              ? 'cursor-not-allowed opacity-50'
              : '',
          ]"
        >
          <SelectValue placeholder="选择模式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in DATA_DISPLAY_MODE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 默认游戏过滤模式 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">默认游戏过滤模式</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          设置战绩查询时的默认游戏模式过滤器
        </p>
      </div>

      <!-- 游戏模式选择器 -->
      <Select
        :model-value="gameSettingsStore.defaultGameMode"
        @update:model-value="handleGameModeChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
          <SelectValue placeholder="选择模式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in GAME_MODE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 默认服务器选择 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">默认服务器</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          设置从 OP.GG 获取数据时的默认服务器（重启或 CTRL + R 刷新后生效）
        </p>
      </div>

      <!-- 服务器选择器 -->
      <Select
        :model-value="gameSettingsStore.defaultRegion"
        @update:model-value="handleRegionChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
          <SelectValue placeholder="选择服务器" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in REGION_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 默认分段选择 -->
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">默认分段</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          设置从 OP.GG 获取数据时的默认分段过滤器（重启或 CTRL + R 刷新后生效）
        </p>
      </div>

      <!-- 分段选择器 -->
      <Select
        :model-value="gameSettingsStore.defaultTier"
        @update:model-value="handleTierChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
          <div class="flex items-center gap-2">
            <img
              v-if="
                TIER_OPTIONS.find(
                  opt => opt.value === gameSettingsStore.defaultTier
                )?.tier
              "
              :src="
                getRankMiniImageUrl(
                  TIER_OPTIONS.find(
                    opt => opt.value === gameSettingsStore.defaultTier
                  )?.tier!
                )
              "
              :alt="
                TIER_OPTIONS.find(
                  opt => opt.value === gameSettingsStore.defaultTier
                )?.label
              "
              class="mt-0.5 h-4 w-4"
            />
            <span>{{
              TIER_OPTIONS.find(
                opt => opt.value === gameSettingsStore.defaultTier
              )?.label || '选择分段'
            }}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in TIER_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            <div class="flex items-center gap-2">
              <img
                v-if="option.tier"
                :src="getRankMiniImageUrl(option.tier)"
                :alt="option.label"
                class="mt-0.5 h-4 w-4"
              />
              <span>{{ option.label }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
