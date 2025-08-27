<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
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
  calculateKDA,
  collectPlayerItems,
  calculateCS,
  getPlayerRunes,
  collectAllChampionIds,
  collectAllItemIds,
} from '@/lib/match-helpers';
import { SummonerService } from '@/lib/service/summoner-service';
import { BrowserDataLoader } from '@/lib/data-loader';
import { useMatchHistoryStore } from '@/stores/match-history';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, Sword, Shield } from 'lucide-vue-next';
import { Game, Participant, Team } from '@/types/match-history-sgp';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  game: Game;
}

const props = defineProps<Props>();
const { game } = props;

// 路由和store
const router = useRouter();
const matchHistoryStore = useMatchHistoryStore();

const serverId = inject<string>('serverId');

// 创建服务实例
const summonerService = new SummonerService();
const dataLoader = new BrowserDataLoader();

// 英雄和装备名称缓存
const championNames = ref<Map<string, string>>(new Map());
const itemNames = ref<Map<string, string>>(new Map());
// 玩家段位信息缓存
const playerRanks = ref<Map<string, [string, string, number]>>(new Map());

// 计算队伍数据（直接使用原始数据，按 teamId 排序）
const teams = computed(() => {
  if (!game.json?.teams) return [];
  return [...game.json.teams].sort((a, b) => a.teamId - b.teamId);
});

// 获取队伍的参与者
const getTeamParticipants = (teamId: number): Participant[] => {
  if (!game.json?.participants) return [];
  return game.json.participants.filter(p => p.teamId === teamId);
};

// 获取队伍显示信息
const getTeamDisplayInfo = (teamId: number) => {
  return {
    name: teamId === 100 ? '蓝方' : '红方',
    color: teamId === 100 ? 'blue' : 'red',
  };
};

// 获取队伍统计数据
const getTeamStats = (team: Team) => {
  return {
    dragonKills: team.objectives?.dragon?.kills || 0,
    baronKills: team.objectives?.baron?.kills || 0,
    towerKills: team.objectives?.tower?.kills || 0,
    inhibitorKills: team.objectives?.inhibitor?.kills || 0,
  };
};

// 获取队伍禁用英雄
const getTeamBans = (team: Team) => {
  return (team.bans || [])
    .filter(ban => ban.championId && ban.championId !== -1)
    .map(ban => ({
      championId: ban.championId,
      championName:
        championNames.value.get(String(ban.championId)) ||
        `英雄${ban.championId}`,
    }));
};

// 获取玩家名称
const getPlayerName = (participant: Participant): string => {
  return participant.riotIdGameName || participant.summonerName || '未知玩家';
};

// 获取英雄名称
const getChampionName = (championId: number): string => {
  return championNames.value.get(String(championId)) || `英雄${championId}`;
};

// 获取玩家段位信息
const getPlayerRankInfo = (puuid: string): [string, string, number] => {
  return playerRanks.value.get(puuid) || ['获取中...', '', 0];
};

// 初始化数据加载
const initializeData = async () => {
  // 收集所有英雄ID和装备ID
  const allChampionIds = collectAllChampionIds(game);
  const allItemIds = collectAllItemIds(game);

  // 批量获取名称
  const [champNames, itemNamesMap] = await Promise.all([
    dataLoader.getChampionNames(Array.from(allChampionIds)),
    dataLoader.getItemNames(Array.from(allItemIds)),
  ]);

  championNames.value = champNames;
  itemNames.value = itemNamesMap;

  // 异步获取所有玩家的段位信息（不阻塞页面显示）
  loadPlayerRanks();
};

