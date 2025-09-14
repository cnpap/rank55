<script setup lang="ts">
import { ref, watch } from 'vue';
import { $local } from '@/storages/storage-use';
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
import { GAME_MODE_TAGS } from '@/types/match-history-ui';
import { AcceptableValue } from 'reka-ui';
import type { RegionType, TierType } from '@/lib/service/opgg/types';
import { getRankMiniImageUrl } from '@/lib/rank-helpers';

const savedAutoAccept = $local.getItem('autoAcceptGame');
const autoAcceptGame = ref(savedAutoAccept || false);

// 默认游戏过滤模式设置
const savedDefaultGameMode = $local.getItem('defaultGameMode');
const defaultGameMode = ref(savedDefaultGameMode || 'all');

// 游戏模式选项
const gameModeOptions = Object.entries(GAME_MODE_TAGS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// 默认服务器设置
const savedDefaultRegion = $local.getItem('defaultRegion');
const defaultRegion = ref<RegionType>(savedDefaultRegion || 'kr');

// 默认分段设置
const savedDefaultTier = $local.getItem('defaultTier');
const defaultTier = ref<TierType>(savedDefaultTier || 'diamond_plus');

// 服务器选项
const regionOptions = [
  { value: 'global', label: '全球' },
  { value: 'kr', label: '韩服' },
  { value: 'na', label: '北美' },
] as const;

// 分段选项
const tierOptions = [
  { value: 'all', label: '全部分段', tier: null },
  { value: 'challenger', label: '王者', tier: 'CHALLENGER' },
  { value: 'grandmaster', label: '宗师', tier: 'GRANDMASTER' },
  { value: 'master_plus', label: '大师以上', tier: 'MASTER' },
  { value: 'master', label: '大师', tier: 'MASTER' },
  { value: 'diamond_plus', label: '钻石以上', tier: 'DIAMOND' },
  { value: 'emerald_plus', label: '翡翠以上', tier: 'EMERALD' },
  { value: 'platinum_plus', label: '白金以上', tier: 'PLATINUM' },
  { value: 'gold_plus', label: '黄金以上', tier: 'GOLD' },
] as const;

// 保存设置
function saveSettings() {
  $local.setItem('autoAcceptGame', autoAcceptGame.value);
  $local.setItem('defaultGameMode', defaultGameMode.value);
  $local.setItem('defaultRegion', defaultRegion.value);
  $local.setItem('defaultTier', defaultTier.value);
  toast.success('游戏设置已保存');
}

// 监听设置变化并自动保存
watch(autoAcceptGame, () => {
  saveSettings();
});

watch(defaultGameMode, () => {
  saveSettings();
});

watch(defaultRegion, () => {
  saveSettings();
});

watch(defaultTier, () => {
  saveSettings();
});

// 处理游戏模式变更
function handleGameModeChange(value: AcceptableValue) {
  defaultGameMode.value = value as string;
}

// 处理服务器变更
function handleRegionChange(value: AcceptableValue) {
  defaultRegion.value = value as RegionType;
}

// 处理分段变更
function handleTierChange(value: AcceptableValue) {
  defaultTier.value = value as TierType;
}

// 重置设置
function resetSettings() {
  autoAcceptGame.value = false;
  defaultGameMode.value = 'all';
  defaultRegion.value = 'kr';
  defaultTier.value = 'diamond_plus';
  saveSettings();
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
        <input type="checkbox" v-model="autoAcceptGame" class="peer sr-only" />
        <div
          class="bg-muted-foreground/20 peer relative h-6 w-11 rounded-full peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
        ></div>
      </label>
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
        :model-value="defaultGameMode"
        @update:model-value="handleGameModeChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
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

    <!-- 默认服务器选择 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h4 class="text-foreground font-medium">默认服务器</h4>
        <p class="text-muted-foreground mt-1 text-sm">
          设置从 OP.GG 获取数据时的默认服务器
        </p>
      </div>

      <!-- 服务器选择器 -->
      <Select
        :model-value="defaultRegion"
        @update:model-value="handleRegionChange"
      >
        <SelectTrigger class="h-8 w-48 text-sm">
          <SelectValue placeholder="选择服务器" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in regionOptions"
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
          设置从 OP.GG 获取数据时的默认分段过滤器
        </p>
      </div>

      <!-- 分段选择器 -->
      <Select :model-value="defaultTier" @update:model-value="handleTierChange">
        <SelectTrigger class="h-8 w-48 text-sm">
          <div class="flex items-center gap-2">
            <img
              v-if="tierOptions.find(opt => opt.value === defaultTier)?.tier"
              :src="
                getRankMiniImageUrl(
                  tierOptions.find(opt => opt.value === defaultTier)?.tier!
                )
              "
              :alt="tierOptions.find(opt => opt.value === defaultTier)?.label"
              class="mt-0.5 h-4 w-4"
            />
            <span>{{
              tierOptions.find(opt => opt.value === defaultTier)?.label ||
              '选择分段'
            }}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in tierOptions"
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
