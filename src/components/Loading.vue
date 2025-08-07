<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  class: '',
});

const sizeClasses = {
  xs: 'h-3 w-3 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]',
};
</script>

<template>
  <div
    :class="[
      'animate-spin rounded-full border-current border-t-transparent',
      sizeClasses[size],
      props.class || 'text-current',
    ]"
    role="status"
    aria-label="加载中"
  ></div>
</template>
