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
        class="group border-border/20 hover:border-border/40 hover:shadow-primary/5 relative cursor-pointer overflow-hidden rounded-lg border px-3 py-2 backdrop-blur-sm transition-all duration-300 ease-out hover:shadow-lg"
        @click="handleFriendClick(friend)"
        :class="[
          {
            'cursor-not-allowed opacity-50': isSearching,
            // 在线状态 - 绿色调背景
            'from-card/30 to-card/60 hover:from-card/50 hover:to-card/80 bg-gradient-to-br':
              friend.isOnline && !friend.isInGame,
            // 游戏中状态 - 蓝色调背景
            'via-card/30 to-card/60 hover:via-card/50 hover:to-card/80 bg-gradient-to-br from-blue-500/10 hover:from-blue-500/20':
              friend.isInGame,
          },
        ]"
      >
        <!-- 状态标识 - 绝对定位在左上角 -->
        <div
          class="absolute top-0 left-0 h-1 w-1 border border-white/30 shadow-sm"
          :class="{
            'bg-green-500': friend.isOnline && !friend.isInGame,
            'bg-blue-500': friend.isInGame,
          }"
        ></div>
        <div class="relative z-10 flex items-center gap-2">
          <span
            class="text-foreground group-hover:text-foreground text-xs font-medium transition-colors duration-300 group-hover:brightness-110"
            >{{ friend.gameName }}</span
          >
          <span
            class="text-muted-foreground/60 group-hover:text-muted-foreground text-xs transition-colors duration-300"
            >#{{ friend.tagLine }}</span
          >
        </div>

        <!-- 精致的内发光效果 - 根据状态调整颜色 -->
        <div
          class="absolute inset-0 rounded-lg transition-all duration-500 ease-out"
          :class="{
            // 在线状态的内发光
            'bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/8 group-hover:via-green-500/3 group-hover:to-transparent':
              friend.isOnline && !friend.isInGame,
            // 游戏中状态的内发光
            'bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/8 group-hover:via-blue-500/3 group-hover:to-transparent':
              friend.isInGame,
          }"
        ></div>

        <!-- 微妙的边框高光 - 根据状态调整颜色 -->
        <div
          class="absolute inset-0 rounded-lg border border-transparent transition-all duration-300 ease-out"
          :class="{
            'group-hover:border-green-500/20':
              friend.isOnline && !friend.isInGame,
            'group-hover:border-blue-500/20': friend.isInGame,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>
