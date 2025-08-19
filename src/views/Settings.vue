<script setup lang="ts">
import { ref } from 'vue';
// 导入子组件
import GameSettings from '@/components/settings/GameSettings.vue';
import PositionSettings from '@/components/settings/PositionSettings.vue';

// 组件引用
const gameSettingsRef = ref();
const positionSettingsRef = ref();
</script>

<template>
  <main class="relative flex h-[calc(100vh-40px)] flex-col">
    <!-- 主内容容器 -->
    <div class="relative z-10 mx-auto flex max-w-7xl flex-1 flex-col p-6">
      <!-- 主内容区域 - 调整为单列布局 -->
      <div class="flex flex-1 justify-center">
        <!-- 设置内容区域 -->
        <div class="flex w-4xl flex-col space-y-6">
          <!-- 游戏设置 -->
          <GameSettings ref="gameSettingsRef" />

          <!-- 位置设置 -->
          <PositionSettings ref="positionSettingsRef" />
        </div>
      </div>
    </div>
  </main>
</template>
