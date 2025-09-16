<script setup lang="ts">
import { ref, computed } from 'vue';
import Loading from '@/components/Loading.vue';
import { staticAssets } from '@/assets/data-assets';
import { ChampionSummary } from '@/types/lol-game-data';
import type { AssignedPosition } from '@/types/players-info';
import type { Position } from '@/lib/service/opgg/types';

interface Props {
  champions: ChampionSummary[];
  selectedChampionIds: string[];
  searchTerm: string;
  positionFilter: AssignedPosition | 'all';
  isLoading: boolean;
  selectionType: 'ban' | 'pick';
  sortBy?: 'tier' | 'winRate'; // 外部传入的排序方式
}

interface Emits {
  (e: 'toggle-champion', champion: ChampionSummary): void;
}

// 扩展的英雄数据，包含位置信息
interface ChampionWithPosition {
  champion: ChampionSummary;
  position: Position;
  positionName: string;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 排序状态管理
type SortBy = 'tier' | 'winRate';
const internalSortBy = ref<SortBy>('tier'); // 内部排序状态

// 使用外部传入的sortBy或内部状态
const currentSortBy = computed(() => props.sortBy || internalSortBy.value);

// 切换排序方式
function setSortBy(newSortBy: SortBy) {
  internalSortBy.value = newSortBy;
}

const filteredChampions = computed(() => {
  let champions = props.champions;

  // 过滤掉末日人机
  champions = champions.filter(
    champion => !champion.name.startsWith('末日人机')
  );

  // 搜索过滤
  if (props.searchTerm) {
    const term = props.searchTerm.toLowerCase();
    champions = champions.filter(champion =>
      champion.query.toLowerCase().includes(term)
    );
  }

  // 将英雄按位置展开
  const expandedChampions: ChampionWithPosition[] = [];

  champions.forEach(champion => {
    if (champion.positions && champion.positions.length > 0) {
      champion.positions.forEach(position => {
        // 位置过滤
        if (
          props.positionFilter !== 'all' &&
          position.name.toLowerCase() !== props.positionFilter
        ) {
          return;
        }

        expandedChampions.push({
          champion,
          position,
          positionName: position.name,
        });
      });
    }
  });

  // 根据选择的排序方式排序
  return expandedChampions.sort((a, b) => {
    if (currentSortBy.value === 'tier') {
      // 按强度排序：tier越小越强（1最强），没有tier的排在最后
      const aTier = a.position.stats?.tier_data?.tier || 999;
      const bTier = b.position.stats?.tier_data?.tier || 999;
      if (aTier !== bTier) {
        return aTier - bTier;
      }
      // tier相同时，按rank排序（rank越小越强）
      const aRank = a.position.stats?.tier_data?.rank || 999;
      const bRank = b.position.stats?.tier_data?.rank || 999;
      return aRank - bRank;
    } else {
      // 按胜率排序（降序）
      const aWinRate = a.position.stats?.win_rate || 0;
      const bWinRate = b.position.stats?.win_rate || 0;
      return bWinRate - aWinRate;
    }
  });
});

// 获取段位颜色样式
function getTierColorClass(tier: number): string {
  switch (tier) {
    case 1:
      return 'bg-blue-500'; // 蓝色
    case 2:
      return 'bg-green-500'; // 绿色
    case 3:
      return 'bg-yellow-500'; // 黄色
    case 4:
      return 'bg-gray-500'; // 灰色
    case 5:
      return 'bg-amber-700'; // 褐色
    default:
      return 'bg-gray-400'; // 默认灰色
  }
}

// 获取位置中文名称
function getPositionDisplayName(positionName: string): string {
  const positionMap: Record<string, string> = {
    top: '上路',
    jungle: '打野',
    middle: '中路',
    mid: '中路',
    bottom: '下路',
    adc: '下路',
    support: '辅助',
  };
  return positionMap[positionName.toLowerCase()] || positionName;
}

// 获取位置图标
function getPositionIcon(positionName: string): string {
  const iconMap: Record<string, string> = {
    top: 'top.png',
    jungle: 'jungle.png',
    middle: 'middle.png',
    mid: 'middle.png',
    bottom: 'bottom.png',
    adc: 'bottom.png',
    support: 'bottom.png',
  };
  return `./role/${iconMap[positionName.toLowerCase()] || 'top.png'}`;
}

function handleToggleChampion(championWithPosition: ChampionWithPosition) {
  emit('toggle-champion', championWithPosition.champion);
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <!-- 加载状态 - 在可滚动区域的水平垂直中心 -->
    <div v-if="isLoading" class="flex h-full items-center justify-center">
      <div class="flex flex-col items-center text-center">
        <Loading size="lg" class="text-primary mb-4" />
        <p class="text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 英雄列表 -->
    <div v-else>
      <div class="p-3">
        <!-- 英雄数据行 -->
        <div class="font-tektur-numbers space-y-1">
          <div
            v-for="championWithPosition in filteredChampions"
            :key="`${championWithPosition.champion.id}-${championWithPosition.positionName}`"
            @click="handleToggleChampion(championWithPosition)"
            class="flex cursor-pointer items-center rounded-lg border p-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            :class="
              selectedChampionIds.includes(
                championWithPosition.champion.id.toString()
              )
                ? selectionType === 'ban'
                  ? 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border'
            "
          >
            <!-- 英雄信息和位置 -->
            <div class="flex items-center gap-3" style="width: 200px">
              <img
                :src="
                  staticAssets.getChampionIcon(championWithPosition.champion.id)
                "
                :alt="championWithPosition.champion.name"
                class="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <h3
                  class="truncate text-sm leading-tight font-medium text-gray-900 dark:text-gray-100"
                >
                  {{ championWithPosition.champion.name }}
                </h3>
                <div class="mt-1 flex items-center gap-1">
                  <img
                    :src="getPositionIcon(championWithPosition.positionName)"
                    :alt="
                      getPositionDisplayName(championWithPosition.positionName)
                    "
                    class="h-3 w-3 flex-shrink-0 opacity-70 brightness-0 dark:invert"
                  />
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{
                      getPositionDisplayName(championWithPosition.positionName)
                    }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 段位 -->
            <div class="flex-1 text-center">
              <span
                v-if="championWithPosition.position.stats?.tier_data?.tier"
                :class="`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold text-white ${getTierColorClass(championWithPosition.position.stats.tier_data.tier)}`"
              >
                T{{ championWithPosition.position.stats.tier_data.tier }}
                <span class="ml-1 text-xs opacity-75">
                  #{{
                    championWithPosition.position.stats.tier_data.rank || '-'
                  }}
                </span>
              </span>
              <span v-else class="text-xs text-gray-400">-</span>
            </div>

            <!-- 胜率 -->
            <div class="flex-1 text-center">
              <span
                v-if="championWithPosition.position.stats?.win_rate"
                class="text-sm font-medium"
                :class="{
                  'text-green-600 dark:text-green-400':
                    championWithPosition.position.stats.win_rate * 100 >= 52,
                  'text-yellow-600 dark:text-yellow-400':
                    championWithPosition.position.stats.win_rate * 100 >= 48 &&
                    championWithPosition.position.stats.win_rate * 100 < 52,
                  'text-red-600 dark:text-red-400':
                    championWithPosition.position.stats.win_rate * 100 < 48,
                }"
              >
                {{
                  (championWithPosition.position.stats.win_rate * 100).toFixed(
                    1
                  )
                }}%
              </span>
              <span v-else class="text-xs text-gray-400">-</span>
            </div>

            <!-- 选中状态 -->
            <div class="w-16 text-center">
              <div
                v-if="
                  selectedChampionIds.includes(
                    championWithPosition.champion.id.toString()
                  )
                "
                class="inline-flex h-5 w-5 items-center justify-center rounded-full"
                :class="
                  selectionType === 'ban'
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                "
              >
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="filteredChampions.length === 0"
          class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400"
        >
          <svg
            class="mb-4 h-12 w-12 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
            />
          </svg>
          <p class="text-sm">没有找到符合条件的英雄</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 列表布局样式 */
.champion-list-item {
  transition: all 0.2s ease-in-out;
}

.champion-list-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark .champion-list-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
