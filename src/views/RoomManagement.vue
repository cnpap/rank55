<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue';
import { useGameState } from '@/lib/composables/useGameState';
import { useChampSelectMembers } from '@/hooks/useChampSelectMembers';
import { useGameStartMembers } from '@/hooks/useGameStartMembers';
import { roomService } from '@/lib/service/service-manager';
import { summonerDataCache } from '@/lib/service/summoner-data-cache';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { Room, Member } from '@/types/room';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import type { MemberWithDetails } from '@/types/room-management';
import {
  calculateDisplaySlots,
  GamePhaseManager,
  updateMembersData,
} from '@/utils/room-management-utils';
import { toast } from 'vue-sonner';

const { currentPhase, gamePhaseManager } = useGameState();

// 使用英雄选择成员数据
const { champSelectSlots, updateChampSelectMembers } = useChampSelectMembers();

// 使用游戏开始成员数据
const { gameStartSlots, updateGameStartMembers } = useGameStartMembers();

// 房间管理状态
const currentRoom = ref<Room | null>(null);
const roomMembers = ref<MemberWithDetails[]>([]);
const updateTimer = ref<NodeJS.Timeout | null>(null);

// 判断当前用户是否有踢人权限
const canKickMembers = computed(() => {
  // 只有在真正的房间阶段且用户有踢人权限时才能踢人
  return (
    currentPhase.value === GameflowPhaseEnum.Lobby &&
    currentRoom.value?.localMember?.allowedKickOthers === true
  );
});

// 添加缓存变量
const cachedDisplaySlots = ref<(MemberWithDetails | null)[]>([]);
const lastPhase = ref<GameflowPhaseEnum | null>(null);
const lastMemberIds = ref<string>('');
const lastMemberDetails = ref<string>(''); // 新增：用于跟踪成员详细信息的变化

// 简化的阶段跟踪 - 只记录上次处理的阶段
const lastProcessedPhase = ref<GameflowPhaseEnum | null>(null);

// 检查阶段是否发生变化且需要处理
const shouldProcessPhase = (currentPhase: GameflowPhaseEnum): boolean => {
  const hasPhaseChanged = lastProcessedPhase.value !== currentPhase;

  if (hasPhaseChanged) {
    lastProcessedPhase.value = currentPhase;
    return GamePhaseManager.shouldPoll(currentPhase);
  }

  return false;
};

// 重置阶段跟踪
const resetPhaseTracking = () => {
  lastProcessedPhase.value = null;
};

// 判断是否为游戏开始阶段（需要两排布局）
const isGameStartPhase = computed(() => {
  return GamePhaseManager.isGameStartPhase(currentPhase.value);
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

// 获取成员详细信息 - 使用缓存优化
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

  // 使用通用函数批量加载召唤师数据和排位统计
  const summonerIds = newMembers.map(m => m.summonerId).filter(Boolean);
  const result = await updateMembersData(roomMembers.value, summonerIds);

  if (!result.success) {
    toast.error('房间成员数据加载失败');
    console.error('房间成员数据加载失败:', result.error);
  }
};

// 简化的房间信息更新
const updateRoom = async (): Promise<void> => {
  // 只在真正的Lobby阶段才调用房间API
  if (currentPhase.value !== GameflowPhaseEnum.Lobby) {
    console.log('🏠 当前不在房间阶段，跳过房间API调用');
    return;
  }

  try {
    // 直接获取房间和成员信息
    const room = await roomService.getCurrentLobby();
    currentRoom.value = room;

    const members = await roomService.getLobbyMembers();
    await fetchMembersDetails(members);
  } catch (error) {
    console.error('更新房间信息失败:', error);
    // 获取房间信息失败，清理数据
    currentRoom.value = null;
    roomMembers.value = [];
  }
};

// 踢出成员
const kickMember = async (summonerId: number): Promise<void> => {
  // 前置权限检查
  if (!canKickMembers.value) {
    console.warn('当前阶段或权限不允许踢人操作');
    toast.error('当前阶段或权限不允许踢人操作');
    return;
  }

  await roomService.kickMember(summonerId);
  await updateRoom();
};

// 简化的房间状态轮询
const startRoomPolling = () => {
  if (updateTimer.value) return;

  console.log('🏠 开始房间状态轮询');
  updateTimer.value = setInterval(async () => {
    try {
      const current = currentPhase.value;

      // 检查是否需要处理当前阶段
      if (shouldProcessPhase(current)) {
        console.log('🏠 阶段变化，处理新阶段:', current);

        if (current === GameflowPhaseEnum.Lobby) {
          await updateRoom();
        } else if (GamePhaseManager.isChampSelectPhase(current)) {
          await updateChampSelectMembers();
        } else if (GamePhaseManager.isGameStartPhase(current)) {
          await updateGameStartMembers(
            await gamePhaseManager.handleGameStartPhase()
          );
        }
      } else if (!GamePhaseManager.shouldPoll(current)) {
        // 不需要轮询的阶段，清理数据
        if (GamePhaseManager.shouldClearDataOnly(current)) {
          console.log('🏠 进入空闲阶段，清理房间数据但保留缓存');
          roomMembers.value = [];
          resetPhaseTracking();
        } else if (GamePhaseManager.shouldClearCache(current)) {
          // 游戏结束阶段：清理所有数据和缓存
          console.log('🎮 游戏结束，清理所有数据和缓存');
          roomMembers.value = [];
          resetPhaseTracking();
          summonerDataCache.clearAllCache();
        }
      }
    } catch (e) {
      console.error('房间状态轮询错误:', e);
      roomMembers.value = [];
      resetPhaseTracking();
    }
  }, 3000);
};

// 停止房间状态轮询
const stopRoomPolling = () => {
  if (updateTimer.value) {
    clearInterval(updateTimer.value);
    updateTimer.value = null;
    console.log('🛑 停止房间状态轮询');
  }
  resetPhaseTracking();
};

// 处理踢出成员
const handleKickMember = async (summonerId: number) => {
  if (confirm('确定要踢出这个成员吗？')) {
    await kickMember(summonerId);
  }
};

onMounted(() => {
  startRoomPolling();
});

onUnmounted(() => {
  stopRoomPolling();
  resetPhaseTracking();
  // 清理召唤师数据缓存
  summonerDataCache.clearAllCache();
  console.log('🧹 已清理召唤师数据缓存');
});

// 页面激活时恢复轮询
onActivated(() => {
  console.log('🔄 页面激活，恢复房间状态轮询');
  startRoomPolling();
});

// 页面失活时停止轮询
onDeactivated(() => {
  console.log('⏸️ 页面失活，暂停房间状态轮询');
  stopRoomPolling();
});
</script>

<template>
  <!-- 主容器 - 使用渐变背景和现代布局 -->
  <main
    class="from-background via-background to-muted/30 relative flex h-[calc(100vh-40px)] flex-col overflow-hidden bg-gradient-to-br"
  >
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
            :can-kick="canKickMembers && index !== 0"
            @kick="handleKickMember"
          />

          <!-- 空位的情况 -->
          <RoomEmptySlot v-else :slot-index="index" />
        </div>
      </template>
    </div>
  </main>
</template>
