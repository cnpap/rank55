<script setup lang="ts">
import type { Game } from '@/types/match-history-sgp';
import { ChevronDown } from 'lucide-vue-next';
import MatchDetailView from './MatchDetailView.vue';
import PlayerSummary from './PlayerSummary.vue';
import TeamsList from './TeamsList.vue';
import { inject, computed } from 'vue';
import { ref } from 'vue';
import Button from './ui/button/Button.vue';
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
  <!-- MVP 标识 -->
  <div v-if="isCurrentPlayerMVP" class="absolute top-0 -left-14 z-999">
    <div class="relative h-6 w-12">
      <!-- 外层边框 -->
      <div
        class="absolute inset-0 rounded-sm bg-gradient-to-br from-amber-600/80 to-yellow-600/80 shadow-lg dark:from-amber-500/70 dark:to-yellow-500/70"
      ></div>

      <!-- 内层背景 -->
      <div
        class="absolute inset-0.5 rounded-sm bg-gradient-to-br from-amber-300/90 to-yellow-300/90 dark:from-amber-400/80 dark:to-yellow-400/80"
      ></div>

      <!-- 光泽效果 -->
      <div
        class="absolute inset-0.5 rounded-sm bg-gradient-to-t from-transparent via-white/20 to-white/40 dark:via-white/15 dark:to-white/30"
      ></div>

      <!-- MVP 文字 -->
      <div class="absolute inset-0 flex items-center justify-center">
        <span
          class="text-xs leading-none font-black tracking-tight text-amber-900 drop-shadow-sm dark:text-amber-800"
          >MVP</span
        >
      </div>
    </div>
  </div>

  <!-- 胜利/失败标识 -->
  <div
    v-if="gameResult !== 'remake'"
    class="absolute z-999"
    :class="{
      'top-0 -left-14': !isCurrentPlayerMVP,
      'top-7 -left-14': isCurrentPlayerMVP,
    }"
  >
    <div class="relative h-6 w-12">
      <!-- 外层边框 -->
      <div
        class="absolute inset-0 rounded-sm shadow-lg"
        :class="{
          'bg-gradient-to-br from-emerald-600/80 to-green-600/80 dark:from-emerald-500/70 dark:to-green-500/70':
            gameResult === 'victory',
          'bg-gradient-to-br from-red-600/80 to-rose-600/80 dark:from-red-500/70 dark:to-rose-500/70':
            gameResult === 'defeat',
        }"
      ></div>

      <!-- 内层背景 -->
      <div
        class="absolute inset-0.5 rounded-sm"
        :class="{
          'bg-gradient-to-br from-emerald-300/90 to-green-300/90 dark:from-emerald-400/80 dark:to-green-400/80':
            gameResult === 'victory',
          'bg-gradient-to-br from-red-300/90 to-rose-300/90 dark:from-red-400/80 dark:to-rose-400/80':
            gameResult === 'defeat',
        }"
      ></div>

      <!-- 光泽效果 -->
      <div
        class="absolute inset-0.5 rounded-sm bg-gradient-to-t from-transparent via-white/20 to-white/40 dark:via-white/15 dark:to-white/30"
      ></div>

      <!-- 胜利/失败文字 -->
      <div class="absolute inset-0 flex items-center justify-center">
        <span
          class="text-xs leading-none font-black tracking-tight drop-shadow-sm"
          :class="{
            'text-emerald-900 dark:text-emerald-800': gameResult === 'victory',
            'text-red-900 dark:text-red-800': gameResult === 'defeat',
          }"
        >
          {{ gameResult === 'victory' ? 'WIN' : 'LOSE' }}
        </span>
      </div>
    </div>
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
