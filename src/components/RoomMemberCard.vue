<script setup lang="ts">
import { computed } from 'vue';
import { Crown, Copy } from 'lucide-vue-next';
import BriefMatchHistory from './BriefMatchHistory.vue';
import Loading from '@/components/Loading.vue';
import type { MemberWithDetails } from '@/stores/room-management';
import {
  getPlayerDisplayName,
  getRankInfoFromQueueMap,
  formatRankDisplay,
  copyToClipboard,
} from '@/lib/player-helpers';
import { getRankMiniImageUrl } from '@/lib/rank-helpers';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  member: MemberWithDetails;
  isLeader?: boolean;
  canKick?: boolean;
}

interface Emits {
  (e: 'kick', summonerId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 获取正确的玩家名称
const displayName = computed(() => {
  // 优先使用 summonerData 中的名称
  const name = getPlayerDisplayName(
    props.member.summonerData,
    props.member.summonerName
  );
  return name !== '未知玩家'
    ? name
    : props.member.summonerName?.trim() || '未知玩家';
});

// 获取单双排位信息
const soloRankInfo = computed(() => {
  return getRankInfoFromQueueMap(props.member.rankedStats, 'RANKED_SOLO_5x5');
});

// 获取灵活排位信息
const flexRankInfo = computed(() => {
  return getRankInfoFromQueueMap(props.member.rankedStats, 'RANKED_FLEX_SR');
});

// 格式化单双排位显示
const formatSoloRank = computed(() => {
  const { tier, division, leaguePoints } = soloRankInfo.value;
  return formatRankDisplay(tier, division, leaguePoints);
});

// 格式化灵活排位显示
const formatFlexRank = computed(() => {
  const { tier, division, leaguePoints } = flexRankInfo.value;
  return formatRankDisplay(tier, division, leaguePoints);
});

// 复制玩家名称到剪贴板
const copyPlayerName = async () => {
  await copyToClipboard(displayName.value, '玩家名称已复制到剪贴板');
};

// 处理踢出操作
const handleKick = () => {
  if (props.member.summonerId) {
    emit('kick', props.member.summonerId);
  }
};
</script>

<template>
  <div
    class="relative flex h-full flex-col overflow-hidden bg-slate-50/80 shadow-sm dark:bg-[#121212]/90"
  >
    <!-- 顶部玩家信息区域 -->
    <div
      class="relative overflow-hidden border-b border-slate-200/80 bg-white/90 p-3 dark:border-[#454545]/60 dark:bg-[#121212]/90"
    >
      <!-- 踢出按钮 -->
      <button
        v-if="canKick && !member.isLeader"
        @click="handleKick"
        class="absolute top-2 right-2 z-20 flex h-5 w-5 items-center justify-center border border-red-200 bg-red-50 text-red-600 transition-all duration-150 hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/70"
        title="踢出玩家"
      >
        <svg
          class="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- 玩家信息主体 -->
      <div class="relative flex items-center gap-3">
        <!-- 头像区域 -->
        <div class="relative flex-shrink-0">
          <!-- 房主皇冠 -->
          <div
            v-if="member.isLeader"
            class="absolute -top-1.5 left-1/2 z-10 -translate-x-1/2"
          >
            <Crown
              class="h-3.5 w-3.5 fill-amber-500 text-amber-600 drop-shadow-sm"
            />
          </div>

          <!-- 头像容器 -->
          <div class="relative">
            <!-- 头像边框 -->
            <div
              :class="[
                'absolute inset-0 border-2',
                member.isLeader
                  ? 'border-amber-400/70 shadow-md shadow-amber-400/20'
                  : 'border-slate-300/60 dark:border-slate-600/60',
              ]"
            ></div>

            <!-- 头像 -->
            <img
              :src="staticAssets.getProfileIcon(`${member.summonerIconId}`)"
              :alt="displayName"
              class="relative h-11 w-11 object-cover"
            />

            <!-- 在线状态指示器 -->
            <div
              class="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 border border-white bg-emerald-500 shadow-sm dark:border-slate-800"
            ></div>
          </div>
        </div>

        <!-- 玩家信息 -->
        <div class="min-w-0 flex-1">
          <!-- 玩家名称行 -->
          <div class="mb-0 flex min-w-0 items-center gap-2">
            <h3
              class="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              {{ displayName }}
            </h3>
            <button
              @click="copyPlayerName"
              class="flex-shrink-0 text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title="复制玩家名称"
            >
              <Copy class="h-3 w-3" />
            </button>
          </div>

          <!-- 段位信息 -->
          <div>
            <!-- 单双排位 -->
            <div class="flex min-w-0 items-center gap-1.5">
              <span
                class="font-tektur-numbers min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-400"
                >单双</span
              >
              <img
                v-if="soloRankInfo.tier !== '未定级'"
                :src="getRankMiniImageUrl(soloRankInfo.tier)"
                :alt="formatSoloRank"
                class="h-4 w-4 flex-shrink-0 object-contain"
              />
              <span
                class="font-tektur-numbers min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {{ formatSoloRank }}
              </span>
            </div>

            <!-- 灵活排位 -->
            <div class="flex min-w-0 items-center gap-1.5">
              <span
                class="font-tektur-numbers min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-400"
                >灵活</span
              >
              <img
                v-if="flexRankInfo.tier !== '未定级'"
                :src="getRankMiniImageUrl(flexRankInfo.tier)"
                :alt="formatFlexRank"
                class="h-4 w-4 flex-shrink-0 object-contain"
              />
              <span
                class="font-tektur-numbers min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200"
              >
                {{ formatFlexRank }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 战绩区域 -->
    <div
      class="bg-slate-25/50 relative flex-1 overflow-hidden dark:bg-[#121212]/50"
    >
      <div class="h-full overflow-y-auto">
        <!-- 加载状态 -->
        <div
          v-if="member.isLoading"
          class="flex h-full items-center justify-center"
        >
          <div class="flex flex-col items-center justify-center space-y-3">
            <Loading size="md" class="text-primary" />
            <p class="text-xs font-medium text-slate-600 dark:text-slate-400">
              加载战绩中...
            </p>
          </div>
        </div>

        <!-- 错误状态 -->
        <div
          v-else-if="member.error"
          class="flex h-full items-center justify-center"
        >
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
              {{ member.error }}
            </p>
          </div>
        </div>

        <!-- 战绩信息 -->
        <div v-else>
          <BriefMatchHistory
            :match-history="member.matchHistory"
            :summoner="member.summonerData"
            :max-matches="20"
          />
        </div>
      </div>
    </div>
  </div>
</template>
