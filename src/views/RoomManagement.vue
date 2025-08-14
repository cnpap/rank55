<script setup lang="ts">
import { computed } from 'vue';
import { useAutoAcceptGame } from '@/hooks/use-auto-accept-game';
import RoomMemberCard from '@/components/RoomMemberCard.vue';
import RoomEmptySlot from '@/components/RoomEmptySlot.vue';
import RoomEmptyState from '@/components/RoomEmptyState.vue';

const {
  isLoading,
  isInRoom,
  roomLeader,
  otherMembers,
  kickMember,
  errorMessage,
  clearError,
} = useAutoAcceptGame();

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

  return slots;
});

// 踢出成员
const handleKickMember = async (summonerId: number) => {
  if (confirm('确定要踢出这个成员吗？')) {
    await kickMember(summonerId);
  }
};

// 清除错误信息
const handleClearError = () => {
  clearError();
};
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
