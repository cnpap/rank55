<script setup lang="ts">
import { gameAssets } from '@/assets/data-assets';
import type { ProcessedMatch } from '@/types/match-history-ui';
import { formatNumber } from '@/lib/rank-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Coins, Sword, Shield } from 'lucide-vue-next';
import MatchDetailView from './MatchDetailView.vue';

interface Props {
  match: ProcessedMatch;
  isExpanded: boolean;
}

interface Emits {
  (e: 'toggle-detail'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div
    class="group bg-card relative overflow-hidden rounded border transition-all"
    :class="{
      'border-emerald-200/70 bg-gradient-to-r from-emerald-50/30 to-emerald-50/10 dark:border-emerald-800/50 dark:from-emerald-950/20 dark:to-emerald-950/5':
        match.result === 'victory',
      'border-red-200/70 bg-gradient-to-r from-red-50/30 to-red-50/10 dark:border-red-800/50 dark:from-red-950/20 dark:to-red-950/5':
        match.result === 'defeat',
    }"
  >
    <!-- 胜负状态指示条 -->
    <div
      class="absolute top-0 left-0 h-full w-1"
      :class="{
        'bg-emerald-500': match.result === 'victory',
        'bg-red-500': match.result === 'defeat',
      }"
    />

    <!-- 主要信息行 -->
    <div
      class="grid grid-cols-[4fr_1fr_2fr_2fr_auto] items-center gap-2 p-1 px-4"
    >
      <!-- 左侧：胜负状态 + 英雄信息 + 召唤师技能 -->
      <div class="flex items-center gap-2">
        <!-- 胜负状态 -->
        <div class="flex flex-col items-center gap-2">
          <Badge
            variant="outline"
            class="h-8 w-8 justify-center border-2 font-bold"
            :class="{
              'border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:border-emerald-400/50 dark:bg-emerald-950/50 dark:text-emerald-400':
                match.result === 'victory',
              'border-red-500/50 bg-red-50 text-red-700 dark:border-red-400/50 dark:bg-red-950/50 dark:text-red-400':
                match.result === 'defeat',
            }"
          >
            {{ match.result === 'victory' ? '胜' : '负' }}
          </Badge>
          <span class="text-muted-foreground text-xs font-medium">
            {{ match.duration }}
          </span>
        </div>

        <!-- 英雄信息 -->
        <div class="flex items-center gap-3">
          <!-- 英雄头像 + 等级 -->
          <div class="relative flex-shrink-0">
            <img
              :src="gameAssets.getChampionIcon(`${match.championId}`)"
              :alt="match.championName"
              class="ring-border/30 h-14 w-14 rounded object-cover ring-2"
            />
            <!-- 等级显示在头像右下角 -->
            <div
              class="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-gray-800"
            >
              <span class="font-tektur-numbers text-xs font-bold">
                {{ match.stats.level }}
              </span>
            </div>
          </div>

          <!-- 召唤师技能 + 天赋 -->
          <div class="flex flex-shrink-0 items-center gap-2">
            <!-- 召唤师技能 -->
            <div class="flex flex-col gap-1">
              <img
                :src="gameAssets.getSpellIcon(`${match.spells[0]}`)"
                :alt="`召唤师技能${match.spells[0]}`"
                class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
              />
              <img
                :src="gameAssets.getSpellIcon(`${match.spells[1]}`)"
                :alt="`召唤师技能${match.spells[1]}`"
                class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
              />
            </div>

            <!-- 天赋系 -->
            <div class="flex flex-col gap-1">
              <!-- 主要天赋系 -->
              <div class="relative h-6 w-6">
                <img
                  v-if="match.runes[0]"
                  :src="gameAssets.getRuneIcon(`${match.runes[0]}`)"
                  :alt="`主要天赋系${match.runes[0]}`"
                  class="border-border/40 h-full w-full rounded object-cover shadow-sm"
                  title="主要天赋系"
                />
                <div
                  v-else
                  class="border-border/20 bg-muted/30 h-full w-full rounded border"
                  title="主要天赋系"
                />
              </div>

              <!-- 次要天赋系 -->
              <div class="relative h-6 w-6">
                <img
                  v-if="match.runes[1]"
                  :src="gameAssets.getRuneIcon(`${match.runes[1]}`)"
                  :alt="`次要天赋系${match.runes[1]}`"
                  class="border-border/40 h-full w-full rounded object-cover shadow-sm"
                  title="次要天赋系"
                />
                <div
                  v-else
                  class="border-border/20 bg-muted/30 h-full w-full rounded border"
                  title="次要天赋系"
                />
              </div>
            </div>
          </div>

          <!-- 游戏模式和时间信息 -->
          <div class="min-w-0 flex-1">
            <div class="space-y-1">
              <h4 class="text-foreground font-semibold">
                {{ match.queueType }}
              </h4>
              <p class="text-muted-foreground text-sm">
                {{ formatDateToDay(match.createdAt as unknown as string) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：KDA -->
      <div class="text-center">
        <div>
          <div class="font-tektur-numbers text-foreground text-lg font-bold">
            {{ match.kda.kills }}/{{ match.kda.deaths }}/{{ match.kda.assists }}
          </div>
          <Badge
            variant="secondary"
            class="font-tektur-numbers text-xs font-bold"
            :class="{
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                match.kda.ratio >= 3,
              'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                match.kda.ratio >= 2 && match.kda.ratio < 3,
              'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                match.kda.ratio < 2,
            }"
          >
            {{ match.kda.ratio.toFixed(2) }} KDA
          </Badge>
        </div>
      </div>

      <!-- 金币/补刀 和 伤害/承受 -->
      <div class="grid grid-cols-2 gap-1 text-center">
        <div class="space-y-1">
          <div class="flex items-center justify-center gap-1">
            <Coins class="h-3 w-3 text-amber-500" />
            <span class="font-tektur-numbers text-sm font-semibold">
              {{ formatNumber(match.stats.gold) }}
            </span>
          </div>
          <p class="font-tektur-numbers text-foreground text-sm font-semibold">
            {{ match.stats.cs }} CS
          </p>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-center gap-1">
            <Sword class="h-3 w-3 text-red-500" />
            <span class="font-tektur-numbers text-sm font-semibold">
              {{ formatNumber(match.stats.damage) }}
            </span>
          </div>
          <div class="flex items-center justify-center gap-1">
            <Shield class="h-3 w-3 text-blue-500" />
            <span class="font-tektur-numbers text-sm font-semibold">
              {{ formatNumber(match.stats.damageTaken) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 装备 -->
      <div class="flex gap-1">
        <div
          v-for="(itemId, index) in Array.from({ length: 6 })"
          :key="index"
          class="relative h-10 w-10"
        >
          <img
            v-if="match.items[index]"
            :src="gameAssets.getItemIcon(`${match.items[index]}`)"
            :alt="`装备${match.items[index]}`"
            class="border-border/40 h-full w-full rounded-md border object-cover shadow-sm"
          />
          <div
            v-else
            class="border-border/20 bg-muted/30 h-full w-full rounded-md border"
          />
        </div>
      </div>

      <!-- 展开按钮 -->
      <span
        @click="$emit('toggle-detail')"
        class="border-border/20 bg-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border p-0"
      >
        <ChevronDown
          class="h-4 w-4 text-white transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
        />
      </span>
    </div>

    <!-- 展开的详细信息 -->
    <div v-if="isExpanded" class="bg-muted/20">
      <MatchDetailView :game-id="match.gameId" />
    </div>
  </div>
</template>
