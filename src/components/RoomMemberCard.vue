<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import RoomMemberHeader from './RoomMemberHeader.vue';
import RoomMemberMatchHistory from './RoomMemberMatchHistory.vue';
import GameModeFilterControl from './GameModeFilterControl.vue';
import PaginationControl from './PaginationControl.vue';
import { useMatchHistoryQuery } from '@/lib/composables/useMatchHistoryQuery';
import type { MemberWithDetails } from '@/stores/room-management';
import { getPlayerDisplayName } from '@/lib/player-helpers';

interface Props {
  member: MemberWithDetails;
}

interface Emits {
  (e: 'kick', summonerId: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 使用战绩查询 hook
const {
  isLoading: isLoadingMatchHistory,
  summoner: queriedSummoner,
  rankedStats: queriedRankedStats,
  matchHistory,
  errorMessage,
  loadCompleteMatchData,
} = useMatchHistoryQuery({
  puuid: props.member.summonerData!.puuid,
});

// 获取正确的玩家名称
const displayName = computed(() => {
  // 优先使用查询到的召唤师数据，然后是传入的数据
  const summonerData = queriedSummoner.value || props.member.summonerData;
  const name = getPlayerDisplayName(summonerData, props.member.summonerName);
  return name !== '未知玩家'
    ? name
    : props.member.summonerName?.trim() || '未知玩家';
});

// 获取排位信息 - 优先使用查询到的数据
const currentRankedStats = computed(() => {
  return queriedRankedStats.value || props.member.rankedStats;
});

// 计算当前使用的召唤师数据
const currentSummoner = computed(() => {
  return queriedSummoner.value || props.member.summonerData;
});

// 计算是否正在加载
const isLoading = computed(() => {
  return isLoadingMatchHistory.value || props.member.isLoading!;
});

// 计算错误信息
const currentError = computed(() => {
  return errorMessage.value || props.member.error;
});

// 处理踢出操作
const handleKick = (summonerId: number) => {
  emit('kick', summonerId);
};

// 监听成员数据变化，当有 puuid 时加载战绩
watch(
  () => props.member.summonerData?.puuid,
  async newPuuid => {
    if (newPuuid) {
      try {
        // 这里需要获取服务器ID，可以从全局状态或其他地方获取
        // 暂时使用一个默认值，实际使用时需要传入正确的服务器ID
        await loadCompleteMatchData();
      } catch (error) {
        console.warn(`加载成员 ${displayName.value} 战绩失败:`, error);
      }
    }
  },
  { immediate: true }
);

// 组件挂载时如果已有 puuid 则加载数据
onMounted(() => {
  if (props.member.summonerData?.puuid) {
    loadCompleteMatchData();
  }
});
</script>

<template>
  <div
    class="relative flex h-full flex-col overflow-hidden bg-slate-50/80 shadow-sm dark:bg-[#121212]/90"
  >
    <!-- 顶部玩家信息区域 -->
    <RoomMemberHeader
      :member="member"
      :display-name="displayName"
      :current-ranked-stats="currentRankedStats"
      @kick="handleKick"
    />

    <!-- 战绩区域 -->
    <RoomMemberMatchHistory
      :is-loading="isLoading"
      :error="currentError"
      :match-history="matchHistory"
      :summoner="currentSummoner"
      :max-matches="20"
    />

    <!-- 底部过滤和分页控制区域 -->
    <div class="border-border/40 bg-card/50 border-t p-3">
      <div class="flex flex-col items-center justify-between gap-1">
        <!-- 游戏模式过滤 -->
        <GameModeFilterControl />

        <!-- 分页控制 -->
        <PaginationControl />
      </div>
    </div>
  </div>
</template>
