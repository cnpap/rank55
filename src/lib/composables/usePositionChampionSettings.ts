import { reactive, computed, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { $local, type PositionSettings } from '@/storages/storage-use';
import type { ChampionData } from '@/types/champion';
import { AssignedPosition } from '@/types/players-info';
import { gameDataStore } from '@/lib/db/game-data-db';
import {
  positions,
  recommendedChampions,
  MAX_BAN_CHAMPIONS,
  MAX_PICK_CHAMPIONS,
} from '@/config/position-config';

/**
 * 位置英雄设置的业务逻辑 Composable
 */
export function usePositionChampionSettings(
  initialSettings?: PositionSettings
) {
  // 状态管理
  const champions = ref<ChampionData[]>([]);
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
  const localBanChampions = ref<Record<AssignedPosition, ChampionData[]>>({
    top: [],
    jungle: [],
    middle: [],
    bottom: [],
    support: [],
  });

  const localPickChampions = ref<Record<AssignedPosition, ChampionData[]>>({
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
      .filter(Boolean) as ChampionData[];
  });

  const currentPosition = computed(() => {
    return (
      positions.find(p => p.key === championSelection.currentPosition) ||
      positions[0]
    );
  });

  // 核心业务方法
  function getChampionByKey(championKey: string): ChampionData | undefined {
    return champions.value.find(c => c.key === championKey);
  }

  function getDisplayChampions(
    position: AssignedPosition,
    type: 'ban' | 'pick'
  ) {
    const setting = positionSettings[position];
    const userChampions =
      type === 'ban' ? setting.banChampions : setting.pickChampions;
    const maxCount = type === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;
    const recommended = recommendedChampions[position];
    const recommendedList =
      type === 'ban' ? recommended.banChampions : recommended.pickChampions;

    const userChampionKeys = userChampions.slice(0, maxCount);
    const availableRecommended = recommendedList
      .map(r => r.championId.toString())
      .filter(key => !userChampionKeys.includes(key));

    const needRecommendedCount = maxCount - userChampionKeys.length;
    const recommendedToShow = availableRecommended.slice(
      0,
      needRecommendedCount
    );

    return {
      userChampions: userChampionKeys
        .map(key => getChampionByKey(key))
        .filter(Boolean) as ChampionData[],
      recommendedChampions: recommendedToShow
        .map(key => getChampionByKey(key))
        .filter(Boolean) as ChampionData[],
      totalDisplay: [...userChampionKeys, ...recommendedToShow],
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
  async function loadChampionData() {
    if (champions.value.length > 0) return;
    champions.value = Object.values(gameDataStore.champions);
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
    loadChampionData();
  }

  function closeChampionSelector() {
    championSelection.isOpen = false;
  }

  // 英雄操作
  function toggleChampion(champion: ChampionData) {
    const { currentPosition, currentType } = championSelection;
    const setting = positionSettings[currentPosition];
    const maxCount =
      currentType === 'ban' ? MAX_BAN_CHAMPIONS : MAX_PICK_CHAMPIONS;

    if (currentType === 'ban') {
      const index = setting.banChampions.indexOf(champion.key);
      if (index > -1) {
        setting.banChampions.splice(index, 1);
      } else if (setting.banChampions.length < maxCount) {
        setting.banChampions.push(champion.key);
      } else {
        toast.error(`最多只能选择 ${maxCount} 个禁用英雄`);
        return;
      }
    } else {
      const index = setting.pickChampions.indexOf(champion.key);
      if (index > -1) {
        setting.pickChampions.splice(index, 1);
      } else if (setting.pickChampions.length < maxCount) {
        setting.pickChampions.push(champion.key);
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

  function reorderChampions(newChampions: ChampionData[]) {
    const { currentPosition, currentType } = championSelection;
    const setting = positionSettings[currentPosition];
    const newKeys = newChampions.map(c => c.key);

    if (currentType === 'ban') {
      setting.banChampions.splice(0, setting.banChampions.length, ...newKeys);
    } else {
      setting.pickChampions.splice(0, setting.pickChampions.length, ...newKeys);
    }

    saveSettings();
  }

  function handleReorderBan(
    position: AssignedPosition,
    newChampions: ChampionData[]
  ) {
    const newKeys = newChampions.map(c => c.key);
    positionSettings[position].banChampions.splice(
      0,
      positionSettings[position].banChampions.length,
      ...newKeys
    );
    saveSettings();
  }

  function handleReorderPick(
    position: AssignedPosition,
    newChampions: ChampionData[]
  ) {
    const newKeys = newChampions.map(c => c.key);
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
    championKey: string
  ) {
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
    loadChampionData,
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
