<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ref, onMounted } from 'vue';
import { Minus, Square, X, Copy } from 'lucide-vue-next';

// Props
interface Props {
  isElectron?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isElectron: false,
});

const isMaximized = ref(false);

const updateMaximizedState = async () => {
  if (props.isElectron && (window as any).electronAPI) {
    try {
      isMaximized.value = await (window as any).electronAPI.windowIsMaximized();
    } catch (error) {
      console.error('Failed to get window state:', error);
    }
  }
};

// 窗口控制函数
const minimizeWindow = async () => {
  if (props.isElectron && (window as any).electronAPI) {
    try {
      await (window as any).electronAPI.windowMinimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  } else {
    console.log('最小化窗口 (浏览器环境下不可用)');
  }
};

const maximizeWindow = async () => {
  if (props.isElectron && (window as any).electronAPI) {
    try {
      await (window as any).electronAPI.windowMaximize();
      // 更新最大化状态
      await updateMaximizedState();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  } else {
    console.log('最大化窗口 (浏览器环境下不可用)');
  }
};

const closeWindow = async () => {
  if (props.isElectron && (window as any).electronAPI) {
    try {
      await (window as any).electronAPI.windowClose();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  } else {
    // 在浏览器环境下，可以关闭当前标签页
    if (confirm('确定要关闭应用吗？')) {
      window.close();
    }
  }
};

onMounted(() => {
  if (props.isElectron) {
    // 获取初始最大化状态
    updateMaximizedState();
  }
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
