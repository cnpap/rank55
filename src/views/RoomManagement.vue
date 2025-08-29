<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useGameState } from '@/lib/composables/useGameState';
import { RoomService } from '@/lib/service/room-service';
import { SummonerService } from '@/lib/service/summoner-service';
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

// 房间管理状态
const currentRoom = ref<Room | null>(null);
const roomMembers = ref<MemberWithDetails[]>([]);
const isLoadingRoom = ref(false);
const isLoadingMembers = ref(false);
const errorMessage = ref<string | null>(null);
const isUpdating = ref(false);
const updateTimer = ref<NodeJS.Timeout | null>(null);

// 服务实例
const roomService = new RoomService();
const summonerService = new SummonerService();

// 计算属性
const isLoading = computed(() => isLoadingRoom.value || isLoadingMembers.value);
const roomLeader = computed(
  () => roomMembers.value.find(member => member.isLeader) as MemberWithDetails
);
const otherMembers = computed(
  () =>
    roomMembers.value.filter(member => !member.isLeader) as MemberWithDetails[]
);

// 创建5个位置的数组，房主在第一个位置，其他成员按顺序填充，空位用null表示
const roomSlots = computed(() => {
  const slots = Array(5).fill(null);

  if (roomLeader.value) {
    slots[0] = roomLeader.value;
  }

  // 填充其他成员到剩余位置
  const otherMembersList = otherMembers.value;
  for (let i = 0; i < Math.min(otherMembersList.length, 4); i++) {
    slots[i + 1] = otherMembersList[i];
  }

  return slots as MemberWithDetails[];
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
    if (isInRoom.value && isConnected.value) {
      updateRoom();
    } else {
      resetRoom();
    }
  }, 3000);

  // 立即执行一次
  if (isInRoom.value && isConnected.value) {
    updateRoom();
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

// 监听连接状态变化
watch(isConnected, newValue => {
  if (!newValue) {
    resetRoom();
  } else if (isInRoom.value) {
    updateRoom();
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
      v-if="errorMessage"
      class="bg-destructive/10 border-destructive/20 text-destructive mx-4 mt-4 rounded-lg border p-3 text-sm"
    >
      <div class="flex items-center justify-between">
        <span>{{ errorMessage }}</span>
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
      v-if="isLoading && !isInRoom"
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
        <h3 class="text-foreground mb-3 text-xl font-semibold">检测房间状态</h3>
        <p class="text-muted-foreground text-sm">正在连接游戏客户端...</p>
      </div>
    </div>

    <!-- 房间成员展示 - 保持原有的5个位置横向排列 -->
    <div
      v-else-if="isInRoom"
      class="bg-card/50 border-border/30 flex h-full flex-1 border-t backdrop-blur-sm"
    >
      <div
        v-for="(member, index) in roomSlots"
        :key="index"
        class="border-border/30 flex h-full flex-1 flex-col border-r last:border-r-0"
      >
        <!-- 有成员的情况 -->
        <RoomMemberCard
          v-if="member && member.summonerData"
          :member="member"
          :is-leader="index === 0"
          :can-kick="index !== 0"
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
