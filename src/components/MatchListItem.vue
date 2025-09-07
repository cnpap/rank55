<script setup lang="ts">
import type { Game } from '@/types/match-history-sgp';
import { ChevronDown } from 'lucide-vue-next';
import MatchDetailView from './MatchDetailView.vue';
import PlayerSummary from './PlayerSummary.vue';
import TeamsList from './TeamsList.vue';
import { inject, computed } from 'vue';
import { ref } from 'vue';
import Button from './ui/button/Button.vue';
import { staticAssets } from '@/assets/data-assets';
import { findMVPPlayer, isPlayerMVP } from '@/lib/match-helpers';

interface Props {
  match: Game;
  index: number; // 添加索引属性
}

const props = defineProps<Props>();

// 组件内部管理展开状态
const isExpanded = ref(false);

const toggleDetail = () => {
  isExpanded.value = !isExpanded.value;
};

const puuid = inject<string>('puuid');

// 辅助函数：获取当前玩家的参与者信息
const currentPlayer = computed(() => {
  return props.match.json.participants.find(p => p.puuid === puuid);
});

// 辅助函数：获取游戏结果
const gameResult = computed(() => {
  if (!currentPlayer.value) return 'unknown';
  return currentPlayer.value.win ? 'victory' : 'defeat';
});

// 使用工具函数计算MVP
const mvpPlayer = computed(() => {
  return findMVPPlayer(props.match);
});

// 判断当前玩家是否是 MVP
const isCurrentPlayerMVP = computed(() => {
  return puuid ? isPlayerMVP(props.match, puuid) : false;
});
</script>

<template>
  <!-- MVP 图标 -->
  <div v-if="isCurrentPlayerMVP" class="absolute top-2 -left-12 z-999">
    <img
      :src="staticAssets.getIcon('most-valuable-player2')"
      alt="MVP"
      class="h-10 w-10 drop-shadow-md"
    />
  </div>

  <!-- 战绩索引 -->
  <div
    class="font-tektur-numbers absolute top-2 -right-8 z-999 font-bold transition-colors duration-300"
    :class="{
      'text-emerald-500 dark:text-emerald-300': gameResult === 'victory',
      'text-red-500 dark:text-red-300': gameResult === 'defeat',
    }"
  >
    {{ index }}
  </div>

  <div
    class="group bg-card relative w-4xl overflow-hidden border-b transition-all duration-300"
    :class="{
      'border-emerald-200/70 bg-gradient-to-r from-emerald-50/60 via-emerald-50/30 to-emerald-50/10 shadow-emerald-100/50 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:via-emerald-950/20 dark:to-emerald-950/5 dark:shadow-emerald-900/20':
        gameResult === 'victory',
      'border-red-200/70 bg-gradient-to-r from-red-50/60 via-red-50/30 to-red-50/10 shadow-red-100/50 dark:border-red-800/50 dark:from-red-950/40 dark:via-red-950/20 dark:to-red-950/5 dark:shadow-red-900/20':
        gameResult === 'defeat',
    }"
    style="box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1)"
  >
    <!-- 胜负纹理背景 -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.03]"
      :class="{
        'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.400)_0%,_transparent_50%)]':
          gameResult === 'victory',
        'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.red.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.red.400)_0%,_transparent_50%)]':
          gameResult === 'defeat',
      }"
    />

    <!-- 左侧强化指示条 -->
    <div
      class="absolute top-0 left-0 h-full w-1 opacity-80"
      :class="{
        'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600':
          gameResult === 'victory',
        'bg-gradient-to-b from-red-400 via-red-500 to-red-600':
          gameResult === 'defeat',
      }"
    />

    <!-- 右侧装饰条纹 -->
    <div
      class="absolute top-0 right-0 h-full w-2 opacity-20"
      :class="{
        'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.400),_theme(colors.emerald.400)_2px,_transparent_2px,_transparent_8px)]':
          gameResult === 'victory',
        'bg-[repeating-linear-gradient(45deg,_theme(colors.red.400),_theme(colors.red.400)_2px,_transparent_2px,_transparent_8px)]':
          gameResult === 'defeat',
      }"
    />

    <!-- KDA + 统计 + 装备 + 玩家列表 -->
    <div class="relative flex w-full items-center gap-4 py-0.5 pl-2">
      <!-- KDA + 统计数据 + 装备 (分四行显示) -->
      <div class="flex flex-1 items-center justify-between gap-0.5">
        <!-- 当前玩家信息组件 -->
        <PlayerSummary :match="match" />

        <!-- 队伍信息组件 -->
        <TeamsList :match="match" />

        <!-- 展开按钮 -->
        <Button
          @click="toggleDetail"
          variant="outline"
          class="border-border/20 bg-primary hover:bg-primary/90 flex h-8 w-8 cursor-pointer items-center justify-center border p-0 transition-colors"
        >
          <ChevronDown
            class="h-4 w-4 text-white transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
          />
        </Button>
      </div>
    </div>

    <!-- 展开的详细信息 - 移到主容器底部 -->
    <div v-if="isExpanded" class="bg-muted/20 border-t">
      <MatchDetailView :game="props.match" />
    </div>
  </div>
</template>
