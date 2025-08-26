<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Copy } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
  formatNumber,
  getRankMiniImageUrl,
  getTierName,
} from '@/lib/rank-helpers';
import { copyToClipboard } from '@/lib/player-helpers';
import {
  processMatchDetail,
  collectAllChampionIds,
  collectAllItemIds,
  type ProcessedTeam,
} from '@/lib/match-helpers';
import { SummonerService } from '@/lib/service/summoner-service';
import { BrowserDataLoader } from '@/lib/data-loader';
import { useMatchHistoryStore } from '@/stores/match-history';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Skull, Coins, Sword, Shield } from 'lucide-vue-next';
import { Game } from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  game: Game;
}

const props = defineProps<Props>();

// 路由和store
const router = useRouter();
const matchHistoryStore = useMatchHistoryStore();

// 详细比赛数据
const matchDetail = ref<Game | null>(props.game);
const isLoading = ref(false);
const error = ref<string | null>(null);

// 创建服务实例
const summonerService = new SummonerService();
const dataLoader = new BrowserDataLoader();

// 英雄和装备名称缓存
const championNames = ref<Map<string, string>>(new Map());
const itemNames = ref<Map<string, string>>(new Map());
// 玩家段位信息缓存
const playerRanks = ref<Map<string, [string, string, number]>>(new Map());

// 计算处理后的队伍数据
const processedTeams = computed((): ProcessedTeam[] => {
  if (!matchDetail.value) return [];

  return processMatchDetail(
    matchDetail.value,
    championNames.value,
    playerRanks.value
  );
});

// 初始化数据加载
const initializeData = async () => {
  if (isLoading.value || !matchDetail.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    // 收集所有英雄ID和装备ID
    const allChampionIds = collectAllChampionIds(matchDetail.value);
    const allItemIds = collectAllItemIds(matchDetail.value);

    // 批量获取名称
    const [champNames, itemNamesMap] = await Promise.all([
      dataLoader.getChampionNames(Array.from(allChampionIds)),
      dataLoader.getItemNames(Array.from(allItemIds)),
    ]);

    championNames.value = champNames;
    itemNames.value = itemNamesMap;

    // 先设置加载完成状态，让页面显示基本信息
    isLoading.value = false;

    // 异步获取所有玩家的段位信息（不阻塞页面显示）
    loadPlayerRanks(matchDetail.value);
  } catch (err: any) {
    console.error('初始化数据失败:', err);
    error.value = err.message || '初始化数据失败';
    isLoading.value = false;
  }
};

// 异步加载玩家段位信息
const loadPlayerRanks = async (detail: Game) => {
  console.log('🔍 正在异步获取所有玩家段位信息...');

  // 从 Game 对象的 json.participants 中获取玩家信息
  if (detail.json?.participants) {
    // 使用 Promise.allSettled 并发获取所有玩家段位，避免单个失败影响其他
    const rankPromises = detail.json.participants
      .filter(participant => participant.puuid)
      .map(async participant => {
        const puuid = participant.puuid;
        const playerName =
          participant.summonerName || participant.riotIdGameName || '未知玩家';

        try {
          const rankInfo = await summonerService.getPlayerRankedInfo(puuid);
          playerRanks.value.set(puuid, rankInfo);
          console.log(`✅ 获取玩家 ${playerName} 段位成功`);
        } catch (error) {
          console.log(`⚠️ 获取玩家 ${playerName} 段位失败: ${error}`);
          playerRanks.value.set(puuid, ['段位获取失败', '', 0]);
        }
      });

    // 等待所有段位信息获取完成
    await Promise.allSettled(rankPromises);
    console.log('🎉 所有玩家段位信息获取完成');
  }
};

// 组件挂载时初始化数据
onMounted(() => {
  initializeData();
});

// 复制玩家名称到剪贴板
const copyPlayerName = async (playerName: string) => {
  await copyToClipboard(playerName, '玩家名称已复制到剪贴板');
};

