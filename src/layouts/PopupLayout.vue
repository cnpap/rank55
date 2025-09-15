<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>

<template>
  <div class="popup-layout">
    <!-- 直接渲染页面内容，不包含主应用的顶部栏 -->
    <slot />
  </div>
  <!-- 全局通知 -->
  <Toaster class="max-w-[250px]" position="bottom-right" />
</template>

<style scoped>
.popup-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
