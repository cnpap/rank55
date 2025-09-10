/**
 * 管理需要版本控制的游戏数据资源
 * 使用方式：import { versionedAssets, dataUtils, versionUtils } from '@/assets/versioned-assets'
 */

import { envConfig } from '@/env';
import { getMajorVersion } from '@/utils/version';
import { getDataAsset } from './data-assets';
import { TagData } from '@/types/item';
import { ItemStats } from '@/types/item-raw';

// 游戏版本配置
export let GameVersions: {
  current: string;
  available: string[];
} = {
  current: '',
  available: [],
};

// 需要版本控制的数据文件枚举
export enum VersionedDataAssets {
  // 装备相关数据文件（按版本）
  ITEM_DATA = 'item.json',
  ITEM_TINY_DATA = 'item-tiny.json',
  ITEM_TAGS = 'item-tags.json',
  ITEM_STATS = 'item-stats.json',

  // 英雄数据文件
  CHAMPION_DATA = 'champion.json',

  // 技能图标目录（需要版本路径）
  SKILL_ICONS = 'icons/',
}

const s3BaseDir = `http://${envConfig.endpoint()}/static`;

/**
 * 获取游戏版本相关的数据文件 URL
 * @param filename 文件名（如 'item.json'）
 * @param version 版本号，默认使用当前版本，自动转换为中版本
 * @returns 资源的完整 URL
 */
export function getGameDataAsset(
  filename: string,
  version: string = GameVersions.current
): string {
  const majorVersion = getMajorVersion(version);
  return getDataAsset(`${majorVersion}/${filename}`);
}

/**
 * 获取游戏版本相关的数据文件 URL（S3）
 * @param filename 文件名（如 'item.json'）
 * @param version 版本号，默认使用当前版本，自动转换为中版本
 * @returns 资源的完整 URL
 */
export function getS3GameDataAsset(
  filename: string,
  version: string = GameVersions.current
): string {
  const majorVersion = getMajorVersion(version);
  return `${s3BaseDir}/${majorVersion}/${filename}`;
}

// 通用的数据获取函数
async function fetchData<T = any>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取数据失败: ${response.status} - ${url}`);
  }
  return (await response.json()) as T;
}

// 导出版本相关的游戏数据访问方法
export const versionedAssets = {
  // 游戏数据文件
  getItemData: (version?: string) =>
    getS3GameDataAsset(VersionedDataAssets.ITEM_DATA, version),
  getItemTinyData: (version?: string) =>
    getS3GameDataAsset(VersionedDataAssets.ITEM_TINY_DATA, version),
  getItemTags: (version?: string) =>
    getS3GameDataAsset(VersionedDataAssets.ITEM_TAGS, version),
  getItemStats: (version?: string) =>
    getS3GameDataAsset(VersionedDataAssets.ITEM_STATS, version),
  getChampionData: (version?: string) =>
    getS3GameDataAsset(VersionedDataAssets.CHAMPION_DATA, version),

  // 技能图标资源（需要版本控制）
  getSkillIcon: (championKey: string, skillName: string, version?: string) => {
    const majorVersion = getMajorVersion(version || GameVersions.current);
    return `${s3BaseDir}/${majorVersion}/${VersionedDataAssets.SKILL_ICONS}${championKey}/${skillName}.png`;
  },

  // 被动技能图标（需要版本控制）
  getPassiveIcon: (championKey: string, version?: string) => {
    const majorVersion = getMajorVersion(version || GameVersions.current);
    return getDataAsset(
      `${majorVersion}/${VersionedDataAssets.SKILL_ICONS}${championKey}/passive.png`
    );
  },
};

// 版本相关的数据加载工具
export const dataUtils = {
  fetchItemTags: (version?: string) =>
    fetchData<TagData>(versionedAssets.getItemTags(version)),
  fetchItemStats: (version?: string) =>
    fetchData<ItemStats>(versionedAssets.getItemStats(version)),

  // 英雄详细数据获取
  async fetchChampionDetail(
    championKey: string,
    version?: string
  ): Promise<any> {
    const majorVersion = getMajorVersion(version || GameVersions.current);
    const url = getDataAsset(`${majorVersion}/champions/${championKey}.json`);
    const championDetail = await fetchData(url);
    // 返回英雄详细数据（通常在 data 对象的第一个属性中）
    return Object.values(championDetail.data)[0];
  },

  async fetchUnifiedChampionData(
    championKey: string,
    version?: string
  ): Promise<any> {
    const majorVersion = getMajorVersion(version || GameVersions.current);
    const url = getDataAsset(`${majorVersion}/unified/${championKey}.json`);
    return fetchData(url);
  },

  async fetchChampionCnData(
    championKey: string,
    version?: string
  ): Promise<any> {
    const majorVersion = getMajorVersion(version || GameVersions.current);
    const url = getDataAsset(
      `${majorVersion}/champions-cn/${championKey}.json`
    );
    return fetchData(url);
  },
};

// 版本管理工具
export const versionUtils = {
  /**
   * 初始化游戏版本信息
   * 从服务器获取版本列表并设置当前版本
   * @returns Promise<boolean> 是否成功获取版本信息
   */
  async initializeVersions(): Promise<boolean> {
    try {
      const versionsUrl = `http://${envConfig.endpoint()}/static/versions.json`;
      const response = await fetch(versionsUrl);

      if (!response.ok) {
        console.error(`获取版本信息失败: ${response.status} - ${versionsUrl}`);
        return false;
      }

      const versions: string[] = await response.json();

      if (!Array.isArray(versions) || versions.length === 0) {
        console.error('版本信息格式错误或为空');
        return false;
      }

      // 转换为主版本号
      const majorVersions = versions.map(version => getMajorVersion(version));

      // 更新 GameVersions
      GameVersions.available = majorVersions;
      GameVersions.current = majorVersions[0]; // 第一个版本为最新版本

      console.log('版本信息初始化成功:', {
        current: GameVersions.current,
        available: GameVersions.available,
      });

      return true;
    } catch (error) {
      console.error('初始化版本信息时发生错误:', error);
      return false;
    }
  },

  /**
   * 切换当前使用的游戏版本（自动转换为中版本）
   * @param version 新版本号
   */
  setCurrentVersion: (version: string) => {
    const majorVersion = getMajorVersion(version);
    if (!GameVersions.available.includes(majorVersion as any)) {
      throw new Error(`版本 ${majorVersion} 不在可用版本列表中`);
    }
    GameVersions.current = majorVersion;
  },

  getCurrentVersion: () => GameVersions.current,
  getAvailableVersions: () => GameVersions.available,

  /**
   * 异步获取最新版本（返回中版本）
   * @returns Promise<string> 最新版本号（中版本）
   */
  async getLatestVersion(): Promise<string> {
    const { staticAssets } = await import('./data-assets');
    const versions = await fetchData(staticAssets.getVersions());
    const latestFullVersion = versions[0] || GameVersions.current;
    return getMajorVersion(latestFullVersion);
  },

  getMajorVersion,
};
