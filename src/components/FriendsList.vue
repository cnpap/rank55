<script setup lang="ts">
import { SimpleFriend } from '@/types/friend';

// 简化的好友数据类型定义

// Props 定义
interface Props {
  // 好友列表数据
  friends: SimpleFriend[];
  // 是否正在搜索
  isSearching: boolean;
}

const props = defineProps<Props>();

// Emits 定义
interface Emits {
  // 从好友列表搜索事件
  searchFromFriend: [friend: SimpleFriend];
}

const emit = defineEmits<Emits>();

// 处理好友点击
const handleFriendClick = (friend: SimpleFriend) => {
  if (props.isSearching) return;
  emit('searchFromFriend', friend);
};
</script>

<template>
  <div v-if="friends.length > 0">
    <div class="mb-3">
      <span class="text-foreground font-medium">在线好友</span>
      <span class="text-muted-foreground ml-2 text-xs">
        {{ friends.length }}
      </span>
    </div>
    <!-- 好友flex布局，自适应每行显示数量 -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="friend in friends"
        :key="friend.id"
        class="group border-border/40 bg-card/50 hover:border-border/80 hover:bg-card/80 relative cursor-pointer overflow-hidden rounded-lg border px-3 py-2 transition-all duration-200 hover:shadow-sm"
        @click="handleFriendClick(friend)"
        :class="{ 'cursor-not-allowed opacity-50': isSearching }"
      >
        <!-- 在线装饰线 - 根据状态显示不同颜色 -->
        <div
          class="absolute top-0 left-0 h-full w-1"
          :class="{
            'bg-green-500': friend.isOnline && !friend.isInGame,
            'bg-blue-500': friend.isInGame,
          }"
        ></div>
        <div class="flex items-center gap-2 pl-1">
          <span class="text-foreground text-xs font-medium">{{
            friend.gameName
          }}</span>
          <span class="text-muted-foreground text-xs"
            >#{{ friend.tagLine }}</span
          >
        </div>
        <!-- 底部装饰线 - 根据状态显示不同颜色 -->
        <div
          class="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
          :class="{
            'bg-green-500': friend.isOnline && !friend.isInGame,
            'bg-blue-500': friend.isInGame,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>
