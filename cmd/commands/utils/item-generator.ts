import type { ItemRaw } from '@/types/item-raw';
import type { ItemTiny } from '@/types/item';
import { ItemProcessor } from './item-processor';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { fileExists } from '@/utils/file-utils';

/**
 * 装备数据生成器 - 主入口
 * 提供从 item.json 生成 item-tiny.json 的功能
 */
export class ItemGenerator {
  private processor: ItemProcessor;

  constructor() {
    this.processor = new ItemProcessor();
  }

  /**
   * 从 item.json 数据生成 item-tiny.json 数据
   */
  generateTinyFromRaw(itemData: ItemRaw): ItemTiny {
    return this.processor.processItemsToTiny(itemData);
  }

  /**
   * 从 JSON 字符串生成 item-tiny.json 数据
   */
  generateTinyFromJson(jsonString: string): ItemTiny {
    const itemData: ItemRaw = JSON.parse(jsonString);
    return this.generateTinyFromRaw(itemData);
  }

  /**
   * 从文件路径异步加载并生成 item-tiny.json 数据
   */
  async generateTinyFromFile(filePath: string): Promise<ItemTiny> {
    try {
      const absolutePath = resolve(filePath);
      const jsonString = await readFile(absolutePath, 'utf-8');
      return this.generateTinyFromJson(jsonString);
    } catch (error) {
      throw new Error(
        `Failed to load item data from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 从 URL 异步加载并生成 item-tiny.json 数据（用于网络资源）
   */
  async generateTinyFromUrl(url: string): Promise<ItemTiny> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to load item data from ${url}: ${response.statusText}`
      );
    }
    const jsonString = await response.text();
    return this.generateTinyFromJson(jsonString);
  }

  /**
   * 加载现有的 item-tiny.json 文件
   */
  async loadExistingItemTiny(filePath: string): Promise<ItemTiny | null> {
    try {
      const absolutePath = resolve(filePath);
      if (!(await fileExists(absolutePath))) {
        return null;
      }
      const jsonString = await readFile(absolutePath, 'utf-8');
      return JSON.parse(jsonString) as ItemTiny;
    } catch (error) {
      return null;
    }
  }

  /**
   * 合并现有装备的 effectPrice 到新数据中
   */
  mergeEffectPrices(newItems: ItemTiny, existingItems: ItemTiny): void {
    for (const [itemID, newItem] of Object.entries(newItems.data)) {
      const existingItem = existingItems.data[itemID];
      if (existingItem) {
        // 如果现有装备存在，保留其特效价格
        newItem.effectPrice = existingItem.effectPrice;
      }
      // 如果是新装备，保持默认的特效价格0
    }
  }

  /**
   * 从文件生成 item-tiny.json 并保存到指定路径（支持 effectPrice 合并）
   */
  async generateTinyFromFileAndSave(
    inputFilePath: string,
    outputFilePath: string
  ): Promise<ItemTiny> {
    console.log(`从文件加载装备信息: ${inputFilePath}`);

    // 生成新的 tiny 数据
    const newTinyItems = await this.generateTinyFromFile(inputFilePath);
    console.log(`成功处理 ${Object.keys(newTinyItems.data).length} 个装备`);

    // 检查现有文件并合并 effectPrice
    const existingItems = await this.loadExistingItemTiny(outputFilePath);
    if (existingItems) {
      console.log(`检测到现有文件: ${outputFilePath}`);
      this.mergeEffectPrices(newTinyItems, existingItems);
      console.log('已合并现有装备的特效价格');
    }

    // 保存到文件
    await this.saveTinyToFile(newTinyItems, outputFilePath);
    console.log(`简化装备信息已保存到: ${outputFilePath}`);

    return newTinyItems;
  }

  /**
   * 保存 ItemTiny 数据到文件
   */
  async saveTinyToFile(items: ItemTiny, filePath: string): Promise<void> {
    const absolutePath = resolve(filePath);
    const jsonString = JSON.stringify(items, null, 2);
    await writeFile(absolutePath, jsonString, 'utf-8');
  }

  /**
   * 获取处理器实例（用于高级操作）
   */
  getProcessor(): ItemProcessor {
    return this.processor;
  }
}

// 导出便捷函数
export function createItemGenerator(): ItemGenerator {
  return new ItemGenerator();
}

// 导出新的便捷函数
export async function generateItemTinyFromFileAndSave(
  inputFilePath: string,
  outputFilePath: string
): Promise<ItemTiny> {
  const generator = createItemGenerator();
  return generator.generateTinyFromFileAndSave(inputFilePath, outputFilePath);
}

export function generateItemTinyFromData(itemData: ItemRaw): ItemTiny {
  const generator = createItemGenerator();
  return generator.generateTinyFromRaw(itemData);
}
