<script setup lang="ts">
import { computed } from 'vue';
import {
  getEfficiencyGrade,
  getEfficiencyDescription,
} from '@/utils/item-calculator';

interface Props {
  efficiency: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showTooltip: true,
});

const gradeInfo = computed(() => getEfficiencyGrade(props.efficiency));
const description = computed(() => getEfficiencyDescription(props.efficiency));

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-6 h-4 text-xs';
    case 'lg':
      return 'w-12 h-7 text-sm';
    default:
      return 'w-10 h-6 text-xs';
  }
});
</script>

<template>
  <div
    :class="[
      'inline-flex items-center justify-center rounded-md pb-0.5 font-bold transition-all duration-200 select-none hover:scale-105',
      sizeClasses,
      gradeInfo.textColor,
      gradeInfo.bgColor,
    ]"
    :title="showTooltip ? `${description} (${efficiency}%)` : undefined"
  >
    {{ gradeInfo.score }}
  </div>
</template>
