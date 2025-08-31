<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameState } from '@/lib/composables/useGameState';
import { useChampSelectMembers } from '@/hooks/useChampSelectMembers';
import { RoomService } from '@/lib/service/room-service';
import { SummonerService } from '@/lib/service/summoner-service';
import { GamePhaseManager } from '@/lib/service/game-phase-manager';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { Room, Member } from '@/types/room';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import { SgpMatchHistoryResult } from '@/types/match-history-sgp';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import RoomEmptyState from '@/components/RoomEmptyState.vue';

export interface MemberWithDetails extends Member {
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: SgpMatchHistoryResult;
  isLoading?: boolean;
  isLoadingSummonerData?: boolean;
  isLoadingRankedStats?: boolean;
  isLoadingMatchHistory?: boolean;
  error?: string;
}

// 使用游戏状态
const { isInRoom, isConnected } = useGameState();

// 使用英雄选择成员数据
const {
  isLoadingChampSelect,
  champSelectError,
  champSelectSlots,
  updateChampSelectMembers,
  resetChampSelectState,
  isInChampSelect,
} = useChampSelectMembers();

// 房间管理状态
const currentRoom = ref<Room | null>(null);
const roomMembers = ref<MemberWithDetails[]>([]);
const isLoadingRoom = ref(false);
const isLoadingMembers = ref(false);
const errorMessage = ref<string | null>(null);
const isUpdating = ref(false);
const updateTimer = ref<NodeJS.Timeout | null>(null);
const currentGamePhase = ref<GameflowPhaseEnum | null>(null);

// 服务实例
const roomService = new RoomService();
const summonerService = new SummonerService();
const gamePhaseManager = new GamePhaseManager();

// 计算属性
const isLoading = computed(
  () =>
    isLoadingRoom.value || isLoadingMembers.value || isLoadingChampSelect.value
);
const isInChampSelectPhase = computed(
  () => currentGamePhase.value === GameflowPhaseEnum.ChampSelect
); // 直接根据游戏阶段判断
const currentError = computed(
  () => errorMessage.value || champSelectError.value
);

const roomLeader = computed(
  () => roomMembers.value.find(member => member.isLeader) as MemberWithDetails
);
const otherMembers = computed(
  () =>
    roomMembers.value.filter(member => !member.isLeader) as MemberWithDetails[]
);

// 统一的显示槽位 - 根据当前阶段选择数据源
const displaySlots = computed(() => {
  if (isInChampSelectPhase.value) {
    // 英雄选择阶段：使用 champSelectSlots
    return champSelectSlots.value.map(member => {
      if (!member) return null;
      // 转换为 MemberWithDetails 格式以兼容现有组件
      return {
        summonerId: member.summonerId,
        summonerName: member.summonerName,
        isLeader: member.isLeader,
        summonerData: member.summonerData,
        rankedStats: member.rankedStats,
        isLoading: member.isLoading,
        error: member.error,
        // 添加房间成员的其他必需字段，使用默认值
        allowedChangeActivity: false,
        allowedInviteOthers: false,
        allowedKickOthers: false,
        allowedStartActivity: false,
        allowedToggleInvite: false,
        autoFillEligible: false,
        autoFillProtectedForPromos: false,
        autoFillProtectedForSoloing: false,
        autoFillProtectedForStreaking: false,
        botChampionId: 0,
        botDifficulty: '',
        botId: '',
        firstPositionPreference: '',
        isBot: false,
        isOwner: member.isLeader,
        isSpectator: false,
        puuid: member.puuid,
        ready: true,
        secondPositionPreference: '',
        showGhostedBanner: false,
        summonerIconId: member.summonerData?.profileIconId || 0,
        summonerLevel: member.summonerData?.summonerLevel || 0,
        teamId: 1,
      } as unknown as MemberWithDetails;
    });
  } else {
    // 房间阶段：使用原有逻辑
    const slots = Array(5).fill(null);
    if (roomLeader.value) {
      slots[0] = roomLeader.value;
    }

    // 填充其他成员到剩余位置
    const otherMembersList = otherMembers.value;
    for (let i = 0; i < Math.min(otherMembersList.length, 4); i++) {
      slots[i + 1] = otherMembersList[i];
    }

    return slots as (MemberWithDetails | null)[];
  }
});

