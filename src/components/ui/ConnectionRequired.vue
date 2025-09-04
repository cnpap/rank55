<template>
  <div class="flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
    <!-- 图标 -->
    <div class="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
      <svg
        class="w-8 h-8 text-blue-600 dark:text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        ></path>
      </svg>
    </div>

    <!-- 标题 -->
    <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
      需要连接游戏客户端
    </h3>

    <!-- 描述 -->
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
      {{ message || '此功能需要连接到英雄联盟客户端才能使用。请启动游戏客户端后，相关设置选项将自动显示。' }}
    </p>
  </div>
</template>

<script setup lang="ts">
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