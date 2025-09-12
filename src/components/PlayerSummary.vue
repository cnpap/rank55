<script setup lang="ts">
import type { Game } from '@/types/match-history-sgp';
import { formatNumber, formatGameDuration } from '@/lib/rank-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import { Badge } from '@/components/ui/badge';
import { staticAssets } from '@/assets/data-assets';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';
import { computed, inject } from 'vue';

interface Props {
  match: Game;
}

const props = defineProps<Props>();
const puuid = inject<string>('puuid');

// 获取当前玩家信息
const currentPlayer = computed(() => {
  return props.match.json.participants.find(p => p.puuid === puuid);
});

// 获取当前玩家的装备
const items = computed(() => {
  if (!currentPlayer.value) return [];
  return [
    currentPlayer.value.item0,
    currentPlayer.value.item1,
    currentPlayer.value.item2,
    currentPlayer.value.item3,
    currentPlayer.value.item4,
    currentPlayer.value.item5,
    currentPlayer.value.item6,
  ];
});

// 获取召唤师技能
const spells = computed(() => {
  if (!currentPlayer.value) return [0, 0];
  return [currentPlayer.value.spell1Id, currentPlayer.value.spell2Id];
});

// 获取符文
const runes = computed(() => {
  if (!currentPlayer.value?.perks) return [0, 0];
  const primaryStyle = currentPlayer.value.perks.styles.find(
    s => s.description === 'primaryStyle'
  );
  const subStyle = currentPlayer.value.perks.styles.find(
    s => s.description === 'subStyle'
  );
  return [primaryStyle?.style || 0, subStyle?.style || 0];
});

// 获取KDA信息
const kda = computed(() => {
  if (!currentPlayer.value)
    return { kills: 0, deaths: 0, assists: 0, ratio: 0 };
  const { kills, deaths, assists } = currentPlayer.value;
  const ratio = deaths === 0 ? kills + assists : (kills + assists) / deaths;
  return { kills, deaths, assists, ratio };
});

// 获取统计信息
const stats = computed(() => {
  if (!currentPlayer.value)
    return { level: 0, gold: 0, cs: 0, damage: 0, damageTaken: 0 };
  return {
    level: currentPlayer.value.champLevel,
    gold: currentPlayer.value.goldEarned,
    cs:
      currentPlayer.value.totalMinionsKilled +
      currentPlayer.value.neutralMinionsKilled,
    damage: currentPlayer.value.totalDamageDealtToChampions,
    damageTaken: currentPlayer.value.totalDamageTaken,
  };
});

// 判断是否为重开游戏（游戏时长小于5分钟）
const isRemakeGame = computed(() => {
  return props.match.json.gameDuration < 300; // 5分钟 = 300秒
});

// 获取队列类型
const queueType = computed(() => {
  if (isRemakeGame.value) {
    return '重开';
  }
  const queueId = props.match.json.queueId;
  const queueKey = `q_${queueId}` as keyof typeof GAME_MODE_TAGS;
  return GAME_MODE_TAGS[queueKey] || '未知模式';
});
</script>

