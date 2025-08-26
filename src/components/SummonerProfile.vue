<script setup lang="ts">
import { computed } from 'vue';
import { Copy } from 'lucide-vue-next';
import { staticAssets } from '@/assets/data-assets';
import {
  copyToClipboard,
  getPlayerDisplayName,
  getPlayerName,
  getPlayerTagLine,
  getPlayerRankInfos,
} from '@/lib/player-helpers';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';

const props = defineProps<{
  summoner?: SummonerData;
  rankedStats?: RankedStats;
}>();

// 获取召唤师头像URL
const profileIconUrl = computed(() => {
  if (!props.summoner?.profileIconId) {
    return staticAssets.getProfileIcon('1'); // 默认头像
  }
  return staticAssets.getProfileIcon(String(props.summoner.profileIconId));
});

// 计算排位信息
const rankInfos = computed(() => {
  if (!props.rankedStats) {
    return [];
  }
  return getPlayerRankInfos(props.rankedStats);
});

// 获取完整游戏名称（包含标签）
const fullGameName = computed(() => {
  if (!props.summoner) {
    return 'Unknown Player';
  }
  return getPlayerDisplayName(props.summoner);
});

// 获取召唤师名称部分（不包含标签）
const summonerName = computed(() => {
  if (!props.summoner) {
    return 'Unknown';
  }
  return getPlayerName(props.summoner);
});

// 获取标签部分
const tagLine = computed(() => {
  if (!props.summoner) {
    return '';
  }
  return getPlayerTagLine(props.summoner);
});

// 复制召唤师名称到剪贴板
const copyPlayerName = async () => {
  await copyToClipboard(fullGameName.value, '召唤师名称已复制到剪贴板');
};
</script>

<template>
  <!-- 召唤师基本信息和排位信息在同一行 -->
  <div class="flex h-30 items-center justify-between gap-6">
    <!-- 头像和基本信息 -->
    <div class="flex items-center gap-4">
      <img
        :src="profileIconUrl"
        :alt="fullGameName"
        class="border-border/50 h-16 w-16 rounded border object-cover"
      />
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <h2 class="text-foreground text-xl font-semibold">
            <span>{{ summonerName }}</span>
            <span v-if="tagLine" class="text-muted-foreground">{{
              tagLine
            }}</span>
          </h2>
          <button
            @click="copyPlayerName"
            class="text-muted-foreground rounded p-1 transition-colors"
            title="复制召唤师名称"
          >
            <Copy class="h-3 w-3" />
          </button>
        </div>
        <div class="flex items-center gap-1 text-sm">
          <span class="font-tektur-numbers">
            <span>LEVEL:</span>
            {{ props.summoner?.summonerLevel || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- 排位信息 - 紧凑布局 -->
    <div class="flex w-128 gap-3">
      <div
        v-for="(rankInfo, index) in rankInfos"
        :key="index"
        class="flex items-center gap-2"
      >
        <div class="space-y-0.5">
          <div class="text-muted-foreground text-xs font-medium">
            {{ rankInfo.queueName }}
          </div>
          <div class="text-sm font-bold">
            {{ rankInfo.tier }}
            <span v-if="rankInfo.division" class="font-tektur-numbers">
              {{ rankInfo.division }}
            </span>
          </div>
          <div
            v-if="rankInfo.lp > 0"
            class="font-tektur-numbers text-muted-foreground text-xs"
          >
            {{ rankInfo.lp }} LP
          </div>
          <div class="font-tektur-numbers text-xs">
            <span class="text-yellow-600">{{ rankInfo.wins }}</span
            >/<span class="text-pink-600">{{
              rankInfo.losses ? rankInfo.losses : 'fail'
            }}</span>
            <span class="pl-1">{{ rankInfo.winRate }}%</span>
          </div>
        </div>
        <img
          :src="rankInfo.iconUrl"
          :alt="rankInfo.queueName"
          class="h-24 w-24 scale-125 transform object-contain"
        />
      </div>
    </div>
  </div>
</template>
