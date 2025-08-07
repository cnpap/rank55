<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/Loading.vue';
import { useMatchHistoryStore } from '@/stores/match-history';
import { navigationItems } from '@/config/navigation';

const route = useRoute();
const router = useRouter();

// 当前激活的路由
const currentRoute = computed(() => route.name);

// 使用 Pinia store
const matchHistoryStore = useMatchHistoryStore();

// 本地搜索状态
const summonerName = ref('');

// 计算属性
const isSearching = computed(() => matchHistoryStore.isSearching);
const searchHistory = computed(() => matchHistoryStore.searchHistory);

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path);
};

// 搜索功能
const handleSearch = async () => {
  if (!summonerName.value.trim()) return;

  await matchHistoryStore.searchSummonerByName(summonerName.value);

  // 搜索成功后跳转到首页
  if (route.name !== 'Home') {
    router.push('/');
  }
};

// 搜索当前登录的召唤师
const searchCurrentSummoner = async () => {
  await matchHistoryStore.searchCurrentSummoner();

  // 搜索成功后跳转到首页
  if (route.name !== 'Home') {
    router.push('/');
  }
};

// 从历史记录搜索
const searchFromHistory = async (name: string) => {
  summonerName.value = name;
  await handleSearch();
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
        class="relative rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200"
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
      <!-- 搜索输入框 -->
      <div class="flex items-center space-x-2">
        <div class="relative">
          <Input
            v-model="summonerName"
            placeholder="召唤师名称#00000..."
            class="h-8 w-64 pr-20 pl-10 text-sm"
            @keyup.enter="handleSearch"
            :disabled="isSearching"
          />
          <!-- "我" 按钮 - 在输入框内部左侧，样式与搜索按钮保持一致 -->
          <Button
            @click="searchCurrentSummoner"
            :disabled="isSearching"
            class="bg-secondary hover:bg-secondary/80 text-secondary-foreground absolute top-1/2 left-1 h-6 -translate-y-1/2 cursor-pointer px-2 text-xs"
            size="sm"
            variant="secondary"
          >
            我
          </Button>
          <!-- 搜索按钮 - 在输入框内部右侧 -->
          <Button
            @click="handleSearch"
            :disabled="!summonerName.trim() || isSearching"
            class="absolute top-1/2 right-1 h-6 -translate-y-1/2 cursor-pointer px-2 text-xs"
            size="sm"
          >
            <span v-if="isSearching" class="flex items-center gap-1">
              <Loading size="xs" />
              搜索中
            </span>
            <span v-else>搜索</span>
          </Button>
        </div>
      </div>

      <!-- 搜索历史 - 在搜索框后面 -->
      <div
        v-if="searchHistory.length > 0"
        class="flex max-w-80 items-center space-x-1 overflow-hidden whitespace-nowrap"
      >
        <span class="text-muted-foreground flex-shrink-0 text-xs">历史:</span>
        <div class="flex items-center space-x-1 overflow-hidden">
          <button
            v-for="(item, index) in searchHistory.slice(0, 3)"
            :key="index"
            class="bg-card hover:bg-card/80 border-border/40 hover:border-border/60 text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer rounded border px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105"
            @click="searchFromHistory(item)"
            :disabled="isSearching"
          >
            {{ item }}
          </button>
          <span
            v-if="searchHistory.length > 3"
            class="text-muted-foreground flex-shrink-0 text-xs"
            >...</span
          >
        </div>
      </div>
    </div>
  </nav>
</template>
