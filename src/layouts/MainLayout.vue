<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner';
import 'vue-sonner/style.css';
import CustomTitleBar from '@/components/CustomTitleBar.vue';
import Loading from '@/components/Loading.vue';
import { onMounted, onUnmounted, ref, provide } from 'vue';
import { useAutoAcceptGame } from '@/hooks/use-auto-accept-game';
import { versionUtils } from '@/assets/versioned-assets';
import Button from '@/components/ui/button/Button.vue';
import { useClientUserStore } from '@/stores/client-user';
import ConnectionRequired from '@/components/ui/ConnectionRequired.vue';

// 版本初始化状态
const isVersionsLoaded = ref(false);
const isVersionsLoading = ref(true);
const userStore = useClientUserStore();

// 使用自动接受游戏功能
const { currentPhase, clientUser, gamePhaseManager, isConnected } =
  useAutoAcceptGame();

// 通过 provide 向子组件提供房间状态
provide('gameState', {
  currentPhase,
  clientUser,
  gamePhaseManager,
  isConnected,
});

// 重新加载页面的方法
const handleReload = () => {
  window.location.reload();
};

onMounted(async () => {
  try {
    // 初始化版本信息
    const versionsInitialized = await versionUtils.initializeVersions();
    isVersionsLoaded.value = versionsInitialized;
  } catch (error) {
    console.error('应用初始化失败:', error);
    isVersionsLoaded.value = false;
  } finally {
    isVersionsLoading.value = false;
  }
});
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- 固定顶部栏 -->
    <CustomTitleBar />

    <!-- 主内容区域 -->
    <main class="flex-1 pt-10" v-if="userStore.isLoggedIn && isConnected">
      <!-- 版本加载中状态 -->
      <div
        v-if="isVersionsLoading"
        class="flex h-full items-center justify-center p-8"
      >
        <div class="flex max-w-sm flex-col items-center text-center">
          <Loading size="lg" class="text-primary mb-4" />
          <p class="text-gray-600">正在加载版本信息...</p>
        </div>
      </div>

      <!-- 版本加载失败状态 -->
      <div
        v-else-if="!isVersionsLoaded"
        class="flex h-full items-center justify-center p-8"
      >
        <div class="flex max-w-sm flex-col items-center text-center">
          <h2 class="mb-4 text-xl font-semibold text-red-500">
            版本信息加载失败
          </h2>
          <p class="mb-6 leading-relaxed text-gray-600">
            无法获取游戏版本信息，请检查网络连接或稍后重试。
          </p>
          <Button @click="handleReload"> 重新加载 </Button>
        </div>
      </div>

      <!-- 正常应用内容 -->
      <template v-else>
        <!-- 插槽用于渲染页面内容 -->
        <slot />
      </template>
    </main>

    <div v-else class="flex h-full w-full items-center justify-center">
      <div class="w-4xl">
        <ConnectionRequired />
      </div>
    </div>

    <!-- 全局通知 -->
    <Toaster />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.loading-content,
.error-content {
  text-align: center;
  max-width: 400px;
}

.error-content h2 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.error-content p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #2980b9;
}
</style>
