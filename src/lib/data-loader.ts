import {
  dataUtils,
  versionedAssets,
  versionUtils,
} from '@/assets/versioned-assets';
import { Champion } from '../types/champion';
import { ItemRaw } from '../types/item-raw';

/**
 * 浏览器数据加载器 - 使用统一的 data-assets 管理
 */
export class BrowserDataLoader {
  private version: string | null = null;
  private champions: Champion | null = null;
  private items: ItemRaw | null = null;

  /**
   * 获取最新的中版本号
   */
  private async getLatestMajorVersion(): Promise<string> {
    if (this.version) {
      return this.version;
    }

    try {
      this.version = await versionUtils.getLatestVersion();
      return this.version;
    } catch (error) {
      console.warn('无法读取版本文件，使用默认版本');
      this.version = versionUtils.getCurrentVersion();
      return this.version;
    }
  }

  /**
   * 加载英雄数据
   */
  private async loadChampions(): Promise<Champion> {
    if (this.champions) {
      return this.champions;
    }

    try {
      const version = await this.getLatestMajorVersion();
      this.champions = await dataUtils.fetchChampionData(version);
      return this.champions!;
    } catch (error) {
      console.warn('无法加载英雄数据:', error);
      // 返回空的英雄数据结构
      return {
        type: 'champion',
        format: 'standAloneComplex',
        version: versionUtils.getCurrentVersion(),
        data: {},
      };
    }
  }

  /**
   * 加载装备数据
   */
  private async loadItems(): Promise<ItemRaw> {
    if (this.items) {
      return this.items;
    }

    try {
      const version = await this.getLatestMajorVersion();
      // 使用完整的 item.json 而不是 item-tiny.json
      const url = versionedAssets.getItemData(version);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.items = (await response.json()) as ItemRaw;
      return this.items;
    } catch (error) {
      console.warn('无法加载装备数据:', error);
      // 返回空的装备数据结构
      return {
        type: 'item',
        version: versionUtils.getCurrentVersion(),
        basic: {} as any,
        data: {},
        groups: [],
        tree: [],
      };
    }
  }

  /**
   * 根据英雄ID获取英雄名称
   */
  async getChampionName(championId: number | string): Promise<string> {
    try {
      const champions = await this.loadChampions();
      const championKey = String(championId);

      // 遍历所有英雄，通过key匹配
      for (const [, championData] of Object.entries(champions.data)) {
        if (championData.key === championKey) {
          return championData.name;
        }
      }

      return `英雄${championId}`;
    } catch (error) {
      return `英雄${championId}`;
    }
  }

  /**
   * 根据装备ID获取装备名称
   */
  async getItemName(itemId: number | string): Promise<string> {
    try {
      const items = await this.loadItems();
      const itemKey = String(itemId);

      if (items.data[itemKey]) {
        return items.data[itemKey].name;
      }

      return `装备${itemId}`;
    } catch (error) {
      return `装备${itemId}`;
    }
  }

  /**
   * 批量获取英雄名称
   */
  async getChampionNames(
    championIds: (number | string)[]
  ): Promise<Map<string, string>> {
    const champions = await this.loadChampions();
    const result = new Map<string, string>();

    for (const championId of championIds) {
      const championKey = String(championId);
      let found = false;

      // 遍历所有英雄，通过key匹配
      for (const [, championData] of Object.entries(champions.data)) {
        if (championData.key === championKey) {
          result.set(championKey, championData.name);
          found = true;
          break;
        }
      }

      if (!found) {
        result.set(championKey, `英雄${championId}`);
      }
    }

    return result;
  }

  /**
   * 批量获取装备名称
   */
  async getItemNames(
    itemIds: (number | string)[]
  ): Promise<Map<string, string>> {
    const items = await this.loadItems();
    const result = new Map<string, string>();

    for (const itemId of itemIds) {
      const itemKey = String(itemId);

      if (items.data[itemKey]) {
        result.set(itemKey, items.data[itemKey].name);
      } else {
        result.set(itemKey, `装备${itemId}`);
      }
    }

    return result;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.version = null;
    this.champions = null;
    this.items = null;
  }
}

