import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { $local } from '@/storages/storage-use';
import type { RegionType, TierType } from '@/lib/service/opgg/types';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';

// 游戏设置接口
export interface GameSettings {
  autoAcceptGame: boolean;
  defaultGameMode: string;
  defaultRegion: RegionType;
  defaultTier: TierType;
  matchHistoryType: 'lightweight' | 'detailed';
  dataDisplayMode: 'damage' | 'tank';
}

// 游戏模式选项
export const GAME_MODE_OPTIONS = Object.entries(GAME_MODE_TAGS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

// 服务器选项
export const REGION_OPTIONS = [
  { value: 'global', label: '全球' },
  { value: 'kr', label: '韩服' },
  { value: 'na', label: '北美' },
] as const;

// 分段选项
export const TIER_OPTIONS = [
  { value: 'all', label: '全部分段', tier: null },
  { value: 'challenger', label: '王者', tier: 'CHALLENGER' },
  { value: 'grandmaster', label: '宗师', tier: 'GRANDMASTER' },
  { value: 'master_plus', label: '大师以上', tier: 'MASTER' },
  { value: 'master', label: '大师', tier: 'MASTER' },
  { value: 'diamond_plus', label: '钻石以上', tier: 'DIAMOND' },
  { value: 'emerald_plus', label: '翡翠以上', tier: 'EMERALD' },
  { value: 'platinum_plus', label: '白金以上', tier: 'PLATINUM' },
  { value: 'gold_plus', label: '黄金以上', tier: 'GOLD' },
] as const;

// 战绩类型选项
export const MATCH_HISTORY_TYPE_OPTIONS = [
  { value: 'lightweight', label: '轻量' },
  { value: 'detailed', label: '详细' },
] as const;

// 数据展示模式选项
export const DATA_DISPLAY_MODE_OPTIONS = [
  { value: 'damage', label: '看输出' },
  { value: 'tank', label: '看承伤' },
] as const;

// 默认设置
const DEFAULT_SETTINGS: GameSettings = {
  autoAcceptGame: false,
  defaultGameMode: 'all',
  defaultRegion: 'kr',
  defaultTier: 'diamond_plus',
  matchHistoryType: 'lightweight',
  dataDisplayMode: 'damage',
};

export const useGameSettingsStore = defineStore('gameSettings', () => {
  // 状态
  const autoAcceptGame = ref<boolean>(
    $local.getItem('autoAcceptGame') ?? DEFAULT_SETTINGS.autoAcceptGame
  );
  const defaultGameMode = ref<string>(
    $local.getItem('defaultGameMode') ?? DEFAULT_SETTINGS.defaultGameMode
  );
  const defaultRegion = ref<RegionType>(
    $local.getItem('defaultRegion') ?? DEFAULT_SETTINGS.defaultRegion
  );
  const defaultTier = ref<TierType>(
    $local.getItem('defaultTier') ?? DEFAULT_SETTINGS.defaultTier
  );
  const matchHistoryType = ref<'lightweight' | 'detailed'>(
    $local.getItem('matchHistoryType') ?? DEFAULT_SETTINGS.matchHistoryType
  );
  const dataDisplayMode = ref<'damage' | 'tank'>(
    $local.getItem('dataDisplayMode') ?? DEFAULT_SETTINGS.dataDisplayMode
  );

  // 计算属性
  const settings = computed<GameSettings>(() => ({
    autoAcceptGame: autoAcceptGame.value,
    defaultGameMode: defaultGameMode.value,
    defaultRegion: defaultRegion.value,
    defaultTier: defaultTier.value,
    matchHistoryType: matchHistoryType.value,
    dataDisplayMode: dataDisplayMode.value,
  }));

  const currentGameModeOption = computed(() => {
    return GAME_MODE_OPTIONS.find(
      option => option.value === defaultGameMode.value
    );
  });

  const currentRegionOption = computed(() => {
    return REGION_OPTIONS.find(option => option.value === defaultRegion.value);
  });

  const currentTierOption = computed(() => {
    return TIER_OPTIONS.find(option => option.value === defaultTier.value);
  });

  const currentMatchHistoryTypeOption = computed(() => {
    return MATCH_HISTORY_TYPE_OPTIONS.find(
      option => option.value === matchHistoryType.value
    );
  });

  const currentDataDisplayModeOption = computed(() => {
    return DATA_DISPLAY_MODE_OPTIONS.find(
      option => option.value === dataDisplayMode.value
    );
  });

  // 方法
  const setAutoAcceptGame = (value: boolean) => {
    autoAcceptGame.value = value;
  };

  const setDefaultGameMode = (value: string) => {
    defaultGameMode.value = value;
  };

  const setDefaultRegion = (value: RegionType) => {
    defaultRegion.value = value;
  };

  const setDefaultTier = (value: TierType) => {
    defaultTier.value = value;
  };

  const setMatchHistoryType = (value: 'lightweight' | 'detailed') => {
    matchHistoryType.value = value;
  };

  const setDataDisplayMode = (value: 'damage' | 'tank') => {
    dataDisplayMode.value = value;
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    if (newSettings.autoAcceptGame !== undefined) {
      autoAcceptGame.value = newSettings.autoAcceptGame;
    }
    if (newSettings.defaultGameMode !== undefined) {
      defaultGameMode.value = newSettings.defaultGameMode;
    }
    if (newSettings.defaultRegion !== undefined) {
      defaultRegion.value = newSettings.defaultRegion;
    }
    if (newSettings.defaultTier !== undefined) {
      defaultTier.value = newSettings.defaultTier;
    }
    if (newSettings.matchHistoryType !== undefined) {
      matchHistoryType.value = newSettings.matchHistoryType;
    }
    if (newSettings.dataDisplayMode !== undefined) {
      dataDisplayMode.value = newSettings.dataDisplayMode;
    }
  };

  const resetSettings = () => {
    autoAcceptGame.value = DEFAULT_SETTINGS.autoAcceptGame;
    defaultGameMode.value = DEFAULT_SETTINGS.defaultGameMode;
    defaultRegion.value = DEFAULT_SETTINGS.defaultRegion;
    defaultTier.value = DEFAULT_SETTINGS.defaultTier;
    matchHistoryType.value = DEFAULT_SETTINGS.matchHistoryType;
    dataDisplayMode.value = DEFAULT_SETTINGS.dataDisplayMode;
  };

  // 监听变化并自动保存到本地存储
  watch(autoAcceptGame, newValue => {
    $local.setItem('autoAcceptGame', newValue);
  });

  watch(defaultGameMode, newValue => {
    $local.setItem('defaultGameMode', newValue);
  });

  watch(defaultRegion, newValue => {
    $local.setItem('defaultRegion', newValue);
  });

  watch(defaultTier, newValue => {
    $local.setItem('defaultTier', newValue);
  });

  watch(matchHistoryType, newValue => {
    $local.setItem('matchHistoryType', newValue);
  });

  watch(dataDisplayMode, newValue => {
    $local.setItem('dataDisplayMode', newValue);
  });

  return {
    // 状态
    autoAcceptGame,
    defaultGameMode,
    defaultRegion,
    defaultTier,
    matchHistoryType,
    dataDisplayMode,

    // 计算属性
    settings,
    currentGameModeOption,
    currentRegionOption,
    currentTierOption,
    currentMatchHistoryTypeOption,
    currentDataDisplayModeOption,

    // 方法
    setAutoAcceptGame,
    setDefaultGameMode,
    setDefaultRegion,
    setDefaultTier,
    setMatchHistoryType,
    setDataDisplayMode,
    updateSettings,
    resetSettings,
  };
});
