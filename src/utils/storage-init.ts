import { $local, type PositionSettings } from '@/storages/storage-use';
import type { AssignedPosition } from '@/types/players-info';

/**
 * 初始化 localStorage 中的必要数据
 * 检查关键数据是否存在，如果不存在则设置默认值
 */
export function initializeLocalStorage(): void {
  // 初始化位置设置
  initializePositionSettings();

  // 初始化搜索历史
  initializeSearchHistory();

  // 初始化其他必要的设置
  initializeGameSettings();

  // 初始化英雄相关数据
  initializeChampionData();
}

/**
 * 初始化位置设置
 */
function initializePositionSettings(): void {
  const existingSettings = $local.getItem('positionSettings');

  if (!existingSettings) {
    const defaultPositionSettings: PositionSettings = {
      top: { banChampions: [], pickChampions: [] },
      jungle: { banChampions: [], pickChampions: [] },
      middle: { banChampions: [], pickChampions: [] },
      bottom: { banChampions: [], pickChampions: [] },
      support: { banChampions: [], pickChampions: [] },
    };

    $local.setItem('positionSettings', defaultPositionSettings);
    console.log('已初始化位置设置');
  } else {
    // 检查是否缺少某些位置，如果缺少则补充
    const positions: AssignedPosition[] = [
      'top',
      'jungle',
      'middle',
      'bottom',
      'support',
    ];
    let needsUpdate = false;

    positions.forEach(position => {
      if (!existingSettings[position]) {
        existingSettings[position] = { banChampions: [], pickChampions: [] };
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      $local.setItem('positionSettings', existingSettings);
      console.log('已补充缺失的位置设置');
    }
  }
}

/**
 * 初始化搜索历史
 */
function initializeSearchHistory(): void {
  const existingHistory = $local.getItem('searchHistory');

  if (!existingHistory) {
    $local.setItem('searchHistory', []);
    console.log('已初始化搜索历史');
  }
}

/**
 * 初始化游戏设置
 */
function initializeGameSettings(): void {
  // 自动接受对局
  if ($local.getItem('autoAcceptGame') === null) {
    $local.setItem('autoAcceptGame', false);
  }

  // 自动禁用英雄
  if ($local.getItem('autoBanEnabled') === null) {
    $local.setItem('autoBanEnabled', false);
  }

  // 自动选择英雄
  if ($local.getItem('autoPickEnabled') === null) {
    $local.setItem('autoPickEnabled', false);
  }

  // 自动禁用倒计时
  if ($local.getItem('autoBanCountdown') === null) {
    $local.setItem('autoBanCountdown', 5);
  }

  // 自动选择倒计时
  if ($local.getItem('autoPickCountdown') === null) {
    $local.setItem('autoPickCountdown', 5);
  }

  console.log('已初始化游戏设置');
}

/**
 * 初始化英雄相关数据
 */
function initializeChampionData(): void {
  // 收藏的英雄
  if ($local.getItem('favoriteChampions') === null) {
    $local.setItem('favoriteChampions', []);
  }

  // 英雄技能等级
  if ($local.getItem('championSkillLevels') === null) {
    $local.setItem('championSkillLevels', {});
  }

  // 最近查看的英雄
  if ($local.getItem('recentlyViewedChampions') === null) {
    $local.setItem('recentlyViewedChampions', []);
  }

  console.log('已初始化英雄数据');
}

/**
 * 检查并修复损坏的数据
 */
export function validateAndRepairLocalStorage(): void {
  try {
    // 检查位置设置的完整性
    const positionSettings = $local.getItem('positionSettings');
    if (positionSettings) {
      const positions: AssignedPosition[] = [
        'top',
        'jungle',
        'middle',
        'bottom',
        'support',
      ];
      let isValid = true;

      positions.forEach(position => {
        const setting = positionSettings[position];
        if (
          !setting ||
          !Array.isArray(setting.banChampions) ||
          !Array.isArray(setting.pickChampions)
        ) {
          isValid = false;
        }
      });

      if (!isValid) {
        console.warn('检测到位置设置数据损坏，正在重新初始化...');
        $local.removeItem('positionSettings');
        initializePositionSettings();
      }
    }

    // 检查搜索历史的完整性
    const searchHistory = $local.getItem('searchHistory');
    if (searchHistory && !Array.isArray(searchHistory)) {
      console.warn('检测到搜索历史数据损坏，正在重新初始化...');
      $local.removeItem('searchHistory');
      initializeSearchHistory();
    }
  } catch (error) {
    console.error('验证和修复 localStorage 数据时出错:', error);
  }
}
