<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import type { Champion, ChampionData } from '@/types/champion';
import type { ChampionCnData } from '@/types/champion-cn';
import { $local } from '@/storages/storage-use';
import ChampionSkills from './ChampionSkills.vue';
import ChampionEquipment from './ChampionEquipment.vue';
import ChampionInfo from './ChampionInfo.vue';
import ChampionLevelManager from './ChampionLevelManager.vue';
import ChampionFilter from './ChampionFilter.vue';
import ChampionStats from './ChampionStats.vue';
import { dataUtils } from '@/assets/versioned-assets';
import { staticAssets } from '@/assets/data-assets';

// 组件状态
const state = reactive({
  champions: [] as ChampionData[],
  isLoading: false,
  loadStatus: '等待加载英雄数据...',
});

// 过滤状态
const filterState = reactive({
  searchTerm: '',
  sortBy: 'name-asc',
  selectedTags: [] as string[],
});

// 过滤后的英雄列表
const filteredChampions = ref<ChampionData[]>([]);

// 侧边栏状态
const sidebarState = reactive({
  isOpen: false,
  selectedChampion: null as ChampionData | null,
  championDetails: {} as Record<string, ChampionCnData>,
});

// 英雄状态管理 - 简化版本，主要逻辑移到ChampionLevelManager
const championEquipment = ref<Record<string, (string | null)[]>>({});
const favoriteChampions = ref<string[]>([]);
const championAbilityHaste = ref<Record<string, number>>({});

// 最近查看的英雄
const recentlyViewedChampions = ref<ChampionData[]>([]);

// 升级管理器引用
const levelManagerRef = ref<InstanceType<typeof ChampionLevelManager> | null>(
  null
);

// 加载英雄数据
async function loadChampionData() {
  state.isLoading = true;
  state.loadStatus = '正在加载英雄数据...';
  try {
    const championData: Champion = await dataUtils.fetchChampionData();
    state.champions = Object.values(championData.data);
    state.loadStatus = `数据加载完成！共 ${state.champions.length} 个英雄`;
    toast.success('英雄数据加载成功！');
  } catch (error) {
    console.error('加载英雄数据失败:', error);
    state.loadStatus = '数据加载失败: ' + (error as Error).message;
    toast.error('英雄数据加载失败');
  } finally {
    state.isLoading = false;
  }
}

// 处理过滤结果
function handleFilteredChampions(champions: ChampionData[]) {
  filteredChampions.value = champions;
}

// 点击英雄图标，打开侧边栏
async function selectChampion(champion: ChampionData) {
  sidebarState.selectedChampion = champion;
  sidebarState.isOpen = true;

  // 更新最近查看的英雄列表
  updateRecentlyViewed(champion);

  // 初始化英雄状态
  initChampionLevel(champion.id);

  // 加载英雄详细信息（如果还没有加载）
  if (!sidebarState.championDetails[champion.id]) {
    try {
      // 使用新的国区数据接口
      const detail = await dataUtils.fetchChampionCnData(champion.key);
      sidebarState.championDetails[champion.id] = detail;
    } catch (error) {
      console.error('加载英雄详细信息失败:', error);
    }
  }
}

// 更新最近查看的英雄
function updateRecentlyViewed(champion: ChampionData) {
  // 移除已存在的相同英雄
  const filtered = recentlyViewedChampions.value.filter(
    c => c.id !== champion.id
  );
  // 添加到开头
  recentlyViewedChampions.value = [champion, ...filtered].slice(0, 4);
  // 保存到本地存储
  $local.setItem(
    'recentlyViewedChampions',
    recentlyViewedChampions.value.map(c => c.id)
  );
}

// 加载最近查看的英雄
function loadRecentlyViewed() {
  const savedIds = $local.getItem('recentlyViewedChampions') || [];
  recentlyViewedChampions.value = savedIds
    .map((id: string) => state.champions.find(c => c.id === id))
    .filter(Boolean)
    .slice(0, 4) as ChampionData[];
}

