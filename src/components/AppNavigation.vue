<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { navigationItems } from '@/config/navigation';
import SummonerSearch from './SummonerSearch.vue';

const route = useRoute();
const router = useRouter();

// 当前激活的路由
const currentRoute = computed(() => route.name);

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path);
};

// 搜索事件处理
const handleSearchStart = (summonerName: string, serverId: string) => {
  console.log('开始搜索:', summonerName, '服务器:', serverId);
};

const handleSearchSuccess = (result: any) => {
  console.log('搜索成功:', result);
};

const handleSearchError = (error: string) => {
  console.error('搜索失败:', error);
  // 这里可以添加错误提示，比如 toast 通知
};
</script>

<template>
  <!-- 桌面端导航 -->
  <nav class="flex w-full items-center justify-between">
    <!-- 左侧导航菜单 -->
    <div class="flex items-center space-x-1">
      <button
        v-for="item in navigationItems"
        :key="item.name"
        class="relative px-3 py-1.5 text-sm font-medium transition-all duration-200"
        :class="{
          'bg-primary/10 text-primary': currentRoute === item.name,
          'text-muted-foreground hover:text-foreground hover:bg-muted/50':
            currentRoute !== item.name,
        }"
        @click="navigateTo(item.path)"
      >
        {{ item.title }}
        <!-- 活跃指示器 -->
        <div
          v-if="currentRoute === item.name"
          class="bg-primary absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full"
        ></div>
      </button>
    </div>

    <!-- 右侧搜索区域 -->
    <div class="flex items-center space-x-3 pl-2">
      <SummonerSearch
        class="flex items-center space-x-3"
        :show-history="true"
        :max-history-items="3"
        @search-start="handleSearchStart"
        @search-success="handleSearchSuccess"
        @search-error="handleSearchError"
      />
    </div>
  </nav>
</template>