// 获取成员详细信息
const fetchMembersDetails = async (members: Member[]): Promise<void> => {
  // 第一阶段：立即显示基本信息
  roomMembers.value = members.map(member => ({
    ...member,
    isLoading: false,
  }));

  // 第二阶段：并行加载召唤师基本数据
  const summonerPromises = members.map(async (member, index) => {
    if (!member.summonerId) return;

    try {
      const summonerData = await summonerService.getSummonerByID(
        member.summonerId
      );
      if (roomMembers.value[index]) {
        roomMembers.value[index] = {
          ...roomMembers.value[index],
          summonerData,
        };
      }
      return { index, summonerData };
    } catch (error) {
      console.warn(`获取成员 ${member.summonerName} 召唤师数据失败:`, error);
      return null;
    }
  });

  const summonerResults = await Promise.all(summonerPromises);

  // 第三阶段：只加载排位统计，战绩由各个 RoomMemberCard 自己处理
  summonerResults.forEach(async result => {
    if (!result?.summonerData?.puuid) return;

    const { index, summonerData } = result;

    // 只加载排位统计
    try {
      const rankedStats = await summonerService.getRankedStats(
        summonerData.puuid
      );
      if (roomMembers.value[index]) {
        roomMembers.value[index] = {
          ...roomMembers.value[index],
          rankedStats,
        };
      }
    } catch (error) {
      console.warn(`获取排位统计失败:`, error);
    }
  });
};

// 更新房间信息
const updateRoom = async (): Promise<void> => {
  // 防止并发调用
  if (isUpdating.value) {
    console.log('🏠 房间更新中，跳过本次调用');
    return;
  }

  try {
    isUpdating.value = true;
    isLoadingRoom.value = true;

    const inLobby = await roomService.isInLobby();
    if (!inLobby) {
      currentRoom.value = null;
      roomMembers.value = [];
      errorMessage.value = '当前不在游戏房间中';
      return;
    }

    const room = await roomService.getCurrentLobby();
    currentRoom.value = room;
    clearError();

    isLoadingMembers.value = true;
    const members = await roomService.getLobbyMembers();

    // 改进的成员变化检测逻辑
    const currentMemberIds = members.map(m => String(m.summonerId)).sort();
    const existingMemberIds = roomMembers.value
      .map(m => String(m.summonerId))
      .sort();

    // 更严格的比较
    const hasChanges =
      currentMemberIds.length !== existingMemberIds.length ||
      !currentMemberIds.every((id, index) => id === existingMemberIds[index]);

    if (hasChanges) {
      console.log(
        `🏠 房间成员发生变化，重新获取详细信息: ${members.length} 名成员`
      );
      await fetchMembersDetails(members);
    } else {
      console.log(`🏠 房间成员无变化: ${members.length} 名成员`);
      // 更安全的更新逻辑
      roomMembers.value = roomMembers.value.map(existingMember => {
        const updatedMember = members.find(
          m => m.summonerId === existingMember.summonerId
        );
        if (updatedMember) {
          return {
            ...existingMember,
            ...updatedMember,
            // 保留详细信息
            summonerData: existingMember.summonerData,
            rankedStats: existingMember.rankedStats,
            matchHistory: existingMember.matchHistory,
            isLoading: existingMember.isLoading,
            error: existingMember.error,
          };
        }
        return existingMember;
      });
    }
  } catch (error: any) {
    console.error('更新房间信息失败:', error);
    errorMessage.value = error.message || '获取房间信息失败';
  } finally {
    isLoadingRoom.value = false;
    isLoadingMembers.value = false;
    isUpdating.value = false;
  }
};

// 踢出成员
const kickMember = async (summonerId: number): Promise<void> => {
  await roomService.kickMember(summonerId);
  await updateRoom();
};

// 清除错误信息
const clearError = () => {
  errorMessage.value = null;
};

// 重置房间状态
const resetRoom = () => {
  currentRoom.value = null;
  roomMembers.value = [];
  isLoadingRoom.value = false;
  isLoadingMembers.value = false;
  clearError();
};

// 开始房间状态轮询
const startRoomPolling = () => {
  if (updateTimer.value) return;

  console.log('🏠 开始房间状态轮询');
  updateTimer.value = setInterval(() => {
    if (isConnected.value) {
      updateData(); // 使用统一的数据更新方法，而不是直接调用 updateRoom
    } else {
      resetRoom();
      resetChampSelectState();
    }
  }, 3000);

  // 立即执行一次
  if (isConnected.value) {
    updateData();
  }
};

// 停止房间状态轮询
const stopRoomPolling = () => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value);
    updateTimer.value = null;
    console.log('🛑 停止房间状态轮询');
  }
};

