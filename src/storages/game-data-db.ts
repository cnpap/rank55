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

const v = 1;

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
      await this.champions.clear();
      await this.champions.bulkPut(championsSummaries);
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

  // 加载所有数据到内存
  async loadAll() {
    await this.loadAllChampions();
    await this.loadAllItems();
    await this.loadRankedChampions();
  }
}

// 创建数据库实例
export const gameDataDB = new GameDataDB();
