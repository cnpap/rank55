<script setup lang="ts">
import { computed, onMounted } from 'vue';
import SummonerProfileComponent from './SummonerProfile.vue';
import MatchHistoryContainer from './MatchHistoryContainer.vue';
import Loading from './Loading.vue';
import { useMatchHistoryStore } from '@/stores/match-history';

// 使用 Pinia store
const matchHistoryStore = useMatchHistoryStore();

// 计算属性，从 store 中获取数据
const currentSummoner = computed(() => matchHistoryStore.currentSummoner);
const rankedStats = computed(() => matchHistoryStore.rankedStats);
const matchHistory = computed(() => matchHistoryStore.matchHistory);
const errorMessage = computed(() => matchHistoryStore.errorMessage);
const hasAnyData = computed(() => matchHistoryStore.hasAnyData);
const showMatchHistory = computed(() => matchHistoryStore.showMatchHistory);
const isSearching = computed(() => matchHistoryStore.isSearching);

// 组件挂载时自动查询当前登录的召唤师
onMounted(async () => {
  // 如果还没有任何数据，则自动查询当前召唤师
  if (!hasAnyData.value) {
    await matchHistoryStore.searchCurrentSummoner();
  }
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 加载状态 -->
    <div
      v-if="isSearching && !hasAnyData"
      class="flex flex-1 items-center justify-center"
    >
      <div class="flex flex-col items-center space-y-4">
        <Loading size="lg" />
        <p class="text-muted-foreground text-sm">正在获取当前账号信息...</p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-else class="space-y-4">
      <!-- 错误信息 -->
      <div
        v-if="errorMessage"
        class="border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border p-3 text-sm"
      >
        <svg
          class="h-4 w-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        {{ errorMessage }}
      </div>

      <!-- 召唤师资料 -->
      <div v-if="showMatchHistory && currentSummoner && rankedStats">
        <SummonerProfileComponent
          :summoner-data="currentSummoner"
          :ranked-stats="rankedStats"
        />
      </div>

      <!-- 历史战绩 -->
      <div v-if="showMatchHistory && matchHistory && currentSummoner">
        <MatchHistoryContainer
          :match-history="matchHistory"
          :summoner="currentSummoner"
        />
      </div>
    </div>
  </div>
</template>