/**
 * Node.js 数据加载器 - 使用统一的 data-assets 管理
 */
export class TestDataLoader {
  private version: string | null = null;
  private champions: Champion | null = null;
  private items: ItemRaw | null = null;

  /**
   * 获取最新的中版本号
   */
  private async getLatestMajorVersion(): Promise<string> {
    if (this.version) {
      return this.version;
    }

    try {
      this.version = await versionUtils.getLatestVersion();
      return this.version;
    } catch (error) {
      console.warn('无法读取版本文件，使用默认版本');
      this.version = versionUtils.getCurrentVersion();
      return this.version;
    }
  }

  /**
   * 加载英雄数据
   */
  private async loadChampions(): Promise<Champion> {
    if (this.champions) {
      return this.champions;
    }

    try {
      const version = await this.getLatestMajorVersion();
      this.champions = await dataUtils.fetchChampionData(version);
      return this.champions!;
    } catch (error) {
      console.warn('无法加载英雄数据:', error);
      // 返回空的英雄数据结构
      return {
        type: 'champion',
        format: 'standAloneComplex',
        version: versionUtils.getCurrentVersion(),
        data: {},
      };
    }
  }

  /**
   * 加载装备数据
   */
  private async loadItems(): Promise<ItemRaw> {
    if (this.items) {
      return this.items;
    }

    try {
      const version = await this.getLatestMajorVersion();
      // 使用完整的 item.json 而不是 item-tiny.json
      const url = versionedAssets.getItemData(version);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.items = (await response.json()) as ItemRaw;
      return this.items;
    } catch (error) {
      console.warn('无法加载装备数据:', error);
      // 返回空的装备数据结构
      return {
        type: 'item',
        version: versionUtils.getCurrentVersion(),
        basic: {} as any,
        data: {},
        groups: [],
        tree: [],
      };
    }
  }

  /**
   * 根据英雄ID获取英雄名称
   */
  async getChampionName(championId: number | string): Promise<string> {
    try {
      const champions = await this.loadChampions();
      const championKey = String(championId);

      // 遍历所有英雄，通过key匹配
      for (const [, championData] of Object.entries(champions.data)) {
        if (championData.key === championKey) {
          return championData.name;
        }
      }

      return `英雄${championId}`;
    } catch (error) {
      return `英雄${championId}`;
    }
  }

  /**
   * 根据装备ID获取装备名称
   */
  async getItemName(itemId: number | string): Promise<string> {
    try {
      const items = await this.loadItems();
      const itemKey = String(itemId);

      if (items.data[itemKey]) {
        return items.data[itemKey].name;
      }

      return `装备${itemId}`;
    } catch (error) {
      return `装备${itemId}`;
    }
  }

  /**
   * 批量获取英雄名称
   */
  async getChampionNames(
    championIds: (number | string)[]
  ): Promise<Map<string, string>> {
    const champions = await this.loadChampions();
    const result = new Map<string, string>();

    for (const championId of championIds) {
      const championKey = String(championId);
      let found = false;

      // 遍历所有英雄，通过key匹配
      for (const [, championData] of Object.entries(champions.data)) {
        if (championData.key === championKey) {
          result.set(championKey, championData.name);
          found = true;
          break;
        }
      }

      if (!found) {
        result.set(championKey, `英雄${championId}`);
      }
    }

    return result;
  }

  /**
   * 批量获取装备名称
   */
  async getItemNames(
    itemIds: (number | string)[]
  ): Promise<Map<string, string>> {
    const items = await this.loadItems();
    const result = new Map<string, string>();

    for (const itemId of itemIds) {
      const itemKey = String(itemId);

      if (items.data[itemKey]) {
        result.set(itemKey, items.data[itemKey].name);
      } else {
        result.set(itemKey, `装备${itemId}`);
      }
    }

    return result;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.version = null;
    this.champions = null;
    this.items = null;
  }
}

// 根据环境创建合适的实例
export const dataLoader =
  typeof window !== 'undefined'
    ? new BrowserDataLoader()
    : new TestDataLoader();

// 为了向后兼容，保留 testDataLoader 导出
export const testDataLoader = dataLoader;