// 关闭侧边栏
function closeSidebar() {
  sidebarState.isOpen = false;
  sidebarState.selectedChampion = null;
}

// 获取英雄图标URL
function getChampionImageUrl(championKey: string): string {
  return staticAssets.getChampionIcon(championKey);
}

// 英雄状态管理函数
function initChampionLevel(championId: string) {
  if (!(championId in championEquipment.value)) {
    championEquipment.value[championId] = Array(6).fill(null);
  }
  if (!(championId in championAbilityHaste.value)) {
    championAbilityHaste.value[championId] = 0;
  }
  // 调用升级管理器的初始化
  levelManagerRef.value?.initChampionLevel(championId);
}

// 升级相关的事件处理函数
function handleLevelChanged(championId: string, newLevel: number) {
  // 可以在这里添加额外的逻辑，比如更新UI或触发其他事件
  console.log(`Champion ${championId} level changed to ${newLevel}`);
}

function handleSkillLevelChanged(championId: string, skillLevels: number[]) {
  // 可以在这里添加额外的逻辑
  console.log(`Champion ${championId} skill levels changed:`, skillLevels);
}

// 装备更新函数
function updateEquipment(
  championId: string,
  slotIndex: number,
  itemId: string | null
) {
  if (!championEquipment.value[championId]) {
    championEquipment.value[championId] = Array(6).fill(null);
  }
  championEquipment.value[championId][slotIndex] = itemId;
}

// 收藏相关函数
function loadFavorites() {
  const saved = $local.getItem('favoriteChampions');
  favoriteChampions.value = saved || [];
}

function saveFavorites() {
  $local.setItem('favoriteChampions', favoriteChampions.value);
}

function toggleFavorite(championId: string) {
  const index = favoriteChampions.value.indexOf(championId);
  if (index > -1) {
    favoriteChampions.value.splice(index, 1);
  } else {
    favoriteChampions.value.push(championId);
  }
  saveFavorites();
}

function isFavorite(championId: string): boolean {
  return favoriteChampions.value.includes(championId);
}

onMounted(() => {
  loadChampionData().then(() => {
    loadRecentlyViewed();
  });
  loadFavorites();
});
</script>

