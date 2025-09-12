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
import { isPlayerMVP } from '@/lib/match-helpers';

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

// 辅助函数：判断是否为重开游戏（游戏时长小于5分钟）
const isRemakeGame = computed(() => {
  return props.match.json.gameDuration < 300; // 5分钟 = 300秒
});

// 辅助函数：获取游戏结果
const gameResult = computed(() => {
  if (!currentPlayer.value) return 'unknown';
  if (isRemakeGame.value) return 'remake';
  return currentPlayer.value.win ? 'victory' : 'defeat';
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
      'text-emerald-500 dark:text-emerald-400': gameResult === 'victory',
      'text-red-500 dark:text-rose-400': gameResult === 'defeat',
      'text-gray-500 dark:text-gray-400': gameResult === 'remake',
    }"
  >
    {{ index }}
  </div>

  <div
    class="group bg-card relative w-4xl overflow-hidden border py-1 transition-all duration-300"
  >
    <!-- 胜负纹理背景 -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.04]"
      :class="{
        'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.emerald.300)_0%,_transparent_50%)]':
          gameResult === 'victory',
        'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.red.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.red.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.rose.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.rose.300)_0%,_transparent_50%)]':
          gameResult === 'defeat',
        'bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gray.500)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.gray.400)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,_theme(colors.gray.400)_0%,_transparent_50%),_radial-gradient(circle_at_80%_50%,_theme(colors.gray.300)_0%,_transparent_50%)]':
          gameResult === 'remake',
      }"
    />

    <!-- 左侧装饰条纹 -->
    <div
      class="absolute top-0 left-0 h-full w-2 opacity-60 dark:opacity-40"
      :class="{
        'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.600),_theme(colors.emerald.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.500),_theme(colors.emerald.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'victory',
        'bg-[repeating-linear-gradient(45deg,_theme(colors.red.600),_theme(colors.red.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.rose.500),_theme(colors.rose.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'defeat',
        'bg-[repeating-linear-gradient(45deg,_theme(colors.gray.600),_theme(colors.gray.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.gray.500),_theme(colors.gray.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'remake',
      }"
    />

    <!-- 右侧装饰条纹 -->
    <div
      class="absolute top-0 right-0 h-full w-2 opacity-60 dark:opacity-40"
      :class="{
        'bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.600),_theme(colors.emerald.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.emerald.500),_theme(colors.emerald.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'victory',
        'bg-[repeating-linear-gradient(45deg,_theme(colors.red.600),_theme(colors.red.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.rose.500),_theme(colors.rose.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'defeat',
        'bg-[repeating-linear-gradient(45deg,_theme(colors.gray.600),_theme(colors.gray.600)_3px,_transparent_3px,_transparent_6px)] dark:bg-[repeating-linear-gradient(45deg,_theme(colors.gray.500),_theme(colors.gray.500)_3px,_transparent_3px,_transparent_6px)]':
          gameResult === 'remake',
      }"
    />

    <!-- KDA + 统计 + 装备 + 玩家列表 -->
    <div class="relative flex w-full items-center gap-4 pl-2">
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
