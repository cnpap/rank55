<script setup lang="ts">
// 弹窗布局组件 - 不包含主应用的顶部栏
// 用于独立窗口，如英雄选择器等
</script>

<template>
  <div class="popup-layout">
    <!-- 直接渲染页面内容，不包含主应用的顶部栏 -->
    <slot />
  </div>
</template>

<style scoped>
.popup-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
