/**
 * 统一管理不需要版本控制的静态资源
 * 使用方式：import { getDataAsset, StaticAssets, staticAssets } from '@/assets/data-assets'
 * 版本相关资源请使用：import { versionedAssets, dataUtils, versionUtils } from '@/assets/versioned-assets'
 */

import { envConfig } from '@/env';

// 静态资源路径枚举（不需要版本控制的资源）
export enum StaticAssets {
  // 版本信息文件
  VERSIONS = 'versions.json',

  // 图片资源目录（不需要版本控制）
  ITEM_IMAGES = 'item/',
  CHAMPION_IMAGES = 'avatar/',

  // 段位图标目录
  RANK_IMAGES = 'rank/',

  // 符文图标目录
  RUNE_IMAGES = 'rune/',

  // 天赋图标目录
  PERK_IMAGES = 'perk/',

  // 召唤师技能图标目录
  SPELL_IMAGES = 'spell/',

  // 玩家头像目录
  PROFILE_ICON_IMAGES = 'profileicon/',
}

const s3BaseDir = `http://${envConfig.endpoint()}/static`;

/**
 * 获取 data 目录中的静态资源 URL
 * @param filename 文件名（包含扩展名）
 * @returns 资源的完整 URL
 */
export function getDataAsset(filename: string): string {
  if (!filename) {
    throw new Error('文件名不能为空');
  }
  return `./dynamic/${filename}`;
}

/**
 * 批量获取多个资源
 * @param filenames 文件名数组
 * @returns 资源 URL 数组
 */
export function getDataAssets(filenames: string[]): string[] {
  return filenames.map(filename => getDataAsset(filename));
}

// 通用的数据获取函数
async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取数据失败: ${response.status} - ${url}`);
  }
  return response.json();
}

// 导出不需要版本控制的静态资源访问方法
export const staticAssets = {
  // 版本信息
  getVersions: () => getDataAsset(StaticAssets.VERSIONS),

  // 图片资源（不需要版本控制）
  getItemIcon: (itemId: string) =>
    getDataAsset(`${StaticAssets.ITEM_IMAGES}${itemId}.png`),
  getChampionIcon: (championKey: string) =>
    getDataAsset(`${StaticAssets.CHAMPION_IMAGES}${championKey}.png`),
  getRankIcon: (rankId: string) =>
    getDataAsset(`${StaticAssets.RANK_IMAGES}${rankId}.png`),
  getRankMiniIcon: (rankId: string) =>
    getDataAsset(`${StaticAssets.RANK_IMAGES}${rankId}_mini.png`),
  getRuneIcon: (runeId: string) => `./${StaticAssets.RUNE_IMAGES}${runeId}.png`,
  getPerkIcon: (perkId: string) => `./${StaticAssets.PERK_IMAGES}${perkId}.png`,
  getProfileIcon: (profileIconId: string) =>
    // `/lol-game-data/assets/v1/profile-icons/${profileIconId}.jpg`,
    `${s3BaseDir}/${StaticAssets.PROFILE_ICON_IMAGES}${profileIconId}.png`,
  getSpellIcon: (spellId: string) =>
    `./${StaticAssets.SPELL_IMAGES}${spellId}.png`,
};

// 静态资源数据加载工具
export const staticDataUtils = {
  // 版本信息获取
  fetchVersions: () => fetchData(staticAssets.getVersions()),
};

// 为了向后兼容，保留原有的导出（标记为废弃）
/** @deprecated 请使用 StaticAssets */
export const DataAssets = StaticAssets;

/** @deprecated 请使用 staticAssets */
export const gameAssets = staticAssets;

/** @deprecated 请使用 staticDataUtils，版本相关功能请使用 versioned-assets 中的 dataUtils */
export const dataUtils = staticDataUtils;
