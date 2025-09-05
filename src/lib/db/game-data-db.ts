import Dexie, { Table } from 'dexie';
import { ChampionData } from '@/types/champion';
import { ItemTinyData } from '@/types/item';

// 创建一个全局的数据存储对象，用于同步访问
export const gameDataStore = {
  champions: {} as Record<string, ChampionData>,
  items: {} as Record<string, ItemTinyData>,
};

export const getChampionName = (championId: string) => {
  if (!gameDataStore.champions[championId]) {
    return championId;
  }
  return gameDataStore.champions[championId].name;
};

// 定义数据库结构
export class GameDataDB extends Dexie {
  champions!: Table<ChampionData>;
  items!: Table<ItemTinyData>;

  constructor() {
    super('gameDataDB');

    // 定义数据库结构
    this.version(1).stores({
      champions: 'key', // 使用英雄key作为主键
      items: 'id', // 使用物品id作为主键
    });
  }

  // 保存英雄数据
  async saveChampions(
    championsData: Record<string, ChampionData>
  ): Promise<void> {
    // 清空表
    await this.champions.clear();

    // 批量添加数据
    const championsArray = Object.values(championsData);
    await this.champions.bulkPut(championsArray);

    // 更新全局存储
    Object.assign(gameDataStore.champions, championsData);
    console.log(`📦 已保存 ${championsArray.length} 个英雄数据到数据库`);
  }

  // 保存物品数据
  async saveItems(itemsData: Record<string, ItemTinyData>): Promise<void> {
    // 清空表
    await this.items.clear();

    // 批量添加数据
    const itemsArray = Object.values(itemsData);
    await this.items.bulkPut(itemsArray);

    // 更新全局存储
    Object.assign(gameDataStore.items, itemsData);
    console.log(`📦 已保存 ${itemsArray.length} 个物品数据到数据库`);
  }

  // 加载所有英雄数据到内存
  async loadAllChampions(): Promise<void> {
    const champions = await this.champions.toArray();

    // 转换为以key为键的对象
    const championsMap = champions.reduce(
      (acc, champion) => {
        acc[champion.key] = champion;
        return acc;
      },
      {} as Record<string, ChampionData>
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
      {} as Record<string, ItemTinyData>
    );

    // 更新全局存储
    Object.assign(gameDataStore.items, itemsMap);
    console.log(`📦 已从数据库加载 ${items.length} 个物品数据到内存`);
  }

  // 初始化数据库，加载所有数据到内存
  async initialize(): Promise<void> {
    try {
      await this.loadAllChampions();
      await this.loadAllItems();
    } catch (error) {
      console.error('初始化游戏数据库失败:', error);
    }
  }
}

// 创建数据库实例
export const gameDataDB = new GameDataDB();

// 初始化数据库
gameDataDB.initialize().catch(error => {
  console.error('初始化游戏数据库失败:', error);
});
