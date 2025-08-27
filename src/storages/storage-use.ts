// session
import { AssignedPosition } from '@/types/players-info';
import { TypedStorageService } from './storage';

type $SessionStorage = {};

export const $session = new TypedStorageService<$SessionStorage>(
  sessionStorage
);

// 位置设置类型
export interface PositionSetting {
  banChampions: string[]; // 英雄ID字符串数组
  pickChampions: string[]; // 英雄ID字符串数组
}

// 搜索历史项接口
export interface SearchHistoryItem {
  name: string;
  serverId: string;
  serverName: string;
  puuid: string; // 添加 puuid 字段，设为可选以保持向后兼容
  isBookmarked?: boolean; // 添加收藏标记字段
}

export type PositionSettings = Record<AssignedPosition, PositionSetting>;

type $LocalStorage = {
  uid: string;
  favoriteChampions: string[]; // 收藏的英雄ID列表
  championSkillLevels: Record<string, number[]>; // 英雄技能等级 {championId: [q, w, e, r]}
  recentlyViewedChampions: string[]; // 最近查看的英雄ID列表

  // 游戏设置
  autoAcceptGame: boolean; // 自动接受对局
  autoBanEnabled: boolean; // 自动禁用英雄
  autoPickEnabled: boolean; // 自动选择英雄
  autoBanCountdown: number; // 自动禁用倒计时（秒）
  autoPickCountdown: number; // 自动选择倒计时（秒）

  // 位置设置
  positionSettings: PositionSettings; // 位置设置 {position: {banChampions: [], pickChampions: []}}

  // 添加搜索历史
  searchHistory: SearchHistoryItem[]; // 召唤师搜索历史
};

export const $local = new TypedStorageService<$LocalStorage>(localStorage);

/**
 * 使用示例:
 *
 * // 设置值
 * $session.setItem('limit-request', 5);
 * $local.setItem('uid', 'user123');
 * $local.setItem('championSkillLevels', {'Aatrox': [5, 5, 5, 3]});
 * $local.setItem('recentlyViewedChampions', ['Aatrox', 'Yasuo', 'Zed', 'Ahri']);
 * $local.setItem('autoAcceptGame', true);
 * $local.setItem('autoBanCountdown', 5);
 * $local.setItem('positionSettings', {top: {banChampions: ['Aatrox'], pickChampions: ['Yasuo']}});
 *
 * // 获取值
 * const userId = $local.getItem('uid');
 * const recentlyViewed = $local.getItem('recentlyViewedChampions') || [];
 * const autoAccept = $local.getItem('autoAcceptGame') || false;
 * const autoPickCountdown = $local.getItem('autoPickCountdown') || 5;
 * const positions = $local.getItem('positionSettings') || {};
 *
 * // 移除值
 * $session.removeItem('limit-request');
 *
 * // 清除所有值
 * $local.clear();
 */
