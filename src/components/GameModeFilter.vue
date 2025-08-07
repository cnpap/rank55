<script setup lang="ts">
import { Checkbox } from '@/components/ui/checkbox';
import type { GameModesFilter } from '@/types/match-history-ui';

interface Props {
  modelValue: GameModesFilter;
}

interface Emits {
  (e: 'update:modelValue', value: GameModesFilter): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 过滤器配置
const filterOptions = [
  {
    key: 'showSolo' as keyof GameModesFilter,
    label: '单双',
    description: '单双排位赛 (420)',
  },
  {
    key: 'showFlex' as keyof GameModesFilter,
    label: '灵活',
    description: '灵活排位赛 (440)',
  },
  {
    key: 'showNormal' as keyof GameModesFilter,
    label: '匹配',
    description: '普通匹配 (400, 430)',
  },
  {
    key: 'showARAM' as keyof GameModesFilter,
    label: '乱斗',
    description: '大乱斗模式 (450)',
  },
  {
    key: 'showArena' as keyof GameModesFilter,
    label: '斗魂',
    description: '斗魂竞技场 (1700)',
  },
  {
    key: 'showTraining' as keyof GameModesFilter,
    label: '训练',
    description: '训练模式 (0)',
  },
  {
    key: 'showOthers' as keyof GameModesFilter,
    label: '其他',
    description: '其他游戏模式',
  },
];

// 更新过滤器状态
function updateFilter(key: keyof GameModesFilter, value: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}
</script>

<template>
  <div
    class="border-border/40 bg-card/70 flex items-center gap-6 rounded border p-3 px-4"
  >
    <span class="text-foreground text-sm font-medium">筛选:</span>
    <div class="flex gap-4">
      <label
        v-for="option in filterOptions"
        :key="option.key"
        class="flex cursor-pointer items-center gap-1.5 transition-opacity"
        :title="option.description"
      >
        <Checkbox
          :model-value="modelValue[option.key]"
          @update:model-value="
            (value: boolean | 'indeterminate') =>
              updateFilter(
                option.key,
                value === 'indeterminate' ? false : value
              )
          "
        />
        <span class="">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>
