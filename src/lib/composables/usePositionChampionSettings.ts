import { reactive, computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { $local, type PositionSettings } from '@/storages/storage-use';
import { AssignedPosition } from '@/types/players-info';
import { gameDataStore } from '@/storages/game-data-db';
import {
  positions,
  MAX_BAN_CHAMPIONS,
  MAX_PICK_CHAMPIONS,
} from '@/config/position-config';
import { ChampionSummary } from '@/types/lol-game-data';

/**
 * 位置英雄设置的业务逻辑 Composable
 */
export function usePositionChampionSettings(
  initialSettings?: PositionSettings
) {
  // 状态管理
  const champions = ref<ChampionSummary[]>([]);
  const isLoadingChampions = ref(false);

  const positionSettings = reactive<PositionSettings>(
    initialSettings || {
      top: { banChampions: [], pickChampions: [] },
      jungle: { banChampions: [], pickChampions: [] },
      middle: { banChampions: [], pickChampions: [] },
      bottom: { banChampions: [], pickChampions: [] },
      support: { banChampions: [], pickChampions: [] },
    }
  );

  const championSelection = reactive<{
    isOpen: boolean;
    currentPosition: AssignedPosition;
    currentType: '' | 'ban' | 'pick';
  }>({
    isOpen: false,
    currentPosition: '' as any,
    currentType: '',
  });

  // 拖拽用的本地数据
  const localBanChampions = ref<Record<AssignedPosition, ChampionSummary[]>>({
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    support: [],
  });

  const localPickChampions = ref<Record<AssignedPosition, ChampionSummary[]>>({
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    support: [],
  });

  // 计算属性
  const currentSelectedChampions = computed(() => {
    if (!championSelection.currentPosition || !championSelection.currentType)
      return [];

    const setting = positionSettings[championSelection.currentPosition];
    const championKeys =
      championSelection.currentType === 'ban'
        ? setting.banChampions
        : setting.pickChampions;

    return championKeys
      .map(key => getChampionByKey(key))
      .filter(Boolean) as ChampionSummary[];
  });

  const currentPosition = computed(() => {
    return (
      positions.find(p => p.key === championSelection.currentPosition) ||
      positions[0]
    );
  });

  // 核心业务方法
  function getChampionByKey(championKey: string): ChampionSummary | undefined {
    return champions.value.find(c => c.id.toString() === championKey);
  }

  function getDisplayChampions(
    position: AssignedPosition,
    type: 'ban' | 'pick'
  ) {
    const setting = positionSettings[position];
    const userChampions =
      type === 'ban' ? setting.banChampions : setting.pickChampions;

    const userChampionKeys = userChampions;

    // 获取推荐英雄
    let recommendedChampions: ChampionSummary[] = [];

    if (type === 'ban') {
      // 推荐禁用：返回总榜前30名英雄（按总体胜率排序）
      recommendedChampions = champions.value
        .filter(champion => !userChampionKeys.includes(champion.id.toString()))
        .slice(0, 30); // 已经在 loadChampionSummaries 中按胜率排序了
    } else {
      // 推荐选用：返回当前位置所有英雄按胜率排序
      const positionName = position;

      recommendedChampions = champions.value
        .filter(champion => {
          // 过滤掉用户已选择的英雄
          if (userChampionKeys.includes(champion.id.toString())) {
            return false;
          }

          // 检查英雄是否有该位置的数据
          return (
            champion.positions &&
            champion.positions.some(
              pos => pos.name.toLowerCase() === positionName
            )
          );
        })
        .sort((a, b) => {
          // 按该位置的胜率排序
          const aPosition = a.positions.find(
            pos => pos.name.toLowerCase() === positionName
          );
          const bPosition = b.positions.find(
            pos => pos.name.toLowerCase() === positionName
          );

          const aWinRate = aPosition?.stats?.win_rate || 0;
          const bWinRate = bPosition?.stats?.win_rate || 0;

          return bWinRate - aWinRate;
        });
    }

    const recommendedKeys = recommendedChampions.map(c => c.id.toString());

    return {
      userChampions: userChampionKeys
        .map(key => getChampionByKey(key))
        .filter(Boolean) as ChampionSummary[],
      recommendedChampions,
      totalDisplay: [...userChampionKeys, ...recommendedKeys],
    };
  }

  function syncLocalChampions() {
    positions.forEach(position => {
      const displayData = getDisplayChampions(position.key, 'ban');
      localBanChampions.value[position.key] = displayData.userChampions;

      const pickDisplayData = getDisplayChampions(position.key, 'pick');
      localPickChampions.value[position.key] = pickDisplayData.userChampions;
    });
  }

  // 数据加载
  async function loadChampionSummaries() {
    if (champions.value.length > 0) return;
    champions.value = Object.values(gameDataStore.champions)
      .filter(c => !c.name.startsWith('末日人机') && c.name !== '无')
      .sort((a, b) => {
        console.log(a, b);
        try {
          let aRate = 0;
          if (a.positions.length > 0) {
            aRate = a.positions[0].stats.win_rate || 0;
          }
          let bRate = 0;
          if (b.positions.length > 0) {
            bRate = b.positions[0].stats.win_rate || 0;
          }
          return bRate - aRate;
        } catch {
          return 0;
        }
      });
    syncLocalChampions();
  }

  function loadSettings() {
    const savedPositionSettings = $local.getItem('positionSettings');
    if (savedPositionSettings) {
      Object.assign(positionSettings, savedPositionSettings);
    }
  }

  function saveSettings() {
    $local.setItem('positionSettings', positionSettings);
    toast.success('位置设置已保存');
  }

  function resetSettings() {
    Object.keys(positionSettings).forEach(key => {
      positionSettings[key as AssignedPosition] = {
        banChampions: [],
        pickChampions: [],
      };
    });
    saveSettings();
  }

  // 英雄选择器操作
  function openChampionSelector(position: string, type: 'ban' | 'pick') {
    championSelection.currentPosition = position as AssignedPosition;
    championSelection.currentType = type;
    championSelection.isOpen = true;
    loadChampionSummaries();
  }

  function closeChampionSelector() {
    championSelection.isOpen = false;
  }

  // 英雄操作
  function toggleChampion(champion: ChampionSummary) {
    const { currentPosition, currentType } = championSelection;
    const setting = positionSettings[currentPosition];
    const maxCount =
      currentType === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;

    if (currentType === 'ban') {
      const index = setting.banChampions.indexOf(champion.id.toString());
      if (index > -1) {
        setting.banChampions.splice(index, 1);
      } else if (setting.banChampions.length < maxCount) {
        setting.banChampions.push(champion.id.toString());
      } else {
        toast.error(`最多只能选择 ${maxCount} 个禁用英雄`);
        return;
      }
    } else {
      const index = setting.pickChampions.indexOf(champion.id.toString());
      if (index > -1) {
        setting.pickChampions.splice(index, 1);
      } else if (setting.pickChampions.length < maxCount) {
        setting.pickChampions.push(champion.id.toString());
      } else {
        toast.error(`最多只能选择 ${maxCount} 个优先英雄`);
        return;
      }
    }

    saveSettings();
  }

  function removeChampion(index: number) {
    const { currentPosition, currentType } = championSelection;
    const setting = positionSettings[currentPosition];

    if (currentType === 'ban') {
      setting.banChampions.splice(index, 1);
    } else {
      setting.pickChampions.splice(index, 1);
    }

    saveSettings();
  }

  function reorderChampions(newChampions: ChampionSummary[]) {
    const { currentPosition, currentType } = championSelection;
    const setting = positionSettings[currentPosition];
    const newKeys = newChampions.map(c => c.id.toString());

    if (currentType === 'ban') {
      setting.banChampions.splice(0, setting.banChampions.length, ...newKeys);
    } else {
      setting.pickChampions.splice(0, setting.pickChampions.length, ...newKeys);
    }

    saveSettings();
  }

  function handleReorderBan(
    position: AssignedPosition,
    newChampions: ChampionSummary[]
  ) {
    const newKeys = newChampions.map(c => c.id.toString());
    positionSettings[position].banChampions.splice(
      0,
      positionSettings[position].banChampions.length,
      ...newKeys
    );
    saveSettings();
  }

  function handleReorderPick(
    position: AssignedPosition,
    newChampions: ChampionSummary[]
  ) {
    const newKeys = newChampions.map(c => c.id.toString());
    positionSettings[position].pickChampions.splice(
      0,
      positionSettings[position].pickChampions.length,
      ...newKeys
    );
    saveSettings();
  }

  function removeUserChampion(
    position: AssignedPosition,
    type: 'ban' | 'pick',
    index: number
  ) {
    const setting = positionSettings[position];

    if (type === 'ban') {
      setting.banChampions.splice(index, 1);
    } else {
      setting.pickChampions.splice(index, 1);
    }

    saveSettings();
  }

  function selectRecommendedChampion(
    position: AssignedPosition,
    type: 'ban' | 'pick',
    championKey: string | number
  ) {
    if (typeof championKey === 'number') {
      championKey = championKey.toString();
    }
    const setting = positionSettings[position];
    const maxCount = type === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;

    if (type === 'ban') {
      if (
        setting.banChampions.length < maxCount &&
        !setting.banChampions.includes(championKey)
      ) {
        setting.banChampions.push(championKey);
        saveSettings();
      }
    } else {
      if (
        setting.pickChampions.length < maxCount &&
        !setting.pickChampions.includes(championKey)
      ) {
        setting.pickChampions.push(championKey);
        saveSettings();
      }
    }
  }

  // 监听设置变化，同步本地数据
  watch(
    () => positionSettings,
    () => {
      syncLocalChampions();
    },
    { deep: true }
  );

  return {
    // 状态
    champions,
    isLoadingChampions,
    positionSettings,
    championSelection,
    localBanChampions,
    localPickChampions,

    // 计算属性
    currentSelectedChampions,
    currentPosition,

    // 方法
    getChampionByKey,
    getDisplayChampions,
    syncLocalChampions,
    loadChampionSummaries,
    loadSettings,
    saveSettings,
    resetSettings,
    openChampionSelector,
    closeChampionSelector,
    toggleChampion,
    removeChampion,
    reorderChampions,
    handleReorderBan,
    handleReorderPick,
    removeUserChampion,
    selectRecommendedChampion,
  };
}
