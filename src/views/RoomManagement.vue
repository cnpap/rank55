<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from '@/lib/composables/useGameState';
import { useChampSelectMembers } from '@/hooks/useChampSelectMembers';
import { useGameStartMembers } from '@/hooks/useGameStartMembers';
import { RoomService } from '@/lib/service/room-service';
import { SummonerService } from '@/lib/service/summoner-service';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { Room, Member } from '@/types/room';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import {
  type MemberWithDetails,
  calculateDisplaySlots,
  isGameStartPhase as checkIsGameStartPhase,
} from '@/utils/room-management-utils';

const { currentPhase, gamePhaseManager } = useGameState();

// 使用英雄选择成员数据
const { champSelectError, champSelectSlots, updateChampSelectMembers } =
  useChampSelectMembers();

// 使用游戏开始成员数据
const { gameStartError, gameStartSlots, updateGameStartMembers } =
  useGameStartMembers();

// 房间管理状态
const currentRoom = ref<Room | null>(null);
const roomMembers = ref<MemberWithDetails[]>([]);
const errorMessage = ref<string | null>(null);
const updateTimer = ref<NodeJS.Timeout | null>(null);

// 服务实例
const roomService = new RoomService();
const summonerService = new SummonerService();

const currentError = computed(
  () => errorMessage.value || champSelectError.value || gameStartError.value
);

// 添加缓存变量
const cachedDisplaySlots = ref<(MemberWithDetails | null)[]>([]);
const lastPhase = ref<GameflowPhaseEnum | null>(null);
const lastMemberIds = ref<string>('');
const lastMemberDetails = ref<string>(''); // 新增：用于跟踪成员详细信息的变化

// 判断是否为游戏开始阶段（需要两排布局）
const isGameStartPhase = computed(() => {
  return checkIsGameStartPhase(currentPhase.value);
});

// 统一的显示槽位 - 根据当前阶段选择数据源
const displaySlots = computed(() => {
  const newSlots = calculateDisplaySlots(
    currentPhase.value,
    champSelectSlots.value,
    gameStartSlots.value,
    roomMembers.value,
    cachedDisplaySlots.value,
    lastPhase,
    lastMemberIds,
    lastMemberDetails
  );

  // 更新缓存
  cachedDisplaySlots.value = newSlots;

  return newSlots;
});

// 获取成员详细信息 - 优化为增量更新
const fetchMembersDetails = async (members: Member[]): Promise<void> => {
  // 创建当前成员的映射
  const currentMemberMap = new Map(
    roomMembers.value.map(m => [m.summonerId, m])
  );
  const newMemberMap = new Map(members.map(m => [m.summonerId, m]));

  // 找出新增的成员
  const newMembers = members.filter(m => !currentMemberMap.has(m.summonerId));
  // 找出离开的成员
  const leftMemberIds = roomMembers.value
    .filter(m => !newMemberMap.has(m.summonerId))
    .map(m => m.summonerId);

  // 如果没有变化，直接返回
  if (newMembers.length === 0 && leftMemberIds.length === 0) {
    return;
  }

  console.log(
    `🏠 成员变动: 新增 ${newMembers.length} 人，离开 ${leftMemberIds.length} 人`
  );

  // 移除离开的成员
  if (leftMemberIds.length > 0) {
    roomMembers.value = roomMembers.value.filter(
      m => !leftMemberIds.includes(m.summonerId)
    );
  }

  // 如果没有新成员，直接返回
  if (newMembers.length === 0) {
    return;
  }

  // 为新成员添加基本信息
  const newMembersWithDetails: MemberWithDetails[] = newMembers.map(member => ({
    ...member,
    isLoading: false,
  }));

  // 添加新成员到列表
  roomMembers.value = [...roomMembers.value, ...newMembersWithDetails];

  // 只为新成员加载详细信息
  const summonerPromises = newMembers.map(async (member, index) => {
    if (!member.summonerId) return;

    try {
      const summonerData = await summonerService.getSummonerByID(
        member.summonerId
      );

      // 找到对应的成员并更新
      const memberIndex = roomMembers.value.findIndex(
        m => m.summonerId === member.summonerId
      );
      if (memberIndex !== -1) {
        roomMembers.value[memberIndex] = {
          ...roomMembers.value[memberIndex],
          summonerData,
        };
      }

      return { summonerId: member.summonerId, summonerData };
    } catch (error) {
      console.warn(`获取成员 ${member.summonerName} 召唤师数据失败:`, error);
      return null;
    }
  });

  const summonerResults = await Promise.all(summonerPromises);

  // 为新成员加载排位统计
  const rankedPromises = summonerResults.map(async result => {
    if (!result?.summonerData?.puuid) return null;

    const { summonerId, summonerData } = result;
    try {
      const rankedStats = await summonerService.getRankedStats(
        summonerData.puuid
      );

      // 找到对应的成员并更新排位统计
      const memberIndex = roomMembers.value.findIndex(
        m => m.summonerId === summonerId
      );
      if (memberIndex !== -1) {
        roomMembers.value[memberIndex] = {
          ...roomMembers.value[memberIndex],
          rankedStats,
        };
      }

      return { summonerId, rankedStats };
    } catch (error) {
      console.warn(`获取成员排位统计失败:`, error);
      return null;
    }
  });

  await Promise.all(rankedPromises);
};

