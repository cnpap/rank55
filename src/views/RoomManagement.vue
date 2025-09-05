<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
} from 'vue';
import { useGameState } from '@/lib/composables/useGameState';
import { useChampSelectMembers } from '@/hooks/useChampSelectMembers';
import { useGameStartMembers } from '@/hooks/useGameStartMembers';
import { useRoomMembers } from '@/hooks/useRoomMembers';
import { summonerDataCache } from '@/lib/service/summoner-data-cache';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import type { MemberWithDetails } from '@/types/room-management';
import {
  calculateDisplaySlots,
  GamePhaseManager,
} from '@/utils/room-management-utils';

const { currentPhase, gamePhaseManager } = useGameState();

// 使用英雄选择成员数据
const { champSelectSlots, updateChampSelectMembers } = useChampSelectMembers();

// 使用游戏开始成员数据
const { gameStartSlots, updateGameStartMembers } = useGameStartMembers();

// 使用房间成员数据
const {
  roomMembers,
  canKickMembers,
  updateRoomMembers,
  kickMember,
  clearRoomData,
} = useRoomMembers();

// 轮询定时器
const updateTimer = ref<NodeJS.Timeout | null>(null);

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

// 简化的房间状态轮询
const startRoomPolling = () => {
  if (updateTimer.value) return;

  console.log('🏠 开始房间状态轮询');
  updateTimer.value = setInterval(async () => {
    try {
      const current = currentPhase.value;

      // 检查当前阶段是否需要轮询
      if (GamePhaseManager.shouldPoll(current)) {
        // 检查是否是阶段变化
        const hasPhaseChanged = shouldProcessPhase(current);
        if (hasPhaseChanged) {
          console.log('🏠 阶段变化，处理新阶段:', current);
        }

        // 根据当前阶段执行相应的更新逻辑
        if (current === GameflowPhaseEnum.Lobby) {
          // Lobby阶段需要持续轮询房间成员变化
          await updateRoomMembers(current);
        } else if (GamePhaseManager.isChampSelectPhase(current)) {
          // 英雄选择阶段：只在阶段变化时更新一次
          if (hasPhaseChanged) {
            await updateChampSelectMembers();
          }
        } else if (GamePhaseManager.isGameStartPhase(current)) {
          // 游戏开始阶段：只在阶段变化时更新一次
          if (hasPhaseChanged) {
            await updateGameStartMembers(
              await gamePhaseManager.handleGameStartPhase()
            );
          }
        }
      } else {
        // 不需要轮询的阶段，清理数据
        if (GamePhaseManager.shouldClearDataOnly(current)) {
          console.log('🏠 进入空闲阶段，清理房间数据但保留缓存');
          clearRoomData();
          resetPhaseTracking();
        } else if (GamePhaseManager.shouldClearCache(current)) {
          // 游戏结束阶段：清理所有数据和缓存
          console.log('🎮 游戏结束，清理所有数据和缓存');
          clearRoomData();
          resetPhaseTracking();
          summonerDataCache.clearAllCache();
        }
      }
    } catch (e) {
      console.error('房间状态轮询错误:', e);
      clearRoomData();
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
    await kickMember(summonerId, currentPhase.value);
  }
};

onMounted(() => {
  startRoomPolling();
});

onUnmounted(() => {
  stopRoomPolling();
  resetPhaseTracking();
  clearRoomData();
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
