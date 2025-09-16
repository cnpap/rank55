import Dexie, { Table } from 'dexie';
import { ChampionSummary, Item } from '@/types/lol-game-data';
import { $local } from '@/storages/storage-use';
import {
  OpggRankedChampionsSummary,
  OpggRankedDataItem,
  RegionType,
  TierType,
} from '@/lib/service/opgg/types';
import {
  lolStaticAssetsService,
  opggService,
} from '@/lib/service/service-manager';

// 创建一个全局的数据存储对象，用于同步访问
export const gameDataStore = {
  champions: {} as Record<string, ChampionSummary>,
  items: {} as Record<string, Item>,
};

export const getChampionName = (championId: string) => {
  if (!gameDataStore.champions[championId]) {
    return championId;
  }
  return gameDataStore.champions[championId].name;
};

const v = 2;

// 定义数据库结构
export class GameDataDB extends Dexie {
  champions!: Table<ChampionSummary>;
  items!: Table<Item>;
  rankedChampions!: Table<OpggRankedDataItem>;

  constructor() {
    super('gameDataDB');

    // 定义数据库结构
    this.version(1).stores({
      champions: 'id', // 使用英雄key作为主键
      items: 'id', // 使用物品id作为主键
      rankedChampions: 'id', // 使用英雄id作为主键
    });

    // 检查版本并决定是否重建数据库
    this.checkVersionAndRebuild();
  }

  // 检查版本并重建数据库
  private async checkVersionAndRebuild(): Promise<void> {
    const cachedVersion = $local.getItem('gameDataDBVersion') || 0;
    if (v > cachedVersion) {
      console.log(
        `🔄 数据库版本更新：${cachedVersion} -> ${v}，正在重建数据库...`
      );
      await this.delete();
      await this.open();
      $local.setItem('gameDataDBVersion', v);
      console.log(`✅ 数据库重建完成，版本已更新为 ${v}`);
    } else {
      // 版本相同或更旧，只更新缓存版本
      $local.setItem('gameDataDBVersion', v);
    }
  }

  // 保存排名数据
  async loadRankedChampions(
    options: {
      region?: RegionType;
      tier?: TierType;
    } = {}
  ): Promise<void> {
    if (!options.region) {
      options.region = $local.getItem('defaultRegion') || 'kr';
    }
    if (!options.tier) {
      options.tier = $local.getItem('defaultTier') || 'platinum_plus';
    }
    const rankedChampions = (await opggService.getChampionsTier(
      options
    )) as OpggRankedChampionsSummary;
    await this.rankedChampions.clear();
    rankedChampions.data.forEach(item => {
      if (item.average_stats === null) {
        console.log(`未找到排名数据的英雄: ${item.id}`);
      }
      for (const position of item.positions) {
        let positionKey = position.name;
        if (positionKey === 'MID') {
          positionKey = 'middle';
        } else if (positionKey === 'ADC') {
          positionKey = 'bottom';
        } else if (positionKey === 'JUNGLE') {
          positionKey = 'jungle';
        } else if (positionKey === 'SUPPORT') {
          positionKey = 'support';
        } else if (positionKey === 'TOP') {
          positionKey = 'top';
        }
        position.name = positionKey;
      }
    });
    await this.rankedChampions.bulkPut(rankedChampions.data);

    // 更新全局存储
    console.log(`📦 已保存 ${rankedChampions.data.length} 个排名数据到数据库`);
  }

  // 加载所有英雄数据到内存
  async loadAllChampions(): Promise<void> {
    let champions = await this.champions.toArray();
    if (champions.length === 0) {
      const championsSummaries =
        await lolStaticAssetsService.getChampionSummary();
      for (const champion of championsSummaries) {
        const rankedChampion = await this.rankedChampions.get(champion.id);
        if (rankedChampion) {
          champion.positions = rankedChampion.positions;
        } else {
          console.log(`未找到排名数据的英雄: ${champion.id}`);
        }
      }
      // 如果在 Electron 环境中，使用 IPC 处理拼音
      let processedChampions = championsSummaries;
      if (window.electronAPI && window.electronAPI.processChampionsPinyin) {
        try {
          console.log('🔤 开始处理英雄拼音数据...');
          processedChampions =
            await window.electronAPI.processChampionsPinyin(championsSummaries);
          console.log('🔤 英雄拼音数据处理完成');
        } catch (error) {
          console.error('处理英雄拼音数据失败，使用原始数据:', error);
          processedChampions = championsSummaries;
        }
      }

      await this.champions.clear();
      await this.champions.bulkPut(processedChampions);
      // 重新获取存储后的数据
      champions = await this.champions.toArray();
    }
    const championsMap = champions.reduce(
      (acc, champion) => {
        acc[champion.id] = champion;
        return acc;
      },
      {} as Record<string, ChampionSummary>
    );
    Object.assign(gameDataStore.champions, championsMap);
    console.log(`📦 已从数据库加载 ${champions.length} 个英雄数据到内存`);
  }

  // 加载所有物品数据到内存
  async loadAllItems(): Promise<void> {
    let items = await this.items.toArray();
    if (items.length === 0) {
      const itemsData = await lolStaticAssetsService.getItems();
      await this.items.clear();
      await this.items.bulkPut(itemsData);
      // 重新获取存储后的数据
      items = await this.items.toArray();
    }
    const itemsMap = items.reduce(
      (acc, item) => {
        acc[item.id] = item;
        return acc;
      },
      {} as Record<string, Item>
    );
    Object.assign(gameDataStore.items, itemsMap);
    console.log(`📦 已从数据库加载 ${items.length} 个物品数据到内存`);
  }

  // 重置并重新加载排名数据，同时更新现有英雄的位置信息
  async resetAndReloadRankedData(
    options: {
      region?: RegionType;
      tier?: TierType;
    } = {}
  ): Promise<void> {
    // 重新加载排名数据
    await this.loadRankedChampions(options);

    // 获取现有的英雄数据
    const existingChampions = await this.champions.toArray();

    if (existingChampions.length > 0) {
      // 更新现有英雄的位置信息
      for (const champion of existingChampions) {
        const rankedChampion = await this.rankedChampions.get(champion.id);
        if (rankedChampion) {
          champion.positions = rankedChampion.positions;
        } else {
          console.log(`未找到排名数据的英雄: ${champion.id}`);
          // 如果没有排名数据，清空位置信息
          champion.positions = [];
        }
      }

      // 更新数据库中的英雄数据
      await this.champions.clear();
      await this.champions.bulkPut(existingChampions);

      // 更新内存中的数据
      const championsMap = existingChampions.reduce(
        (acc, champion) => {
          acc[champion.id] = champion;
          return acc;
        },
        {} as Record<string, ChampionSummary>
      );
      Object.assign(gameDataStore.champions, championsMap);

      console.log(`📦 已更新 ${existingChampions.length} 个英雄的位置信息`);
    }
  }

  // 加载所有数据到内存
  async loadAll() {
    await this.loadRankedChampions();
    await this.loadAllChampions();
    await this.loadAllItems();
  }
}

// 创建数据库实例
export const gameDataDB = new GameDataDB();
