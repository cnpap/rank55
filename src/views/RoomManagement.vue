<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoomManagementStore } from '@/stores/room-management';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import RoomEmptyState from '@/components/RoomEmptyState.vue';
import { eventBus } from '@/lib/event-bus';

const roomStore = useRoomManagementStore();

// 计算属性
const isLoading = computed(
  () => roomStore.isLoadingRoom || roomStore.isLoadingMembers
);
const isInRoom = computed(() => roomStore.isInRoom);

// 创建5个位置的数组，房主在第一个位置，其他成员按顺序填充，空位用null表示
const roomSlots = computed(() => {
  const slots = Array(5).fill(null);

  if (roomStore.roomLeader) {
    slots[0] = roomStore.roomLeader;
  }

  // 填充其他成员到剩余位置
  const otherMembers = roomStore.otherMembers;
  for (let i = 0; i < Math.min(otherMembers.length, 4); i++) {
    slots[i + 1] = otherMembers[i];
  }

  return slots;
});

// 踢出成员
const handleKickMember = async (summonerId: number) => {
  if (confirm('确定要踢出这个成员吗？')) {
    await roomStore.kickMember(summonerId);
  }
};

// 组件挂载时初始化房间管理
onMounted(async () => {
  // 手动设置当前页面状态为房间管理页面
  roomStore.isOnRoomPage = true;

  // 手动触发页面切换事件，确保状态正确
  eventBus.emit('page:change', 'RoomManagement');

  // 初始化房间管理（包括设置事件监听器和获取房间信息）
  await roomStore.initializeRoomManagement();
});

// 组件卸载时清理资源
onUnmounted(() => {
  // 手动设置当前页面状态为非房间管理页面
  roomStore.isOnRoomPage = false;

  // 移除事件监听器和停止轮询
  roomStore.removeEventListeners();
  roomStore.stopPolling();
});
</script>

<template>
  <!-- 主容器 - 使用渐变背景和现代布局 -->
  <main
    class="from-background via-background to-muted/30 relative flex h-[calc(100vh-40px)] flex-col overflow-hidden bg-gradient-to-br"
  >
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
          v-if="member"
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
