<script setup lang="ts">
import { onMounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import SummonerProfileComponent from '@/components/SummonerProfile.vue';
import Loading from '@/components/Loading.vue';
import MatchListItem from '@/components/MatchListItem.vue'; // 直接导入 MatchListItem
import MatchHistoryHeader from '@/components/MatchHistoryHeader.vue';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import { useMatchHistoryState } from '@/lib/composables/useMatchHistoryState';
import { useMatchHistoryUI } from '@/lib/composables/useMatchHistoryUI';
import { MatchDataLoader } from '@/lib/match-data-loader';

const route = useRoute();
const { serverId, puuid } = route.query as { serverId: string; puuid: string };
provide('serverId', serverId);
provide('puuid', puuid);

const userStore = useClientUserStore();
const matchHistoryStore = useMatchHistoryStore();

// 使用解耦的状态管理
const {
  searchResult,
  isSearching,
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
  clearSearchResult,
  setError,
  setSearchResult,
  updateGameModesFilter,
} = useMatchHistoryState();

// 使用解耦的UI交互逻辑
const {
  isSticky,
  sentinelRef,
  toggleMatchDetail,
  handlePageChange,
  handlePageSizeChange,
} = useMatchHistoryUI();

// 初始化数据加载器
const { summonerService, sgpMatchService } = matchHistoryStore.getServices();
const dataLoader = new MatchDataLoader(
  summonerService,
  sgpMatchService,
  userStore.user!,
  userStore.serverId,
  serverId
);

// 加载分页数据
const loadMatchHistoryPage = async (tag: string): Promise<void> => {
  if (isSearching.value || !searchResult.value.summoner) return;

  isSearching.value = true;

  try {
    const result = await dataLoader.loadMatchHistoryPage(
      serverId,
      puuid,
      currentPage.value,
      pageSize.value,
      tag
    );

    // 更新搜索结果
    searchResult.value = {
      ...searchResult.value,
      matchHistory: result.games,
      totalCount: result.totalCount,
    };
  } catch (error: any) {
    console.error('加载分页数据失败:', error);
    setError(error.message || '加载数据失败');
  } finally {
    isSearching.value = false;
  }
};

// 根据路由参数获取数据
const loadDataFromRoute = async (): Promise<void> => {
  if (isSearching.value) return;
  isSearching.value = true;
  clearSearchResult();

  try {
    const result = await dataLoader.loadCompleteMatchData(
      puuid,
      pageSize.value
    );

    setSearchResult(result);
    currentPage.value = 1;
  } catch (error: any) {
    console.error('获取数据失败:', error);
    setError(error.message || '获取数据失败');
  } finally {
    isSearching.value = false;
  }
};

// 更新游戏模式过滤器
function handleUpdateGameModesFilter(newFilter: any) {
  updateGameModesFilter(newFilter);
  loadMatchHistoryPage(newFilter.selectedTag);
}

// 处理对局详情切换
function handleToggleMatchDetail(gameId: number) {
  toggleMatchDetail(gameId, expandedMatches.value);
}

// 处理分页变化
function handlePageChangeWrapper(page: number) {
  handlePageChange(
    page,
    currentPage,
    loadMatchHistoryPage,
    gameModesFilter.selectedTag
  );
}

function handlePageSizeChangeWrapper(size: number) {
  handlePageSizeChange(
    size,
    pageSize,
    loadMatchHistoryPage,
    gameModesFilter.selectedTag
  );
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadDataFromRoute();
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
              v-if="isSearching && !hasAnyData"
              class="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            >
              <div class="flex flex-col items-center space-y-4">
                <Loading size="lg" class="text-primary" />
                <p class="text-muted-foreground text-sm">
                  正在获取当前账号信息...
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
                    :total-matches="searchResult.totalCount"
                    :is-sticky="isSticky"
                    @update:model-value="handleUpdateGameModesFilter"
                    @update:current-page="handlePageChangeWrapper"
                    @update:page-size="handlePageSizeChangeWrapper"
                  />
                </div>
                <!-- 历史战绩 - 直接使用 MatchListItem -->
                <div v-if="showMatchHistory && matchHistory">
                  <MatchListItem
                    v-for="match in matchHistory"
                    :key="match.json.gameId"
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