// 处理踢出成员
const handleKickMember = async (summonerId: number) => {
  if (confirm('确定要踢出这个成员吗？')) {
    await kickMember(summonerId);
  }
};

// 清除错误信息
const handleClearError = () => {
  clearError();
};

// 监听房间状态变化
watch(isInRoom, newValue => {
  if (newValue && isConnected.value) {
    updateRoom();
  } else {
    resetRoom();
  }
});

// 检查游戏阶段
const checkGamePhase = async (): Promise<void> => {
  try {
    const phase = await gamePhaseManager.getCurrentPhase();
    currentGamePhase.value = phase;
  } catch (error) {
    console.warn('获取游戏阶段失败:', error);
    currentGamePhase.value = null;
  }
};

// 统一的数据更新方法
const updateData = async (): Promise<void> => {
  // 防止并发调用
  if (isUpdating.value) {
    console.log('🏠 数据更新中，跳过本次调用');
    return;
  }

  try {
    isUpdating.value = true;

    // 首先检查游戏阶段
    await checkGamePhase();

    // 直接根据游戏阶段判断，而不依赖 isInChampSelectPhase
    if (currentGamePhase.value === GameflowPhaseEnum.ChampSelect) {
      // 英雄选择阶段：更新英雄选择数据
      await updateChampSelectMembers();
    } else if (isInRoom.value && isConnected.value) {
      // 房间阶段：更新房间数据
      await updateRoom();
    } else {
      // 其他阶段：重置状态
      resetRoom();
      resetChampSelectState();
    }
  } finally {
    isUpdating.value = false;
  }
};

// 监听连接状态变化
watch(isConnected, newValue => {
  if (!newValue) {
    resetRoom();
    resetChampSelectState();
  } else {
    updateData();
  }
});

onMounted(() => {
  startRoomPolling();
});

onUnmounted(() => {
  stopRoomPolling();
});
</script>

<template>
  <!-- 主容器 - 使用渐变背景和现代布局 -->
  <main
    class="from-background via-background to-muted/30 relative flex h-[calc(100vh-40px)] flex-col overflow-hidden bg-gradient-to-br"
  >
    <!-- 错误提示 -->
    <div
      v-if="currentError"
      class="bg-destructive/10 border-destructive/20 text-destructive mx-4 mt-4 rounded-lg border p-3 text-sm"
    >
      <div class="flex items-center justify-between">
        <span>{{ currentError }}</span>
        <button
          @click="handleClearError"
          class="hover:bg-destructive/20 ml-2 rounded px-2 py-1 text-xs transition-colors"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 初始加载状态 - 优雅的加载界面 -->
    <div
      v-if="isLoading && !isInRoom && !isInChampSelectPhase"
      class="flex flex-1 items-center justify-center px-8"
    >
      <div class="text-center">
        <div class="relative mb-8">
          <div
            class="from-primary/20 to-accent/30 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br"
          >
            <div
              class="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            ></div>
          </div>
        </div>
        <h3 class="text-foreground mb-3 text-xl font-semibold">
          {{ isInChampSelectPhase ? '检测英雄选择状态' : '检测房间状态' }}
        </h3>
        <p class="text-muted-foreground text-sm">正在连接游戏客户端...</p>
      </div>
    </div>

    <!-- 成员展示 - 支持房间和英雄选择两种模式 -->
    <div
      v-else-if="isInRoom || isInChampSelectPhase"
      class="bg-card/50 border-border/30 flex h-full flex-1 border-t backdrop-blur-sm"
    >
      <!-- 阶段指示器 -->
      <!-- <div class="absolute top-4 right-4 z-10">
        <div class="bg-primary/10 border-primary/20 text-primary rounded-lg border px-3 py-1 text-sm font-medium">
          {{ isInChampSelectPhase ? '英雄选择阶段' : '房间阶段' }}
        </div>
      </div> -->

      <div
        v-for="(member, index) in displaySlots"
        :key="index"
        class="border-border/30 flex h-full flex-1 flex-col border-r last:border-r-0"
      >
        <!-- 有成员的情况 -->
        <RoomMemberCard
          v-if="member && member.summonerData"
          :member="member"
          :is-leader="index === 0"
          :can-kick="index !== 0 && !isInChampSelectPhase"
          @kick="handleKickMember"
        />

        <!-- 空位的情况 -->
        <RoomEmptySlot v-else :slot-index="index" />
      </div>
    </div>

    <!-- 未在房间中的状态 - 使用独立组件 -->
    <RoomEmptyState v-else />
  </main>
</template>
