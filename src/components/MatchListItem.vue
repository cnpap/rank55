<script setup lang="ts">
import type { ProcessedMatch } from '@/types/match-history-ui';
import { formatNumber } from '@/lib/rank-helpers';
import { formatDateToDay } from '@/utils/date-utils';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Coins, Sword, Shield } from 'lucide-vue-next';
import MatchDetailView from './MatchDetailView.vue';
import { staticAssets } from '@/assets/data-assets';

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
    <div class="space-y-3 px-2 py-0.5">
      <!-- 第一行：当前玩家信息 + 游戏基本信息 -->
      <div class="flex items-center justify-between">
        <!-- KDA + 统计 + 装备 + 玩家列表 -->
        <div class="flex w-full items-center gap-4">
          <!-- KDA + 统计数据 + 装备 (分四行显示) -->
          <div class="flex flex-1 items-center justify-between">
            <div class="flex flex-col gap-1">
              <!-- 前三行：左右两个容器的布局 -->
              <div class="flex items-start justify-between gap-6">
                <!-- 左侧容器：英雄信息 + 游戏模式时间 (2行) -->
                <div class="flex flex-col gap-1">
                  <!-- 第一行：英雄头像 + 召唤师技能 -->
                  <div class="flex items-start gap-2">
                    <!-- 英雄头像 + 等级 -->
                    <div class="relative flex-shrink-0">
                      <img
                        :src="
                          staticAssets.getChampionIcon(`${match.championId}`)
                        "
                        :alt="match.championName"
                        class="ring-border/30 h-12 w-12 rounded object-cover ring-2"
                      />
                      <div
                        class="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-gray-800"
                      >
                        <span class="font-tektur-numbers text-xs font-bold">
                          {{ match.stats.level }}
                        </span>
                      </div>
                    </div>

                    <!-- 召唤师技能 + 天赋 -->
                    <div class="flex items-start gap-1">
                      <!-- 召唤师技能 -->
                      <div class="flex flex-col gap-1">
                        <img
                          :src="staticAssets.getSpellIcon(`${match.spells[0]}`)"
                          :alt="`召唤师技能${match.spells[0]}`"
                          class="border-border/40 h-5 w-5 rounded object-cover shadow-sm"
                        />
                        <img
                          :src="staticAssets.getSpellIcon(`${match.spells[1]}`)"
                          :alt="`召唤师技能${match.spells[1]}`"
                          class="border-border/40 h-5 w-5 rounded object-cover shadow-sm"
                        />
                      </div>

                      <!-- 天赋系 -->
                      <div class="flex flex-col gap-1">
                        <div class="relative h-5 w-5">
                          <img
                            v-if="match.runes[0]"
                            :src="staticAssets.getRuneIcon(`${match.runes[0]}`)"
                            :alt="`主要天赋系${match.runes[0]}`"
                            class="border-border/40 h-full w-full rounded object-cover shadow-sm"
                          />
                          <div
                            v-else
                            class="border-border/20 bg-muted/30 h-full w-full rounded border"
                          />
                        </div>
                        <div class="relative h-5 w-5">
                          <img
                            v-if="match.runes[1]"
                            :src="staticAssets.getRuneIcon(`${match.runes[1]}`)"
                            :alt="`次要天赋系${match.runes[1]}`"
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

                  <!-- 第二行：游戏模式和时间 -->
                  <div class="text-left">
                    <h4 class="text-foreground text-sm font-semibold">
                      {{ match.queueType }}
                    </h4>
                    <p class="text-muted-foreground text-xs">
                      {{
                        formatDateToDay(match.createdAt as unknown as string)
                      }}
                    </p>
                  </div>
                </div>

                <!-- 右侧容器：KDA + 经济 + 伤害 (3行) -->
                <div class="flex flex-col gap-1">
                  <!-- 第一行：KDA -->
                  <div class="text-right">
                    <div class="font-tektur-numbers text-foreground font-bold">
                      {{ match.kda.kills }}/{{ match.kda.deaths }}/{{
                        match.kda.assists
                      }}
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
                      {{ match.kda.ratio.toFixed(2) }}
                    </Badge>
                  </div>

                  <!-- 第二行：经济 -->
                  <div class="flex items-center justify-end gap-1 text-xs">
                    <Coins class="h-3 w-3 text-amber-500" />
                    <span class="font-tektur-numbers font-semibold">
                      {{ formatNumber(match.stats.gold) }}
                    </span>
                    <span class="font-tektur-numbers ml-2 font-semibold">
                      {{ match.stats.cs }} CS
                    </span>
                  </div>

                  <!-- 第三行：伤害 -->
                  <div class="flex items-center justify-end gap-3 text-xs">
                    <div class="flex items-center gap-1">
                      <Sword class="h-3 w-3 text-red-500" />
                      <span class="font-tektur-numbers font-semibold">
                        {{ formatNumber(match.stats.damage) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Shield class="h-3 w-3 text-blue-500" />
                      <span class="font-tektur-numbers font-semibold">
                        {{ formatNumber(match.stats.damageTaken) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 第四行：装备 (最下面一行) -->
              <div class="flex gap-1">
                <div
                  v-for="(itemId, index) in Array.from({ length: 6 })"
                  :key="index"
                  class="relative h-9 w-9"
                >
                  <img
                    v-if="match.items[index]"
                    :src="staticAssets.getItemIcon(`${match.items[index]}`)"
                    :alt="`装备${match.items[index]}`"
                    class="border-border/40 h-full w-full rounded border object-cover shadow-sm"
                  />
                  <div
                    v-else
                    class="border-border/20 bg-muted/30 h-full w-full rounded border"
                  />
                </div>
              </div>
            </div>

            <!-- 玩家列表 -->
            <div class="font-tektur-numbers flex gap-1">
              <!-- 蓝色方 -->
              <div class="w-28">
                <div class="space-y-0.5">
                  <div
                    v-for="player in match.teams[0]?.players || []"
                    :key="player.puuid"
                    class="flex items-center gap-1 rounded px-1 py-0.5"
                    :class="{
                      'bg-blue-100 dark:bg-blue-900/40': player.isCurrentPlayer,
                    }"
                  >
                    <img
                      :src="
                        staticAssets.getChampionIcon(`${player.championId}`)
                      "
                      :alt="player.championName"
                      class="h-4 w-4 flex-shrink-0 rounded object-cover"
                    />
                    <div
                      class="hover:text-primary w-30 cursor-pointer truncate text-sm font-medium"
                      :title="player.displayName"
                    >
                      {{ player.displayName }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 蓝色方KDA -->
              <div class="w-16">
                <div class="space-y-0.5">
                  <div
                    v-for="player in match.teams[0]?.players || []"
                    :key="`${player.puuid}-kda`"
                    class="flex h-6 items-center justify-center rounded px-1 py-0.5"
                    :class="{
                      'bg-blue-100 dark:bg-blue-900/40': player.isCurrentPlayer,
                    }"
                  >
                    <span class="text-center text-xs font-medium">
                      {{ player.kda.kills }}/{{ player.kda.deaths }}/{{
                        player.kda.assists
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 红色方 -->
              <div class="w-28">
                <div class="space-y-0.5">
                  <div
                    v-for="player in match.teams[1]?.players || []"
                    :key="player.puuid"
                    class="flex items-center gap-1 rounded px-1 py-0.5"
                    :class="{
                      'bg-red-100 dark:bg-red-900/40': player.isCurrentPlayer,
                    }"
                  >
                    <img
                      :src="
                        staticAssets.getChampionIcon(`${player.championId}`)
                      "
                      :alt="player.championName"
                      class="h-4 w-4 flex-shrink-0 rounded object-cover"
                    />
                    <div
                      class="hover:text-primary w-30 cursor-pointer truncate text-sm font-medium"
                      :title="player.displayName"
                    >
                      {{ player.displayName }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 红色方KDA -->
              <div class="w-16">
                <div class="space-y-0.5">
                  <div
                    v-for="player in match.teams[1]?.players || []"
                    :key="`${player.puuid}-kda`"
                    class="flex h-6 items-center justify-center rounded px-1 py-0.5"
                    :class="{
                      'bg-red-100 dark:bg-red-900/40': player.isCurrentPlayer,
                    }"
                  >
                    <span class="text-center text-xs font-medium">
                      {{ player.kda.kills }}/{{ player.kda.deaths }}/{{
                        player.kda.assists
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 展开按钮 -->
          <button
            @click="$emit('toggle-detail')"
            class="border-border/20 bg-primary hover:bg-primary/90 flex h-8 w-8 cursor-pointer items-center justify-center rounded border p-0 transition-colors"
          >
            <ChevronDown
              class="h-4 w-4 text-white transition-transform duration-200"
              :class="{ 'rotate-180': isExpanded }"
            />
          </button>
        </div>
      </div>

      <!-- 移除原来的第二行玩家列表 -->
      <!-- 第二行：所有玩家列表 -->
      <!-- 这部分代码已删除 -->
    </div>

    <!-- 展开的详细信息 -->
    <div v-if="isExpanded" class="bg-muted/20">
      <MatchDetailView :game-id="match.gameId" />
    </div>
  </div>
</template>
