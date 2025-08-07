<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
</script>

<template>
  <!-- 陪玩广告卡片 -->
  <div class="overflow-hidden rounded-lg border-0 p-0 shadow-2xl">
    <div
      class="relative h-96 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
      style="
        background-image: url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg');
        background-size: cover;
        background-position: center;
      "
    >
      <!-- 磨砂遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <!-- 渐变遮罩 -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
      ></div>

      <!-- 内容 -->
      <div class="relative flex h-full flex-col justify-end p-6 text-white">
        <!-- 标题区域 -->
        <div class="mb-4">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-2xl">✨</span>
            <span
              class="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent"
            >
              专业陪玩
            </span>
          </div>
          <h3 class="mb-2 text-xl leading-tight font-bold">
            王者陪玩<br />
            <span class="text-pink-300">技术与颜值并存</span>
          </h3>
          <p class="text-xs leading-relaxed text-gray-300">
            专业选手陪玩 • 上分保障<br />
            语音聊天 • 游戏指导
          </p>
        </div>

        <!-- 特色标签 -->
        <div class="mb-4 flex flex-wrap gap-1">
          <Badge
            class="border-pink-400/30 bg-pink-500/20 text-xs text-pink-300"
          >
            🏆 王者
          </Badge>
          <Badge
            class="border-purple-400/30 bg-purple-500/20 text-xs text-purple-300"
          >
            🎮 指导
          </Badge>
          <Badge
            class="border-blue-400/30 bg-blue-500/20 text-xs text-blue-300"
          >
            💬 语音
          </Badge>
        </div>

        <!-- 价格信息 -->
        <div class="mb-4">
          <div class="flex items-baseline gap-2">
            <span class="text-xl font-bold text-pink-300">¥15</span>
            <span class="text-xs text-gray-400 line-through">¥25</span>
            <span class="text-xs text-gray-300">/小时</span>
          </div>
          <p class="mt-1 text-xs text-pink-200">新用户首单6折优惠</p>
        </div>

        <!-- 行动按钮 -->
        <div class="space-y-2">
          <Button
            class="w-full border-0 bg-gradient-to-r from-pink-500 to-purple-600 text-sm font-medium hover:from-pink-600 hover:to-purple-700"
          >
            <span class="flex items-center gap-2">
              <span>💖</span>
              立即预约陪玩
            </span>
          </Button>
          <Button
            variant="outline"
            class="w-full border-white/50 bg-white/10 text-xs text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20"
          >
            查看更多陪玩师
          </Button>
        </div>

        <!-- 底部装饰 -->
        <div class="absolute top-4 right-4">
          <div
            class="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1"
          >
            <span class="text-xs text-yellow-400">⭐</span>
            <span class="text-xs font-medium">4.9</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 在线状态指示 - 修复主题适配 -->
  <div class="mt-4 text-center">
    <div
      class="bg-muted text-muted-foreground border-border inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
    >
      <div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
      <span class="text-xs">当前在线陪玩师: 1,247人</span>
    </div>
  </div>
</template>
