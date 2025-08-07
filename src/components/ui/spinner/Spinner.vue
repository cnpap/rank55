<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { type SpinnerVariants, spinnerVariants } from '.';

interface Props {
  variant?: SpinnerVariants['variant'];
  size?: SpinnerVariants['size'];
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
});
</script>

<template>
  <div
    :class="cn(spinnerVariants({ variant, size }), props.class)"
    role="status"
    aria-label="加载中"
  >
    <!-- 默认圆形旋转动画 -->
    <div
      v-if="variant === 'default'"
      class="animate-spin rounded-full border-2 border-current border-t-transparent"
    ></div>
    
    <!-- 脉冲动画 -->
    <div
      v-else-if="variant === 'pulse'"
      class="animate-pulse rounded-full bg-current"
    ></div>
    
    <!-- 弹跳点动画 -->
    <div
      v-else-if="variant === 'dots'"
      class="flex space-x-1"
    >
      <div class="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
      <div class="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
      <div class="h-2 w-2 animate-bounce rounded-full bg-current"></div>
    </div>
    
    <!-- 波浪动画 -->
    <div
      v-else-if="variant === 'wave'"
      class="flex space-x-1"
    >
      <div class="h-4 w-1 animate-pulse bg-current [animation-delay:0s] [animation-duration:1.2s]"></div>
      <div class="h-4 w-1 animate-pulse bg-current [animation-delay:0.1s] [animation-duration:1.2s]"></div>
      <div class="h-4 w-1 animate-pulse bg-current [animation-delay:0.2s] [animation-duration:1.2s]"></div>
      <div class="h-4 w-1 animate-pulse bg-current [animation-delay:0.3s] [animation-duration:1.2s]"></div>
    </div>
    
    <!-- 环形进度动画 -->
    <div
      v-else-if="variant === 'ring'"
      class="relative"
    >
      <div class="absolute inset-0 rounded-full border-2 border-current opacity-20"></div>
      <div class="animate-spin rounded-full border-2 border-current border-t-transparent"></div>
    </div>
    
    <!-- 流畅的圆环动画 -->
    <div
      v-else-if="variant === 'smooth'"
      class="relative"
    >
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="60"
          stroke-dashoffset="60"
          class="animate-[spin_1s_linear_infinite,dash_1.5s_ease-in-out_infinite]"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>