// 异步加载玩家段位信息
const loadPlayerRanks = async () => {
  console.log('🔍 正在异步获取所有玩家段位信息...');

  // 从 Game 对象的 json.participants 中获取玩家信息
  if (game.json?.participants) {
    // 使用 Promise.allSettled 并发获取所有玩家段位，避免单个失败影响其他
    const rankPromises = game.json.participants
      .filter(participant => participant.puuid)
      .map(async participant => {
        const puuid = participant.puuid;
        const playerName = getPlayerName(participant);

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
const searchPlayerHistory = async (name: string) => {
  try {
    // 使用store的搜索功能
    await matchHistoryStore.searchSummonerByName(name, serverId);

    // 搜索成功后跳转到首页
    if (router.currentRoute.value.name !== 'Home') {
      router.push('/');
    }
  } catch (error) {
    console.error('搜索玩家失败:', error);
    toast.error('搜索玩家失败，请重试');
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- 详细数据展示 -->
    <div class="space-y-6">
      <!-- 队伍对战表格 -->
      <div>
        <div v-for="team in teams" :key="team.teamId">
          <!-- 队伍标题 -->
          <div
            class="flex items-center justify-between border-b px-3 py-1 pl-4"
            :class="{
              'bg-blue-50/80 dark:bg-blue-950/30':
                getTeamDisplayInfo(team.teamId).color === 'blue',
              'bg-red-50/80 dark:bg-red-950/30':
                getTeamDisplayInfo(team.teamId).color === 'red',
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
              <div v-if="getTeamBans(team).length > 0">
                <div class="flex items-center gap-4">
                  <div class="flex gap-2">
                    <div
                      v-for="ban in getTeamBans(team)"
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
                    {{ getTeamStats(team).dragonKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">大龙</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ getTeamStats(team).baronKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">防御塔</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ getTeamStats(team).towerKills }}
                  </p>
                </div>
                <div>
                  <p class="text-muted-foreground text-xs">水晶</p>
                  <p
                    class="font-tektur-numbers text-foreground text-lg font-bold"
                  >
                    {{ getTeamStats(team).inhibitorKills }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 玩家数据表格 -->
          <div
            :class="{
              'bg-blue-50/80 dark:bg-blue-950/30':
                getTeamDisplayInfo(team.teamId).color === 'blue',
              'bg-red-50/80 dark:bg-red-950/30':
                getTeamDisplayInfo(team.teamId).color === 'red',
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
              v-for="participant in getTeamParticipants(team.teamId)"
              :key="participant.participantId"
              class="hover:bg-muted/70 border-border/50 grid grid-cols-[2.5fr_1fr_1fr_1fr_2.5fr] gap-1 border-b px-2 py-0.5 pl-4 transition-colors last:border-b-0"
            >
              <!-- 玩家信息 -->
              <div>
                <div class="flex items-center gap-3">
                  <!-- 英雄头像 + 等级 -->
                  <div class="relative flex-shrink-0">
                    <img
                      :src="
                        staticAssets.getChampionIcon(
                          `${participant.championId}`
                        )
                      "
                      :alt="getChampionName(participant.championId)"
                      class="ring-border/30 h-12 w-12 rounded-lg object-cover ring-2"
                    />
                    <!-- 等级显示在头像右下角 -->
                    <div
                      class="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white dark:ring-gray-800"
                    >
                      <span class="font-tektur-numbers text-xs font-bold">
                        {{ participant.champLevel || 0 }}
                      </span>
                    </div>
                  </div>

                  <!-- 召唤师技能 + 天赋 -->
                  <div class="flex flex-shrink-0 items-center gap-2">
                    <!-- 召唤师技能 -->
                    <div class="flex flex-col gap-1">
                      <img
                        :src="
                          staticAssets.getSpellIcon(`${participant.spell1Id}`)
                        "
                        :alt="`召唤师技能${participant.spell1Id}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                      />
                      <img
                        :src="
                          staticAssets.getSpellIcon(`${participant.spell2Id}`)
                        "
                        :alt="`召唤师技能${participant.spell2Id}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                      />
                    </div>

                    <!-- 天赋系 -->
                    <div class="flex flex-col gap-1">
                      <img
                        v-if="getPlayerRunes(participant)[0]"
                        :src="
                          staticAssets.getRuneIcon(
                            `${getPlayerRunes(participant)[0]}`
                          )
                        "
                        :alt="`主要天赋系${getPlayerRunes(participant)[0]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                        title="主要天赋系"
                      />
                      <img
                        v-if="getPlayerRunes(participant)[1]"
                        :src="
                          staticAssets.getRuneIcon(
                            `${getPlayerRunes(participant)[1]}`
                          )
                        "
                        :alt="`次要天赋系${getPlayerRunes(participant)[1]}`"
                        class="border-border/40 h-6 w-6 rounded object-cover shadow-sm"
                        title="次要天赋系"
                      />
                    </div>
                  </div>

                  <!-- 玩家名称和英雄名称 -->
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <button
                        @click="
                          searchPlayerHistory(
                            `${participant.riotIdGameName}#${participant.riotIdTagline}`
                          )
                        "
                        class="text-foreground hover:text-primary cursor-pointer truncate font-medium transition-colors hover:underline"
                        :disabled="
                          getPlayerName(participant) === '未知玩家' ||
                          matchHistoryStore.isSearching
                        "
                        :title="
                          getPlayerName(participant) === '未知玩家'
                            ? '无法查询该玩家'
                            : `点击查询 ${getPlayerName(participant)} 的战绩`
                        "
                      >
                        {{ getPlayerName(participant) }}
                      </button>
                      <button
                        v-if="getPlayerName(participant) !== '未知玩家'"
                        @click="copyPlayerName(getPlayerName(participant))"
                        class="text-muted-foreground hover:text-foreground flex-shrink-0 rounded p-1 transition-colors"
                        title="复制玩家名称"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    </div>
                    <p class="text-muted-foreground truncate text-xs">
                      {{ getChampionName(participant.championId) }}
                    </p>
                    <!-- 段位信息 -->
                    <div class="flex items-center gap-1">
                      <!-- 段位图标 -->
                      <img
                        v-if="
                          getPlayerRankInfo(participant.puuid) &&
                          !getPlayerRankInfo(participant.puuid)[0].includes(
                            '未定级'
                          ) &&
                          !getPlayerRankInfo(participant.puuid)[0].includes(
                            '获取失败'
                          ) &&
                          !getPlayerRankInfo(participant.puuid)[0].includes(
                            '加载中'
                          )
                        "
                        :src="
                          getRankMiniImageUrl(
                            getPlayerRankInfo(participant.puuid)[0] || ''
                          )
                        "
                        :alt="`段位图标 ${getPlayerRankInfo(participant.puuid)[0]}`"
                        class="h-4 w-4 object-contain"
                      />
                      <!-- 加载中的小图标 -->
                      <Loader2
                        v-else-if="
                          getPlayerRankInfo(participant.puuid) &&
                          getPlayerRankInfo(participant.puuid)[0].includes(
                            '加载中'
                          )
                        "
                        class="text-muted-foreground h-3 w-3 animate-spin"
                      />
                      <span
                        class="font-tektur-numbers text-muted-foreground text-xs"
                        :class="{
                          'text-muted-foreground/60':
                            getPlayerRankInfo(participant.puuid) &&
                            getPlayerRankInfo(participant.puuid)[0].includes(
                              '加载中'
                            ),
                        }"
                      >
                        <template
                          v-if="
                            getPlayerRankInfo(participant.puuid) &&
                            getPlayerRankInfo(participant.puuid)[0].includes(
                              '加载中'
                            )
                          "
                        >
                          加载中...
                        </template>
                        <template v-else>
                          {{
                            getTierName(getPlayerRankInfo(participant.puuid)[0])
                          }}
                          {{ getPlayerRankInfo(participant.puuid)[1] }}
                          {{ getPlayerRankInfo(participant.puuid)[2] }}LP
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
                    {{ participant.kills || 0 }}/{{
                      participant.deaths || 0
                    }}/{{ participant.assists || 0 }}
                  </p>
                  <Badge
                    variant="secondary"
                    class="font-tektur-numbers text-xs"
                    :class="{
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400':
                        calculateKDA(
                          participant.kills || 0,
                          participant.deaths || 0,
                          participant.assists || 0
                        ).ratio >= 3,
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400':
                        calculateKDA(
                          participant.kills || 0,
                          participant.deaths || 0,
                          participant.assists || 0
                        ).ratio >= 2 &&
                        calculateKDA(
                          participant.kills || 0,
                          participant.deaths || 0,
                          participant.assists || 0
                        ).ratio < 3,
                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400':
                        calculateKDA(
                          participant.kills || 0,
                          participant.deaths || 0,
                          participant.assists || 0
                        ).ratio < 1,
                    }"
                  >
                    {{
                      calculateKDA(
                        participant.kills || 0,
                        participant.deaths || 0,
                        participant.assists || 0
                      ).ratio.toFixed(1)
                    }}
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
                      {{ formatNumber(participant.goldEarned || 0) }}
                    </span>
                  </div>
                  <p class="font-tektur-numbers text-muted-foreground text-xs">
                    {{ calculateCS(participant) }} CS
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
                      {{
                        formatNumber(
                          participant.totalDamageDealtToChampions || 0
                        )
                      }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Shield class="h-3 w-3 text-blue-500" />
                    <span
                      class="font-tektur-numbers text-muted-foreground text-xs"
                    >
                      {{ formatNumber(participant.totalDamageTaken || 0) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 装备 -->
              <div class="flex items-center justify-center">
                <div class="flex flex-wrap gap-1">
                  <div
                    v-for="itemId in collectPlayerItems(participant)"
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
