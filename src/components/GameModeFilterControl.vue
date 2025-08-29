<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AcceptableValue } from 'reka-ui';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';
import { useGameModeFilterControl } from '@/lib/composables/useMatchHistoryQuery';

// 通过 inject 获取过滤控制
const gameModeFilterControl = useGameModeFilterControl();

// 游戏模式选项 - 使用新的tag系统
const gameModeOptions = Object.entries(GAME_MODE_TAGS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// 处理游戏模式变更
function handleGameModeChange(value: AcceptableValue) {
  const newFilter = {
    selectedTag: value as string,
  };
  gameModeFilterControl.changeGameModeFilter(newFilter);
}
</script>

<template>
  <div class="flex items-center gap-3">
    <Select
      :model-value="gameModeFilterControl.gameModesFilter.selectedTag"
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
</template>
