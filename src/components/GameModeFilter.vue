<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GameModesFilter, GameModeTag } from '@/types/match-history-ui';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';
import { AcceptableValue } from 'reka-ui';

interface Props {
  modelValue: GameModesFilter;
}

interface Emits {
  (e: 'update:modelValue', value: GameModesFilter): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 游戏模式选项
const gameModeOptions = Object.entries(GAME_MODE_TAGS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// 更新过滤器状态
function updateFilter(tag: AcceptableValue) {
  emit('update:modelValue', {
    selectedTag: tag as string,
  });
}
</script>

<template>
  <div
    class="border-border/40 bg-card/70 flex items-center gap-6 rounded border p-3 px-4"
  >
    <span class="text-foreground text-sm font-medium">游戏模式:</span>
    <Select
      :model-value="modelValue.selectedTag"
      @update:model-value="updateFilter"
    >
      <SelectTrigger class="w-40">
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