// 更新房间信息 - 优化成员变化检测
const updateRoom = async (): Promise<void> => {
  const room = await roomService.getCurrentLobby();
  currentRoom.value = room;
  clearError();

  const members = await roomService.getLobbyMembers();

  // 直接调用优化后的增量更新函数
  await fetchMembersDetails(members);
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

// 开始房间状态轮询
const startRoomPolling = () => {
  if (updateTimer.value) return;

  console.log('🏠 开始房间状态轮询');
  updateTimer.value = setInterval(async () => {
    try {
      console.log('🏠 房间状态轮询 - 当前阶段:', currentPhase.value);
      if (
        [
          GameflowPhaseEnum.Lobby,
          GameflowPhaseEnum.Matchmaking,
          GameflowPhaseEnum.ReadyCheck,
          GameflowPhaseEnum.ChampSelect,
          GameflowPhaseEnum.GameStart,
          GameflowPhaseEnum.InProgress,
        ].includes(currentPhase.value)
      ) {
        if (
          [
            GameflowPhaseEnum.Lobby,
            GameflowPhaseEnum.Matchmaking,
            GameflowPhaseEnum.ReadyCheck,
          ].includes(currentPhase.value)
        ) {
          console.log('🏠 房间状态轮询 - 大厅或匹配中');
          await updateRoom();
        } else if (GameflowPhaseEnum.ChampSelect === currentPhase.value) {
          console.log('🏠 房间状态轮询 - 选择英雄');
          await updateChampSelectMembers();
        } else if (
          GameflowPhaseEnum.GameStart === currentPhase.value ||
          GameflowPhaseEnum.InProgress === currentPhase.value
        ) {
          console.log('🏠 房间状态轮询 - 游戏开始');
          await updateGameStartMembers(
            await gamePhaseManager.handleGameStartPhase()
          );
        }
      } else {
        roomMembers.value = [];
      }
    } catch (e) {
      console.error('房间状态轮询错误:', e);
      roomMembers.value = [];
    }
  }, 3000);

  // 立即执行一次
  updateRoom();
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

    <!-- 成员展示 - 支持房间、英雄选择和游戏开始三种模式 -->
    <div
      class="bg-card/50 border-border/30 flex h-full flex-1 border-t backdrop-blur-sm"
      :class="{
        'flex-col': isGameStartPhase,
        'flex-row': !isGameStartPhase,
      }"
    >
      <!-- 游戏开始阶段：两排布局 -->
      <template v-if="isGameStartPhase">
        <!-- 我方队伍 -->
        <div class="border-border/30 flex h-1/2 border-b">
          <div
            v-for="(member, index) in displaySlots.slice(0, 5)"
            :key="member ? `my-team-${member.summonerId}` : `my-empty-${index}`"
            class="border-border/30 flex h-full flex-1 flex-col border-r last:border-r-0"
          >
            <!-- 有成员的情况 -->
            <RoomMemberCard
              v-if="member && member.summonerData"
              :member="member"
              :is-leader="false"
              :can-kick="false"
              @kick="handleKickMember"
            />

            <!-- 空位的情况 -->
            <RoomEmptySlot v-else :slot-index="index" />
          </div>
        </div>

        <!-- 敌方队伍 -->
        <div class="flex h-1/2">
          <div
            v-for="(member, index) in displaySlots.slice(5, 10)"
            :key="
              member
                ? `enemy-team-${member.summonerId}`
                : `enemy-empty-${index}`
            "
            class="border-border/30 flex h-full flex-1 flex-col border-r last:border-r-0"
          >
            <!-- 有成员的情况 -->
            <RoomMemberCard
              v-if="member && member.summonerData"
              :member="member"
              :is-leader="false"
              :can-kick="false"
              @kick="handleKickMember"
            />

            <!-- 空位的情况 -->
            <RoomEmptySlot v-else :slot-index="index + 5" />
          </div>
        </div>
      </template>

      <!-- 其他阶段：单排布局 -->
      <template v-else>
        <div
          v-for="(member, index) in displaySlots"
          :key="member ? `member-${member.summonerId}` : `empty-${index}`"
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
      </template>
    </div>
  </main>
</template>
