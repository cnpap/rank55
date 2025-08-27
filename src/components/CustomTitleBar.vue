<script setup lang="ts">
import { computed } from 'vue';
import { User } from 'lucide-vue-next';
import ThemeToggle from '@/components/ThemeToggle.vue';
import AppNavigation from '@/components/AppNavigation.vue';
import WindowControls from '@/components/WindowControls.vue';
import { useClientUserStore } from '@/stores/client-user';
import { staticAssets } from '@/assets/data-assets';

// 使用 user store 获取用户信息
const userStore = useClientUserStore();

// 用户信息计算属性 - 直接使用 store 中的计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn);
const displayName = computed(() => userStore.displayName);
const profileIconId = computed(() => userStore.profileIconId);
const summonerLevel = computed(() => userStore.summonerLevel);
const hasUserError = computed(() => userStore.hasError);

// 获取召唤师头像URL
const profileIconUrl = computed(() => {
  return staticAssets.getProfileIcon(String(profileIconId.value));
});

// 双击拖拽区域触发最大化/还原
const handleDoubleClick = () => {
  (window as any).electronAPI.windowMaximize();
};
</script>

<template>
  <div
    class="bg-background border-border fixed top-0 right-0 left-0 z-[1000] border-b"
  >
    <!-- 主标题栏 -->
    <div
      class="bg-background flex h-10 w-full items-center justify-between"
      style="-webkit-app-region: drag"
    >
      <!-- 可拖拽区域 -->
      <div
        class="flex h-full flex-1 items-center select-none"
        style="-webkit-app-region: drag"
        @dblclick="handleDoubleClick"
      >
        <!-- 左侧导航 -->
        <div
          class="flex h-full items-center px-3"
          style="-webkit-app-region: no-drag"
        >
          <AppNavigation />
        </div>
      </div>

      <!-- 右侧控制区 -->
      <div
        class="flex h-full items-center gap-2"
        style="-webkit-app-region: no-drag"
      >
        <!-- 用户信息区域 -->
        <div class="flex items-center gap-2 px-2">
          <!-- 用户头像和信息 -->
          <div
            v-if="isLoggedIn"
            class="flex items-center gap-2 px-2 py-1"
            :title="`等级: ${summonerLevel}\n名称: ${displayName}`"
          >
            <!-- 头像 -->
            <div class="relative">
              <img
                v-if="profileIconUrl"
                :src="profileIconUrl"
                :alt="displayName"
                class="border-border h-6 w-6 border"
                @error="() => {}"
              />
              <div
                v-else
                class="bg-muted border-border flex h-6 w-6 items-center justify-center border"
              >
                <User class="text-muted-foreground h-3 w-3" />
              </div>
              <!-- 等级标识 -->
              <div
                class="bg-primary text-primary-foreground absolute -right-2 -bottom-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-sm px-1 text-xs"
                style="font-size: 10px; line-height: 1"
              >
                {{ summonerLevel }}
              </div>
            </div>
            <!-- 用户名 -->
            <span
              class="text-foreground max-w-[100px] truncate text-xs font-medium"
            >
              {{ displayName }}
            </span>
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="hasUserError"
            class="flex items-center gap-2 px-2 py-1"
            title="用户信息获取失败"
          >
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20"
            >
              <User class="h-3 w-3 text-red-500" />
            </div>
            <span class="text-xs text-red-500">连接失败</span>
          </div>

          <!-- 未登录状态 -->
          <div
            v-else
            class="flex items-center gap-2 px-2 py-1"
            title="未连接到LOL客户端"
          >
            <div
              class="bg-muted border-border flex h-6 w-6 items-center justify-center rounded-full border"
            >
              <User class="text-muted-foreground h-3 w-3" />
            </div>
            <span class="text-muted-foreground text-xs">未连接</span>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="bg-border h-3 w-px opacity-50"></div>

        <!-- 主题切换和设置 -->
        <div class="bg-muted/30 flex items-center gap-1.5 rounded-md">
          <ThemeToggle />
        </div>

        <!-- 窗口控制按钮组件 -->
        <WindowControls />
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-bar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
}

.title-bar {
  display: flex;
  height: 40px;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background-color: var(--background);
  /* 在 Electron 中，整个标题栏区域都可以拖拽 */
  -webkit-app-region: drag;
}

.drag-region {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  user-select: none;
  /* 确保拖拽区域可以拖拽窗口 */
  -webkit-app-region: drag;
}

.navigation-area {
  padding: 0 12px;
  height: 100%;
  display: flex;
  align-items: center;
  /* 导航按钮不应该拖拽窗口 */
  -webkit-app-region: no-drag;
}

.controls-area {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 8px;
  /* 右侧控制区不应该拖拽窗口 */
  -webkit-app-region: no-drag;
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: var(--muted/30);
}

.separator {
  width: 1px;
  height: 16px;
  background-color: var(--border);
  opacity: 0.5;
}

.settings-btn {
  height: 28px !important;
  padding: 0 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  color: var(--muted-foreground) !important;
}

.settings-btn:hover {
  color: var(--foreground) !important;
  background-color: var(--background/50) !important;
}
</style>
