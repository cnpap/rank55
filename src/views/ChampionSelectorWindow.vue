<script setup lang="ts">
import { onMounted } from 'vue';
import ChildWindowControls from '@/components/ChildWindowControls.vue';

// 当组件挂载时，可以在这里添加初始化逻辑
onMounted(() => {
  console.log('英雄选择器窗口已加载');
});
</script>

<template>
  <div class="champion-selector-window">
    <!-- 使用统一的标题栏组件 -->
    <div class="bg-background border-border border-b">
      <div
        class="bg-background flex h-10 w-full items-center justify-between"
        style="-webkit-app-region: drag"
      >
        <!-- 左侧标题区域 -->
        <div
          class="flex h-full flex-1 items-center px-4 select-none"
          style="-webkit-app-region: drag"
        >
          <h1 class="text-foreground text-sm font-medium">英雄选择器</h1>
        </div>

        <!-- 右侧窗口控制按钮 -->
        <div
          class="flex h-full items-center"
          style="-webkit-app-region: no-drag"
        >
          <ChildWindowControls />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content">
      <div class="placeholder">
        <h2>英雄选择器窗口</h2>
        <p>这是一个新的弹窗窗口，用于选择英雄。</p>
        <p>具体功能将在后续实现。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.champion-selector-window {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 标题栏样式已通过组件处理，这里不需要额外样式 */

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.placeholder {
  text-align: center;
  background: white;
  padding: 40px;
  max-width: 400px;
}

.placeholder h2 {
  color: #2c3e50;
  margin-bottom: 16px;
}

.placeholder p {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 12px;
}

.placeholder p:last-child {
  margin-bottom: 0;
}
</style>