// 搜索玩家战绩
const searchPlayerHistory = async (playerName: string) => {
  if (!playerName || playerName === '未知玩家') {
    toast.error('无法查询该玩家的战绩');
    return;
  }

  try {
    // 使用store的搜索功能
    await matchHistoryStore.searchSummonerByName(playerName);

    // 搜索成功后跳转到首页
    if (router.currentRoute.value.name !== 'Home') {
      router.push('/');
    }

    toast.success(`正在查询 ${playerName} 的战绩`);
  } catch (error) {
    console.error('搜索玩家失败:', error);
    toast.error('搜索玩家失败，请重试');
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-muted-foreground flex items-center gap-3">
        <Loader2 class="h-5 w-5 animate-spin" />
        <span class="text-sm font-medium">加载详细数据中...</span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center py-12">
      <Card class="w-full max-w-md">
        <CardContent class="pt-6 text-center">
          <div class="text-destructive mb-4">
            <Skull class="mx-auto h-8 w-8" />
          </div>
          <p class="text-destructive mb-4 text-sm">{{ error }}</p>
          <button
            @click="initializeData"
            class="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            点击重试
          </button>
        </CardContent>
      </Card>
    </div>

    <!-- 详细数据展示 -->
    <div v-else-if="matchDetail && processedTeams.length > 0" class="space-y-6">
      <!-- 队伍对战表格 -->
      <div>
        <div v-for="team in processedTeams" :key="team.teamId">
          <!-- 队伍标题 -->
          <div
            class="flex items-center justify-between border-b px-3 py-1 pl-4"
            :class="{
              'bg-blue-50/80 dark:bg-blue-950/30': team.teamColor === 'blue',
              'bg-red-50/80 dark:bg-red-950/30': team.teamColor === 'red',
            }"
          >
            <div class="flex items-center gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <h4
                    :class="{
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                        team.win,
                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                        !team.win,
                    }"
                    class="text-md px-2 py-1 font-medium"
                  >
                    {{ team.win ? '胜利' : '失败' }}
                  </h4>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- 禁用英雄 -->
              <div v-if="team.bans.length > 0">
                <div class="flex items-center gap-4">
                  <div class="flex gap-2">
                    <div
                      v-for="ban in team.bans"
                      :key="ban.championId"
                      class="relative"
                    >
                      <img
                        :src="staticAssets.getChampionIcon(`${ban.championId}`)"
                        :alt="ban.championName"
                        :title="ban.championName"
                        class="h-10 w-10 rounded object-cover opacity-60 grayscale"
                      />
                      <div
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <div
                          class="flex h-4 w-4 items-center justify-center rounded-full bg-red-500/80 text-white"
                        >
                          <span class="text-xs font-bold">×</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 队伍统计 -->
              <div class="grid grid-cols-4 gap-1 text-center">
                <div>
                  <p class="text-muted-foreground text-xs">小龙</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ team.teamStats.dragonKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">大龙</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ team.teamStats.baronKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">防御塔</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ team.teamStats.towerKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">水晶</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ team.teamStats.inhibitorKills }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 玩家数据表格 -->
          <div
            :class="{
              'bg-blue-50/80 dark:bg-blue-950/30': team.teamColor === 'blue',
              'bg-red-50/80 dark:bg-red-950/30': team.teamColor === 'red',
            }"
            class="overflow-x-auto"
          >
            <!-- 表头 -->
            <div
              class="bg-muted/30 text-muted-foreground border-border grid grid-cols-[2.5fr_1fr_1fr_1fr_2.5fr] gap-1 border-b px-2 py-1 pl-4 text-sm font-medium"
            >
              <div>玩家</div>
              <div class="text-center">KDA</div>
              <div class="text-center">金币/补刀</div>
              <div class="text-center">伤害/承受</div>
              <div class="text-center">装备</div>
            </div>

            <!-- 玩家数据行 -->
            <div
              v-for="player in team.players"
              :key="player.participantId"
              class="hover:bg-muted/70 border-border/50 grid grid-cols-[2.5fr_1fr_1fr_1fr_2.5fr] gap-1 border-b px-2 py-0.5 pl-4 transition-colors last:border-b-0"
            >
              <!-- 玩家信息 -->
              <div>
                <div class="flex items-center gap-3">
                  <!-- 英雄头像 + 等级 -->
                  <div class="relative flex-shrink-0">
                    <img
                      :src="
                        staticAssets.getChampionIcon(`${player.championId}`)
                      "
                      :alt="player.championName"
                      class="ring-border/30 h-12 w-12 rounded-lg object-cover ring-2"
                    />
                    <!-- 等级显示在头像右下角 -->
                    <div
                      class="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-gray-800"
                    >
                      <span class="font-tektur-numbers text-xs font-bold">
                        {{ player.stats.level }}
                      </span>
                    </div>
                  </div>

                  <!-- 召唤师技能 + 天赋 -->
                  <div class="flex flex-shrink-0 items-center gap-2">
                    <!-- 召唤师技能 -->
                    <div class="flex flex-col gap-1">
                      <img
                        :src="staticAssets.getSpellIcon(`${player.spells[0]}`)"
                        :alt="`召唤师技能${player.spells[0]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                      />
                      <img
                        :src="staticAssets.getSpellIcon(`${player.spells[1]}`)"
                        :alt="`召唤师技能${player.spells[1]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                      />
                    </div>

                    <!-- 天赋系 -->
                    <div class="flex flex-col gap-1">
                      <img
                        v-if="player.runes[0]"
                        :src="staticAssets.getRuneIcon(`${player.runes[0]}`)"
                        :alt="`主要天赋系${player.runes[0]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                        title="主要天赋系"
                      />
                      <img
                        v-if="player.runes[1]"
                        :src="staticAssets.getRuneIcon(`${player.runes[1]}`)"
                        :alt="`次要天赋系${player.runes[1]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                        title="次要天赋系"
                      />
                    </div>
                  </div>

                  <!-- 玩家名称和英雄名称 -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <button
                        @click="searchPlayerHistory(player.playerName)"
                        class="text-foreground hover:text-primary cursor-pointer truncate font-medium transition-colors hover:underline"
                        :disabled="
                          player.playerName === '未知玩家' ||
                          matchHistoryStore.isSearching
                        "
                        :title="
                          player.playerName === '未知玩家'
                            ? '无法查询该玩家'
                            : `点击查询 ${player.playerName} 的战绩`
                        "
                      >
                        {{ player.playerName }}
                      </button>
                      <button
                        v-if="player.playerName !== '未知玩家'"
                        @click="copyPlayerName(player.playerName)"
                        class="text-muted-foreground hover:text-foreground flex-shrink-0 rounded p-1 transition-colors"
                        title="复制玩家名称"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    </div>
                    <p class="text-muted-foreground truncate text-xs">
                      {{ player.championName }}
                    </p>
                    <!-- 段位信息 -->
                    <div class="flex items-center gap-1">
                      <!-- 段位图标 -->
                      <img
                        v-if="
                          player.rankInfo &&
                          !player.rankInfo[0].includes('未定级') &&
                          !player.rankInfo[0].includes('获取失败') &&
                          !player.rankInfo[0].includes('加载中')
                        "
                        :src="getRankMiniImageUrl(player.rankInfo[0] || '')"
                        :alt="`段位图标 ${player.rankInfo[0]}`"
                        class="h-4 w-4 object-contain"
                      />
                      <!-- 加载中的小图标 -->
                      <Loader2
                        v-else-if="
                          player.rankInfo &&
                          player.rankInfo[0].includes('加载中')
                        "
                        class="text-muted-foreground h-3 w-3 animate-spin"
                      />
                      <span
                        class="font-tektur-numbers text-muted-foreground text-xs"
                        :class="{
                          'text-muted-foreground/60':
                            player.rankInfo &&
                            player.rankInfo[0].includes('加载中'),
                        }"
                      >
                        <template
                          v-if="
                            player.rankInfo &&
                            player.rankInfo[0].includes('加载中')
                          "
                        >
                          加载中...
                        </template>
                        <template v-else>
                          {{ getTierName(player.rankInfo[0]) }}
                          {{ player.rankInfo[1] }}
                          {{ player.rankInfo[2] }}LP
                        </template>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KDA -->
              <div
                class="flex flex-col items-center justify-center text-center"
              >
                <div class="space-y-1">
                  <p class="font-tektur-numbers text-sm font-medium">
                    {{ player.kda.kills }}/{{ player.kda.deaths }}/{{
                      player.kda.assists
                    }}
                  </p>
                  <Badge
                    variant="secondary"
                    class="font-tektur-numbers text-xs"
                    :class="{
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                        player.kda.ratio >= 3,
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                        player.kda.ratio >= 2 && player.kda.ratio < 3,
                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                        player.kda.ratio < 1,
                    }"
                  >
                    {{ player.kda.ratio.toFixed(1) }}
                  </Badge>
                </div>
              </div>

              <!-- 金币/补刀 -->
              <div
                class="flex flex-col items-center justify-center text-center"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <Coins class="h-3 w-3 text-yellow-500" />
                    <span class="font-tektur-numbers text-xs">
                      {{ formatNumber(player.stats.gold) }}
                    </span>
                  </div>
                  <p class="font-tektur-numbers text-muted-foreground text-xs">
                    {{ player.stats.cs }} CS
                  </p>
                </div>
              </div>

              <!-- 伤害/承受 -->
              <div
                class="flex flex-col items-center justify-center text-center"
              >
                <div class="space-y-1">
                  <div class="flex items-center gap-1">
                    <Sword class="h-3 w-3 text-red-500" />
                    <span class="font-tektur-numbers text-xs">
                      {{ formatNumber(player.stats.damage) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Shield class="h-3 w-3 text-blue-500" />
                    <span
                      class="font-tektur-numbers text-muted-foreground text-xs"
                    >
                      {{ formatNumber(player.stats.damageTaken) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 装备 -->
              <div class="flex items-center justify-center">
                <div class="flex flex-wrap gap-1">
                  <div
                    v-for="itemId in player.stats.items"
                    :key="itemId"
                    class="relative"
                  >
                    <img
                      :src="staticAssets.getItemIcon(`${itemId}`)"
                      :alt="itemNames.get(String(itemId)) || `装备${itemId}`"
                      :title="itemNames.get(String(itemId)) || `装备${itemId}`"
                      class="border-border/40 h-8 w-8 rounded object-cover shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
