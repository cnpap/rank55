<template>
  <div class="flex flex-col items-center justify-center p-8 text-center rounded-lg ">
    <!-- 图标 -->
    <div class="mb-4">
      <img
        :src="staticAssets.getIcon('icon')"
        alt="连接图标"
        class="w-12 h-12"
      />
    </div>

    <!-- 标题 -->
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
      等待游戏客户端
    </h3>

    <!-- 描述 -->
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
      {{ message || '游戏客户端启动后将会自动连接' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { staticAssets } from '@/assets/data-assets';

interface Props {
  message?: string;
}

withDefaults(defineProps<Props>(), {
  message: '',
});
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>