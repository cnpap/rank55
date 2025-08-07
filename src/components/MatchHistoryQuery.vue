<script setup lang="ts">
import { computed } from 'vue';
import SummonerProfileComponent from './SummonerProfile.vue';
import MatchHistoryContainer from './MatchHistoryContainer.vue';
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
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 欢迎信息（当没有搜索结果时显示） -->
    <div v-if="!hasAnyData" class="flex flex-1 items-center justify-center">
      <div class="max-w-lg space-y-6 text-center">
        <!-- 主标题 -->
        <h1 class="text-foreground text-5xl font-light tracking-wide">
          战绩查询
        </h1>

        <!-- 简洁提示 -->
        <div class="text-muted-foreground space-y-4">
          <p class="text-sm">点击顶部"我"按钮查看当前账号</p>
          <p class="text-sm">或在搜索框输入：召唤师名#标签</p>
        </div>
      </div>
    </div>

    <!-- 有数据时的内容区域 -->
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