<template>
  <div class="flex w-38.5 flex-col gap-0.5">
    <!-- 第一行：左右两个容器的布局 -->
    <div class="flex items-start justify-between">
      <!-- 左侧容器：英雄信息 -->
      <div class="flex flex-1 flex-col">
        <!-- 英雄头像 + 召唤师技能 -->
        <div class="flex items-start gap-0.5">
          <!-- 英雄头像 + 等级 -->
          <div class="relative flex-shrink-0">
            <img
              :src="
                staticAssets.getChampionIcon(
                  `${currentPlayer?.championId || 0}`
                )
              "
              :alt="currentPlayer?.championName || '未知英雄'"
              class="h-12 w-12"
            />
            <!-- <div
              class="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
            >
              <span class="font-tektur-numbers text-xs font-bold">
                {{ stats.level }}
              </span>
            </div> -->
          </div>

          <!-- 召唤师技能 + 天赋 -->
          <div class="flex items-start gap-1">
            <!-- 召唤师技能 -->
            <div class="flex flex-col gap-1">
              <img
                :src="staticAssets.getSpellIcon(`${spells[0]}`)"
                :alt="`召唤师技能${spells[0]}`"
                class="border-border/40 h-5 w-5 rounded object-cover shadow-sm"
              />
              <img
                :src="staticAssets.getSpellIcon(`${spells[1]}`)"
                :alt="`召唤师技能${spells[1]}`"
                class="border-border/40 h-5 w-5 rounded object-cover shadow-sm"
              />
            </div>

            <!-- 天赋系 -->
            <div class="flex flex-col gap-1">
              <div class="relative h-5 w-5">
                <img
                  v-if="runes[0]"
                  :src="staticAssets.getRuneIcon(`${runes[0]}`)"
                  :alt="`主要天赋系${runes[0]}`"
                  class="border-border/40 h-full w-full rounded object-cover shadow-sm"
                />
                <div
                  v-else
                  class="border-border/20 bg-muted/30 h-full w-full rounded border"
                />
              </div>
              <div class="relative h-5 w-5">
                <img
                  v-if="runes[1]"
                  :src="staticAssets.getRuneIcon(`${runes[1]}`)"
                  :alt="`次要天赋系${runes[1]}`"
                  class="border-border/40 h-full w-full rounded object-cover shadow-sm"
                />
                <div
                  v-else
                  class="border-border/20 bg-muted/30 h-full w-full rounded border"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧容器：KDA -->
      <div class="flex flex-col gap-1">
        <!-- KDA -->
        <div class="text-right">
          <div class="font-tektur-numbers text-foreground font-bold">
            {{ kda.kills }}/{{ kda.deaths }}/{{ kda.assists }}
          </div>
          <Badge
            variant="secondary"
            class="font-tektur-numbers text-xs font-bold"
            :class="{
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                kda.ratio >= 3,
              'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                kda.ratio >= 2 && kda.ratio < 3,
              'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                kda.ratio < 2,
            }"
          >
            {{
              currentPlayer?.challenges
                ? currentPlayer.challenges.kda.toFixed(2)
                : 'N/A'
            }}
          </Badge>
        </div>

        <!-- 第二行：经济 -->
        <!-- <div class="flex items-center justify-end gap-1 text-xs">
          <span
            class="font-tektur-numbers flex w-12 items-center gap-1 font-semibold"
          >
            <img class="h-3 w-3" :src="staticAssets.getIcon('coin')" />
            {{ formatNumber(stats.gold) }}
          </span>
          <span
            class="font-tektur-numbers ml-2 flex w-12 items-center justify-between gap-1 font-semibold"
          >
            <span></span>
            {{ stats.cs }} CS
          </span>
        </div> -->

        <!-- 第三行：伤害 -->
        <!-- <div class="flex items-center justify-end gap-3 text-xs">
          <div class="flex w-12 items-center gap-1">
            <img class="h-3 w-3" :src="staticAssets.getIcon('fire')" />
            <span class="font-tektur-numbers font-semibold">
              {{ formatNumber(stats.damage) }}
            </span>
          </div>
          <div class="flex w-12 items-center gap-1">
            <img class="h-3 w-3" :src="staticAssets.getIcon('protection')" />
            <span class="font-tektur-numbers font-semibold">
              {{ formatNumber(stats.damageTaken) }}
            </span>
          </div>
        </div> -->
      </div>
    </div>

    <!-- 第二行：游戏模式和时间 -->
    <div class="flex w-full items-center justify-between gap-4">
      <h4 class="text-foreground flex-shrink-0 text-sm font-semibold">
        {{ queueType }}
      </h4>
      <div class="text-muted-foreground flex items-center gap-2 text-xs">
        <p class="whitespace-nowrap">
          {{ formatDateToDay(match.json.gameCreation as unknown as string) }}
        </p>
        <p class="font-medium whitespace-nowrap">
          {{ formatGameDuration(match.json.gameDuration) }}
        </p>
      </div>
    </div>

    <!-- 第三行：装备 (最下面一行) -->
    <div class="flex gap-0.5">
      <div
        v-for="(_itemId, index) in Array.from({ length: 6 })"
        :key="index"
        class="relative h-6 w-6"
      >
        <img
          v-if="items[index]"
          :src="staticAssets.getItemIcon(`${items[index]}`)"
          :alt="`装备${items[index]}`"
          class="border-border/40 h-full w-full rounded border object-cover shadow-sm"
        />
        <div
          v-else
          class="border-border/20 bg-muted/30 h-full w-full rounded border"
        />
      </div>
    </div>
  </div>
</template>
