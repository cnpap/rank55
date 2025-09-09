<script setup lang="ts">
import { computed } from 'vue';
import BriefMatchHistory from './BriefMatchHistory.vue';
import Loading from '@/components/Loading.vue';
import Button from '@/components/ui/button/Button.vue';

interface Props {
  isLoading: boolean;
  error?: string;
  matchHistory?: any;
  summoner?: any;
  maxMatches?: number;
}

interface Emits {
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxMatches: 20,
});

const emit = defineEmits<Emits>();

const handleRetry = () => {
  emit('retry');
};
</script>

<template>
  <div
    class="bg-slate-25/50 relative flex-1 overflow-hidden dark:bg-[#121212]/50"
  >
    <div class="h-full overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <div class="flex flex-col items-center justify-center space-y-3">
          <Loading size="md" class="text-primary" />
          <p class="text-xs font-medium text-slate-600 dark:text-slate-400">
            加载战绩中...
          </p>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex h-full items-center justify-center">
        <div class="flex flex-col items-center justify-center space-y-3">
          <div
            class="flex h-8 w-8 items-center justify-center border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50"
          >
            <svg
              class="h-4 w-4 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p
            class="max-w-28 text-center text-xs leading-tight font-medium text-red-600 dark:text-red-400"
          >
            {{ error }}
          </p>
          <Button
            @click="handleRetry"
            :disabled="isLoading"
            variant="outline"
            size="sm"
          >
            <svg
              class="mr-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ isLoading ? '重试中...' : '重试' }}
          </Button>
        </div>
      </div>

      <!-- 战绩信息 -->
      <div v-else-if="matchHistory && summoner">
        <BriefMatchHistory
          class="gap-1"
          :match-history="matchHistory"
          :summoner="summoner"
          :max-matches="maxMatches"
        />
      </div>

      <!-- 数据加载完成但无战绩数据 -->
      <div v-else class="flex h-full items-center justify-center">
        <div class="flex flex-col items-center justify-center space-y-3">
          <div
            class="flex h-8 w-8 items-center justify-center border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
          >
            <svg
              class="h-4 w-4 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p class="text-xs font-medium text-slate-600 dark:text-slate-400">
            暂无战绩数据
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
