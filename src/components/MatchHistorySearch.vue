<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMatchHistoryStore } from '@/stores/match-history';

const router = useRouter();
const route = useRoute();
const matchHistoryStore = useMatchHistoryStore();

// 本地搜索状态
const summonerName = ref('');

// 计算属性
const isSearching = computed(() => matchHistoryStore.isSearching);
const searchHistory = computed(() => matchHistoryStore.searchHistory);

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

// 键盘事件处理
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSearch();
  }
};
</script>

<template>
  <div class="flex items-center space-x-3">
    <!-- 搜索输入框 -->
    <div class="flex items-center space-x-2">
      <div class="relative">
        <Input
          v-model="summonerName"
          placeholder="召唤师名称#00000..."
          class="h-8 w-64 pr-20 pl-10 text-sm"
          @keypress="handleKeyPress"
          :disabled="isSearching"
        />
        <!-- "我" 按钮 - 在输入框内部左侧 -->
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
            <div
              class="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></div>
            搜索中
          </span>
          <span v-else>搜索</span>
        </Button>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="searchHistory.length > 0" class="flex items-center space-x-1">
      <span class="text-muted-foreground text-xs">历史:</span>
      <button
        v-for="(item, index) in searchHistory"
        :key="index"
        class="bg-card hover:bg-card/80 border-border/40 hover:border-border/60 text-muted-foreground hover:text-foreground rounded-md border px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105"
        @click="searchFromHistory(item)"
        :disabled="isSearching"
      >
        {{ item }}
      </button>
    </div>
  </div>
</template>
