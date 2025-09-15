<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, onMounted } from 'vue';
import { X } from 'lucide-vue-next';

const isMaximized = ref(false);

const updateMaximizedState = async () => {
  isMaximized.value = await (window as any).electronAPI.windowIsMaximized();
};

// 子窗口控制函数 - 只包含关闭功能，因为子窗口通常不需要最小化和最大化
const closeWindow = async () => {
  // 对于子窗口，我们调用专门的关闭方法
  await (window as any).electronAPI.closeChampionSelectorWindow();
};

onMounted(() => {
  updateMaximizedState();
});
</script>

<template>
  <div class="window-controls flex h-full" style="-webkit-app-region: no-drag">
    <!-- 关闭按钮 - 子窗口只需要关闭按钮 -->
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
