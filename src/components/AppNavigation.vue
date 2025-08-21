<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Loading from '@/components/Loading.vue';
import { useMatchHistoryStore } from '@/stores/match-history';
import { navigationItems } from '@/config/navigation';
import { SearchHistoryItem } from '@/storages/storage-use';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 当前激活的路由
const currentRoute = computed(() => route.name);

// 使用 Pinia store
const matchHistoryStore = useMatchHistoryStore();
const { sgpMatchService } = matchHistoryStore.getServices();

// 本地搜索状态
const summonerName = ref<SearchHistoryItem>({
  name: '',
  serverId: '',
  serverName: '',
  puuid: '',
});

// 计算属性
const isSearching = computed(() => matchHistoryStore.isSearching);
const searchHistory = computed(() => matchHistoryStore.searchHistory);
const availableServers = computed(() => matchHistoryStore.availableServers);
const selectedServerId = computed({
  get: () => matchHistoryStore.selectedServerId,
  set: (value: string) => {
    matchHistoryStore.setSelectedServerId(value);
    // 同时更新本地搜索状态中的服务器信息
    const selectedServer = availableServers.value.find(s => s.id === value);
    if (selectedServer) {
      summonerName.value.serverId = selectedServer.id;
      summonerName.value.serverName = selectedServer.name;
    }
  },
});

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path);
};

// 搜索功能 - 简化为只调用 store 方法
const handleSearch = async () => {
  if (!summonerName.value.name.trim()) return;

  try {
    await matchHistoryStore.searchSummonerByName(summonerName.value.name);
    // store 内部会处理路由跳转
  } catch (error: any) {
    console.error('搜索失败:', error);
    // 这里可以添加错误提示
  }
};

// 搜索当前登录的召唤师 - 简化为只调用 store 方法
const searchCurrentSummoner = async () => {
  try {
    const serverId = await sgpMatchService._inferCurrentUserServerId();
    console.log(
      `searchCurrentSummoner 输入: serverId=${serverId} fullGameName=${userStore.fullGameName}`
    );

    await matchHistoryStore.searchSummonerByName(
      userStore.fullGameName,
      serverId!
    );
    // store 内部会处理路由跳转
  } catch (error: any) {
    console.error('搜索当前召唤师失败:', error);
    // 这里可以添加错误提示
  }
};

// 从历史记录搜索
const searchFromHistory = async (item: SearchHistoryItem) => {
  summonerName.value = { ...item };
  // 设置对应的服务器
  selectedServerId.value = item.serverId;
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
      <!-- 服务器选择和搜索输入框 - 融合版本 -->
      <div class="flex items-center space-x-2">
        <!-- 融合的搜索框 -->
        <div
          class="border-input bg-background relative flex h-8 overflow-hidden rounded-md border"
        >
          <!-- 服务器选择框 - 作为输入框的前缀 -->
          <Select v-model="selectedServerId">
            <SelectTrigger
              class="border-input bg-muted/30 -mt-1 h-8 w-28 border-0 text-xs ring-0 ring-offset-0 outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
            >
              <SelectValue placeholder="服务器" class="h-8" />
            </SelectTrigger>
            <SelectContent class="z-999999 -mt-1 -ml-[0.5px]">
              <SelectItem
                v-for="server in availableServers"
                :key="server.id"
                :value="server.id"
              >
                {{ server.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- 搜索输入框 - 无边框，与选择框融合 -->
          <div class="relative flex-1">
            <Input
              v-model="summonerName.name"
              placeholder="召唤师名称#00000..."
              class="h-8 border-0 pr-20 pl-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              @keyup.enter="handleSearch"
              :disabled="isSearching"
            />
            <!-- "我" 按钮 - 在输入框内部左侧 -->
            <Button
              @click="searchCurrentSummoner"
              :disabled="isSearching"
              class="absolute top-1/2 left-1 h-6 -translate-y-1/2 cursor-pointer px-2 text-xs"
              size="sm"
            >
              我
            </Button>
            <!-- 搜索按钮 - 在输入框内部右侧 -->
            <Button
              @click="handleSearch"
              :disabled="!summonerName.name.trim() || isSearching"
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
            {{ item.serverName }} {{ item.name }}
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