<template>
  <div>
    <!-- 主内容区域 -->
    <div class="space-y-6">
      <!-- 使用过滤组件 -->
      <ChampionFilter
        :champions="state.champions"
        v-model:search-term="filterState.searchTerm"
        v-model:sort-by="filterState.sortBy"
        v-model:selected-tags="filterState.selectedTags"
        @filtered-champions="handleFilteredChampions"
      />

      <!-- 加载状态 -->
      <div
        v-if="state.isLoading"
        class="border-border bg-card rounded-lg border p-8 text-center"
      >
        <p class="text-muted-foreground">{{ state.loadStatus }}</p>
      </div>

      <!-- 英雄图标网格布局 - 参考装备样式 -->
      <div v-else-if="filteredChampions.length > 0">
        <div class="mb-4 flex items-center justify-between">
          <span class="text-muted-foreground text-sm">
            共 {{ filteredChampions.length }} 个英雄
          </span>
        </div>
        <div
          class="grid grid-cols-8 gap-4 sm:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16"
        >
          <div
            v-for="champion in filteredChampions"
            :key="champion.id"
            class="border-border bg-card hover:bg-accent relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border p-1 transition-colors"
            :class="{
              'ring-primary ring-2':
                sidebarState.selectedChampion?.id === champion.id,
            }"
            @click="selectChampion(champion)"
          >
            <img
              :src="getChampionImageUrl(champion.key)"
              :alt="champion.name"
              class="h-14 w-14 rounded-md object-cover"
            />
            <!-- 收藏标记 -->
            <div
              v-if="isFavorite(champion.id)"
              class="absolute -top-1 -right-1 h-3 w-3 rounded-full border border-white bg-red-500"
            ></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!state.isLoading"
        class="border-border bg-card rounded-lg border p-12 text-center"
      >
        <div class="text-muted-foreground/50 mb-4 text-3xl">🔍</div>
        <h4 class="text-foreground mb-2 font-medium">没有找到符合条件的英雄</h4>
        <p class="text-muted-foreground text-sm">尝试调整搜索条件或筛选器</p>
      </div>
    </div>

    <!-- 侧边栏 -->
    <div
      v-if="
        sidebarState.isOpen &&
        sidebarState.selectedChampion &&
        sidebarState.championDetails[sidebarState.selectedChampion.id]
      "
      class="bg-background border-border fixed top-0 right-0 z-50 h-full w-96 overflow-y-auto border-l shadow-lg"
    >
      <!-- 侧边栏头部 - 最近查看的英雄 -->
      <div class="border-border flex items-center justify-between border-b p-4">
        <div class="flex items-center space-x-2">
          <div
            v-for="champion in recentlyViewedChampions"
            :key="champion.id"
            class="relative cursor-pointer"
            @click="selectChampion(champion)"
          >
            <img
              :src="getChampionImageUrl(champion.key)"
              :alt="champion.name"
              class="h-10 w-10 rounded-md border-2 object-cover transition-all"
              :class="{
                'border-primary ring-primary/50 ring-2':
                  sidebarState.selectedChampion?.id === champion.id,
                'border-border hover:border-primary/50':
                  sidebarState.selectedChampion?.id !== champion.id,
              }"
              :title="champion.name"
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" @click="closeSidebar">
          <X class="h-4 w-4" />
        </Button>
      </div>

      <!-- 在侧边栏内容中使用升级管理器 -->
      <div class="space-y-6 p-4">
        <!-- 英雄基本信息组件 -->
        <ChampionInfo
          :champion="
            sidebarState.championDetails[sidebarState.selectedChampion.id]
          "
          :is-favorite="isFavorite(sidebarState.selectedChampion.id)"
          @toggle-favorite="toggleFavorite"
        />

        <!-- 升级管理器组件 -->
        <ChampionLevelManager
          ref="levelManagerRef"
          :champion-id="sidebarState.selectedChampion.id"
          :champion="
            sidebarState.championDetails[sidebarState.selectedChampion.id]
          "
          @level-changed="handleLevelChanged"
          @skill-level-changed="handleSkillLevelChanged"
        >
          <template
            #default="{
              currentLevel,
              currentSkillLevels,
              currentStats,
              adjustLevel,
              levelUpSkill,
              levelDownSkill,
            }"
          >
            <!-- 技能组件 -->
            <ChampionSkills
              :champion-id="sidebarState.selectedChampion.id"
              :champion-key="sidebarState.selectedChampion.key"
              :champion-level="currentLevel"
              :skill-levels="currentSkillLevels"
              :champion-details="
                sidebarState.championDetails[sidebarState.selectedChampion.id]
              "
              :ability-haste="
                championAbilityHaste[sidebarState.selectedChampion.id] || 0
              "
              @level-up-skill="levelUpSkill"
              @level-down-skill="levelDownSkill"
              @adjust-level="adjustLevel"
            />

            <!-- 使用装备组件 -->
            <ChampionEquipment
              :champion-id="sidebarState.selectedChampion.id"
              :equipment="
                championEquipment[sidebarState.selectedChampion.id] ||
                Array(6).fill(null)
              "
              @update-equipment="updateEquipment"
            />

            <!-- 使用新的属性展示组件 -->
            <ChampionStats
              :champion="
                sidebarState.championDetails[sidebarState.selectedChampion.id]
              "
              :current-level="currentLevel"
              :current-stats="currentStats"
            />
          </template>
        </ChampionLevelManager>
      </div>
    </div>
  </div>
</template>
