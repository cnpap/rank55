/**
 * 测试辅助函数集合
 * 用于解耦测试文件中的重复代码
 */

import { gameAssets, staticAssets } from '@/assets/data-assets';

/**
 * 格式化游戏时长
 * @param seconds 游戏时长（秒）
 * @returns 格式化后的时长字符串 (mm:ss)
 */
export function formatGameDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化数字（K/M单位）
 * @param num 数字
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return `${(num / 1000000).toFixed(1)}M`;
  }
}

/**
 * 获取地图名称
 * @param mapID 地图ID
 * @returns 地图中文名称
 */
export function getMapName(mapID: number): string {
  const mapNames: { [key: number]: string } = {
    1: '召唤师峡谷 (夏季)',
    2: '召唤师峡谷 (秋季)',
    3: '试炼之地',
    4: '扭曲丛林',
    8: '水晶之痕',
    10: '扭曲丛林',
    11: '召唤师峡谷',
    12: '嚎哭深渊',
    14: '屠夫之桥',
    16: '宇宙废墟',
    18: '英勇峡谷',
    19: '英勇峡谷',
    20: '英勇峡谷',
    21: '纳克萨斯攻城',
    22: '云顶之弈',
    30: '斗魂竞技场',
  };

  return mapNames[mapID] || `地图${mapID}`;
}

/**
 * 获取段位名称
 * @param tier 段位英文名
 * @returns 段位中文名称
 */
export function getTierName(tier: string): string {
  switch (tier) {
    case 'IRON':
      return '黑铁';
    case 'BRONZE':
      return '黄铜';
    case 'SILVER':
      return '白银';
    case 'GOLD':
      return '黄金';
    case 'PLATINUM':
      return '铂金';
    case 'EMERALD':
      return '翡翠';
    case 'DIAMOND':
      return '钻石';
    case 'MASTER':
      return '大师';
    case 'GRANDMASTER':
      return '宗师';
    case 'CHALLENGER':
      return '王者';
    default:
      return tier;
  }
}

/**
 * 获取段位等级名称
 * @param division 段位等级
 * @returns 段位等级中文名称
 */
export function getRankName(division: string): string {
  switch (division) {
    case 'I':
      return '1';
    case 'II':
      return '2';
    case 'III':
      return '3';
    case 'IV':
      return '4';
    case 'V':
      return '5';
    case 'NA':
      return '';
    default:
      return division || '';
  }
}

/**
 * 获取队列类型名称
 * @param queueType 队列类型
 * @returns 队列类型中文名称
 */
export function getQueueTypeName(queueType: string): string {
  switch (queueType) {
    case 'RANKED_SOLO_5x5':
      return '单双排位';
    case 'RANKED_FLEX_SR':
      return '灵活排位';
    case 'RANKED_TFT':
      return '云顶之弈';
    case 'RANKED_TFT_TURBO':
      return '云顶之弈极速模式';
    case 'RANKED_TFT_DOUBLE_UP':
      return '云顶之弈双人作战';
    default:
      return queueType;
  }
}

/**
 * 判断是否已定级
 * @param stats 排位统计数据
 * @returns 是否已定级
 */
export function isRanked(stats: any): boolean {
  return (
    stats.tier &&
    stats.tier !== 'UNRANKED' &&
    stats.tier !== '' &&
    stats.tier !== 'NONE'
  );
}

const tierToIconMap: Record<string, string> = {
  IRON: '80',
  BRONZE: '50',
  SILVER: '40',
  GOLD: '30',
  PLATINUM: '20',
  EMERALD: '15',
  DIAMOND: '10',
  MASTER: '6',
  GRANDMASTER: '5',
  CHALLENGER: '0',
};

/**
 * 获取段位图标URL
 * @param tier 段位英文名
 * @returns 段位图标URL
 */
export function getRankImageUrl(tier: string): string {
  const iconId = tierToIconMap[tier] || '0';
  return staticAssets.getRankIcon(iconId);
}

/**
 * 获取段位 mini 图标URL
 * @param tier 段位英文名
 * @returns 段位 mini 图标URL
 */
export function getRankMiniImageUrl(tier: string): string {
  const iconId = tierToIconMap[tier] || '0';
  return staticAssets.getRankMiniIcon(iconId);
}
