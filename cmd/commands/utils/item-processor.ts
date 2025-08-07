import type { ItemRaw } from '@/types/item-raw';
import type {
  ItemTiny,
  ItemTinyData,
  ItemTinyStats,
  StatDisplay,
} from '@/types/item';
import { ItemEffectExtractor } from './item-effect-extractor';
import { ItemStatsExtractor } from './item-stats-extractor';

/**
 * 装备处理器
 */
export class ItemProcessor {
  private effectExtractor: ItemEffectExtractor;
  private statsExtractor: ItemStatsExtractor;

  constructor() {
    this.effectExtractor = new ItemEffectExtractor();
    this.statsExtractor = new ItemStatsExtractor();
  }

  /**
   * 将完整的装备数据处理为简化格式
   */
  processItemsToTiny(items: ItemRaw): ItemTiny {
    const tinyItems: ItemTiny = {
      type: items.type,
      version: items.version,
      data: {},
    };

    // 用于去重的映射：装备名称 -> 最短ID
    const nameToShortestID = new Map<string, string>();
    const validItems = new Map<string, ItemTinyData>();

    // 第一遍：收集所有符合条件的装备，并找出每个装备名称对应的最短ID
    for (const [itemID, itemData] of Object.entries(items.data)) {
      // 基本过滤条件
      if (
        !itemData.maps['11'] ||
        !itemData.gold.purchasable ||
        itemData.gold.total <= 0
      ) {
        continue;
      }

      // 过滤掉废弃装备
      const isDeprecated = itemData.tags.some(
        tag => tag === 'Deprecated' || tag === 'Disabled'
      );
      if (isDeprecated) {
        continue;
      }

      // 提取属性
      const stats = this.statsExtractor.extractStatsFromDescription(
        itemData.description
      );

      // 预处理属性显示
      const statsDisplay = this.processStatsToDisplay(stats);

      // 装备价值设置为默认值 0
      const calculatedValue = 0;
      const actualPrice = itemData.gold.total;
      const efficiency = 0;

      // 提取特效
      const passiveEffects = this.effectExtractor.extractPassiveEffects(
        itemData.description
      );

      // 处理合成信息：直接使用 itemData 中的合成信息
      const fromItems = itemData.from || [];
      const intoItems = itemData.into || [];

      // 创建简化装备数据
      const tinyData: ItemTinyData = {
        id: itemID,
        name: itemData.name,
        plaintext: itemData.plaintext,
        stats,
        statsDisplay,
        actualPrice,
        calculatedValue,
        efficiency,
        tags: itemData.tags,
        image: itemData.image,
        passiveEffects,
        effectPrice: 0, // 默认特效价格为0，后续可通过合并功能保留现有值
        from: fromItems,
        into: intoItems,
      };

      // 检查是否是同名装备的更短ID
      const itemName = itemData.name;
      const existingID = nameToShortestID.get(itemName);
      if (existingID) {
        // 如果当前ID更短，则替换
        if (itemID.length < existingID.length) {
          nameToShortestID.set(itemName, itemID);
          validItems.set(itemID, tinyData);
          // 删除较长的ID
          validItems.delete(existingID);
        }
        // 如果当前ID更长，则忽略
      } else {
        // 第一次遇到这个装备名称
        nameToShortestID.set(itemName, itemID);
        validItems.set(itemID, tinyData);
      }
    }

    // 将去重后的装备添加到结果中
    tinyItems.data = Object.fromEntries(validItems);

    return tinyItems;
  }

  /**
   * 获取属性的中文显示名称
   */
  private getStatDisplayName(key: string): string {
    const labels: Record<string, string> = {
      ad: '攻击力',
      ap: '法术强度',
      hp: '生命值',
      armor: '护甲',
      mr: '魔抗',
      as: '攻速',
      crit: '暴击',
      mana: '法力',
      ms: '移速',
      msPercent: '移速',
      lethality: '穿甲',
      armorPenPercent: '护甲穿透',
      magicPen: '法穿',
      magicPenPercent: '法术穿透',
      cdr: '技能急速',
      manaregen: '基础法力回复',
      healShieldPower: '治疗和护盾强度',
      hpregen: '基础生命回复',
      lifesteal: '生命偷取',
      spellvamp: '法术吸血',
    };
    return labels[key] || key;
  }

  /**
   * 获取属性的后缀
   */
  private getStatSuffix(key: string): string {
    const percentageStats = new Set([
      'as',
      'crit',
      'armorPenPercent',
      'magicPenPercent',
      'msPercent',
      'manaregen',
      'healShieldPower',
      'hpregen',
      'lifesteal',
      'spellvamp',
    ]);
    return percentageStats.has(key) ? '%' : '';
  }

  /**
   * 将属性转换为显示格式
   */
  private processStatsToDisplay(stats: ItemTinyStats): StatDisplay[] {
    const displays: StatDisplay[] = [];

    for (const [key, value] of Object.entries(stats)) {
      if (value && value > 0) {
        const displayName = this.getStatDisplayName(key);
        const suffix = this.getStatSuffix(key);
        const formatted = `${displayName}: ${value}${suffix}`;

        displays.push({
          key,
          value,
          displayName,
          suffix,
          formatted,
        });
      }
    }

    return displays;
  }

  /**
   * 获取特效提取器实例（用于高级操作）
   */
  getEffectExtractor(): ItemEffectExtractor {
    return this.effectExtractor;
  }
}
