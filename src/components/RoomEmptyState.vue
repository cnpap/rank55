<script setup lang="ts">
import { Users } from 'lucide-vue-next';

interface Props {
  title?: string;
  description?: string;
  statusText?: string;
  footerText?: string;
}

withDefaults(defineProps<Props>(), {
  title: '暂未开启房间',
  description: '当前没有检测到活跃的游戏房间',
  statusText: '实时监听中',
  footerText: '创建或加入游戏房间后，成员信息将自动显示在此处',
});
</script>

<template>
  <div class="flex flex-1 items-center justify-center py-16">
    <div class="max-w-sm space-y-8 text-center">
      <!-- 图标 -->
      <div class="flex justify-center">
        <Users class="text-muted-foreground/60 h-16 w-16" />
      </div>

      <!-- 标题和描述 -->
      <div class="space-y-3">
        <h2 class="text-foreground text-xl font-medium">
          {{ title }}
        </h2>
        <p class="text-muted-foreground text-sm">
          {{ description }}
        </p>
      </div>

      <!-- 状态指示器 -->
      <div class="flex items-center justify-center gap-2">
        <div class="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
        <span class="text-muted-foreground text-sm">
          {{ statusText }}
        </span>
      </div>

      <!-- 提示信息 -->
      <p class="text-muted-foreground/80 text-xs">
        {{ footerText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 添加微妙的悬停效果 */
.room-empty-card {
  transition: all 0.3s ease;
}

.room-empty-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -5px hsl(var(--foreground) / 0.1),
    0 8px 10px -6px hsl(var(--foreground) / 0.1);
}

/* 优化脉动动画 */
@keyframes gentle-pulse {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: gentle-pulse 2s ease-in-out infinite;
}
</style>
