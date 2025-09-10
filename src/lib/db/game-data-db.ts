import Dexie, { Table } from 'dexie';
import { ChampionSummary, Item } from '@/types/lol-game-data';
import { $local } from '@/storages/storage-use';

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

  constructor() {
    super('gameDataDB');

    // 定义数据库结构
    this.version(1).stores({
      champions: 'id', // 使用英雄key作为主键
      items: 'id', // 使用物品id作为主键
    });

    // 检查版本并决定是否重建数据库
    this.checkVersionAndRebuild();
  }

  // 检查版本并重建数据库
  private async checkVersionAndRebuild(): Promise<void> {
    try {
      const cachedVersion = $local.getItem('gameDataDBVersion') || 0;
      const currentVersion = v;

      if (currentVersion > cachedVersion) {
        console.log(
          `🔄 数据库版本更新：${cachedVersion} -> ${currentVersion}，正在重建数据库...`
        );

        // 删除旧数据库
        await this.delete();

        // 重新打开数据库
        await this.open();

        // 更新缓存版本
        $local.setItem('gameDataDBVersion', currentVersion);

        console.log(`✅ 数据库重建完成，版本已更新为 ${currentVersion}`);
      } else {
        // 版本相同或更旧，只更新缓存版本
        $local.setItem('gameDataDBVersion', currentVersion);
      }
    } catch (error) {
      console.error('❌ 检查数据库版本时出错:', error);
    }
  }

  // 保存英雄数据
  async saveChampions(championsSummaries: ChampionSummary[]): Promise<void> {
    // 清空表
    await this.champions.clear();

    // 批量添加数据
    await this.champions.bulkPut(championsSummaries);

    // 更新全局存储
    Object.assign(
      gameDataStore.champions,
      championsSummaries.reduce(
        (acc, champion) => {
          acc[champion.id] = champion;
          return acc;
        },
        {} as Record<string, ChampionSummary>
      )
    );
    console.log(`📦 已保存 ${championsSummaries.length} 个英雄数据到数据库`);
  }

  // 保存物品数据
  async saveItems(items: Item[]): Promise<void> {
    await this.items.clear();
    await this.items.bulkPut(items);

    // 更新全局存储
    Object.assign(
      gameDataStore.items,
      items.reduce(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {} as Record<string, Item>
      )
    );
    console.log(`📦 已保存 ${items.length} 个物品数据到数据库`);
  }

  // 加载所有英雄数据到内存
  async loadAllChampions(): Promise<void> {
    const champions = await this.champions.toArray();

    // 转换为以 数字 id 为键的对象
    const championsMap = champions.reduce(
      (acc, champion) => {
        acc[champion.id] = champion;
        return acc;
      },
      {} as Record<string, ChampionSummary>
    );

    // 更新全局存储
    Object.assign(gameDataStore.champions, championsMap);
    console.log(`📦 已从数据库加载 ${champions.length} 个英雄数据到内存`);
  }

  // 加载所有物品数据到内存
  async loadAllItems(): Promise<void> {
    const items = await this.items.toArray();

    // 转换为以id为键的对象
    const itemsMap = items.reduce(
      (acc, item) => {
        acc[item.id] = item;
        return acc;
      },
      {} as Record<string, Item>
    );

    // 更新全局存储
    Object.assign(gameDataStore.items, itemsMap);
    console.log(`📦 已从数据库加载 ${items.length} 个物品数据到内存`);
  }
}

// 创建数据库实例
export const gameDataDB = new GameDataDB();
