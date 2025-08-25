<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, onMounted } from 'vue';
import { Minus, Square, X, Copy } from 'lucide-vue-next';

const isMaximized = ref(false);

const updateMaximizedState = async () => {
  isMaximized.value = await (window as any).electronAPI.windowIsMaximized();
};

// 窗口控制函数
const minimizeWindow = async () => {
  await (window as any).electronAPI.windowMinimize();
};

const maximizeWindow = async () => {
  await (window as any).electronAPI.windowMaximize();
  // 更新最大化状态
  await updateMaximizedState();
};

const closeWindow = async () => {
  await (window as any).electronAPI.windowClose();
};

onMounted(() => {
  updateMaximizedState();
});
</script>

<template>
  <div class="window-controls flex h-full" style="-webkit-app-region: no-drag">
    <!-- 最小化按钮 -->
    <Button
      variant="ghost"
      class="control-btn"
      @click="minimizeWindow"
      :title="'最小化'"
    >
      <Minus class="h-4 w-4" />
    </Button>

    <!-- 最大化/还原按钮 -->
    <Button
      variant="ghost"
      class="control-btn"
      @click="maximizeWindow"
      :title="isMaximized ? '还原' : '最大化'"
    >
      <Square v-if="!isMaximized" class="h-4 w-4" />
      <Copy v-else class="h-4 w-4" />
    </Button>

    <!-- 关闭按钮 -->
    <Button
      variant="ghost"
      class="control-btn close-btn"
      @click="closeWindow"
      :title="'关闭'"
    >
      <X class="h-4 w-4" />
    </Button>
  </div>
</template>

<style scoped>
.window-controls {
  display: flex;
  height: 100%;
  /* 窗口控制按钮不应该拖拽窗口 */
  -webkit-app-region: no-drag;
}

.control-btn {
  height: 40px !important;
  width: 40px !important;
  border-radius: 0 !important;
  transition: all 0.15s ease !important;
  /* 确保按钮可以点击 */
  -webkit-app-region: no-drag;
}

.control-btn:hover {
  background-color: var(--muted) !important;
}

.control-btn:active {
  transform: scale(0.95);
}

.close-btn:hover {
  background-color: #ef4444 !important;
  color: white !important;
}

/* SVG 图标样式 */
.control-btn svg {
  transition: all 0.15s ease;
}

.control-btn:hover svg {
  opacity: 0.8;
}
</style>
