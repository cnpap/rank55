<script setup lang="ts">
import { onMounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import SummonerProfileComponent from '@/components/SummonerProfile.vue';
import Loading from '@/components/Loading.vue';
import MatchListItem from '@/components/MatchListItem.vue';
import MatchHistoryHeader from '@/components/MatchHistoryHeader.vue';
import { useMatchHistoryUI } from '@/lib/composables/useMatchHistoryUI';
import { useMatchHistoryQuery } from '@/lib/composables/useMatchHistoryQuery';

const route = useRoute();
const { serverId, puuid } = route.query as { serverId: string; puuid: string };
provide('serverId', serverId);
provide('puuid', puuid);

// 使用新的战绩查询 hook
const {
  isLoading,
  currentPage,
  pageSize,
  expandedMatches,
  gameModesFilter,
  summoner,
  rankedStats,
  matchHistory,
  errorMessage,
  hasAnyData,
  showMatchHistory,
  queryResult,
  loadCompleteMatchData,
  changeGameModeFilter,
  goToPage,
  changePageSize,
  toggleMatchDetail,
} = useMatchHistoryQuery({
  serverId,
  puuid,
  initialPageSize: 20,
  autoLoad: false, // 手动控制加载时机
});

// 使用UI交互逻辑
const { isSticky, sentinelRef } = useMatchHistoryUI();

// 处理游戏模式过滤器更新
function handleUpdateGameModesFilter(newFilter: any) {
  changeGameModeFilter(newFilter);
}

// 处理对局详情切换
function handleToggleMatchDetail(gameId: number) {
  toggleMatchDetail(gameId);
}

// 处理分页变化
function handlePageChangeWrapper(page: number) {
  goToPage(page);
}

function handlePageSizeChangeWrapper(size: number) {
  changePageSize(size);
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadCompleteMatchData();
});
</script>

<template>
  <main class="relative flex h-[calc(100vh-40px)] flex-col">
    <!-- 主内容容器 -->
    <div class="relative z-10 mx-auto flex flex-1 flex-col">
      <!-- 主内容区域 - 调整为单列布局 -->
      <div class="flex flex-1 justify-center">
        <!-- 战绩查询区域 -->
        <div class="flex w-full max-w-4xl flex-col">
          <div class="relative flex h-full w-4xl flex-col">
            <!-- 加载遮罩层 -->
            <div
              v-if="isLoading && !hasAnyData"
              class="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            >
              <div class="flex flex-col items-center space-y-4">
                <Loading size="lg" class="text-primary" />
                <p class="text-muted-foreground text-sm">
                  等待客户端启动完成...
                </p>
              </div>
            </div>

            <!-- 内容区域 - 始终显示 -->
            <div class="flex-1" v-else>
              <!-- 错误信息 -->
              <div
                v-if="errorMessage"
                class="flex h-full items-center justify-center"
              >
                <div
                  class="border-destructive/20 bg-destructive/5 text-destructive flex max-w-md items-center gap-2 rounded-lg border p-3 text-sm"
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
              </div>

              <div v-else>
                <!-- 用于监测 sticky 的哨兵元素 -->
                <div ref="sentinelRef" class="h-0"></div>
                <!-- 召唤师资料 -->
                <div
                  class="sticky top-10 z-50 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm dark:from-[#131313]/80 dark:to-[#151515]/90"
                >
                  <div class="pl-4">
                    <SummonerProfileComponent
                      :summoner="summoner"
                      :ranked-stats="rankedStats"
                    />
                  </div>

                  <!-- 头部组件 -->
                  <MatchHistoryHeader
                    :model-value="gameModesFilter"
                    :matches="matchHistory"
                    :current-page="currentPage"
                    :page-size="pageSize"
                    :current-user-puuid="puuid || ''"
                    :total-matches="queryResult.totalCount"
                    :is-sticky="isSticky"
                    @update:model-value="handleUpdateGameModesFilter"
                    @update:current-page="handlePageChangeWrapper"
                    @update:page-size="handlePageSizeChangeWrapper"
                  />
                </div>
                <!-- 历史战绩 - 直接使用 MatchListItem -->
                <div v-if="showMatchHistory && matchHistory">
                  <MatchListItem
                    v-for="(match, index) in matchHistory"
                    :key="`${match.json.gameId}-${index}`"
                    :match="match"
                    :current-user-puuid="puuid || ''"
                    :is-expanded="expandedMatches.has(match.json.gameId)"
                    @toggle-detail="handleToggleMatchDetail(match.json.gameId)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
