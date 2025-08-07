import type { ItemTinyStats } from '@/types/item';

/**
 * 装备属性提取器
 */
export class ItemStatsExtractor {
  /**
   * 从描述中提取属性
   */
  extractStatsFromDescription(description: string): ItemTinyStats {
    const stats: ItemTinyStats = {};

    if (!description) {
      return stats;
    }

    // 解码HTML实体
    let decodedDesc = description.replace(/\\u003c/g, '<');
    decodedDesc = decodedDesc.replace(/\\u003e/g, '>');

    // 只提取<stats>标签内的属性
    const statsRegex = /<stats>(.*?)<\/stats>/s;
    const statsMatch = decodedDesc.match(statsRegex);
    if (!statsMatch || statsMatch.length < 2) {
      return stats;
    }

    const statsContent = statsMatch[1];

    // 定义属性匹配模式 - 分别处理百分比和非百分比
    const patterns: Record<string, RegExp> = {
      ad: /<attention>(\d+)<\/attention>\s*攻击力/g,
      ap: /<attention>(\d+)<\/attention>\s*法术强度/g,
      hp: /<attention>(\d+)<\/attention>\s*生命值/g,
      armor: /<attention>(\d+)<\/attention>\s*护甲/g,
      mr: /<attention>(\d+)<\/attention>\s*魔法抗性/g,
      as: /<attention>(\d+)%<\/attention>\s*攻击速度/g,
      crit: /<attention>(\d+)%<\/attention>\s*暴击几率/g,
      mana: /<attention>(\d+)<\/attention>\s*法力/g,
      lethality: /<attention>(\d+)<\/attention>\s*穿甲/g,
      armorPenPercent: /<attention>(\d+)%<\/attention>\s*护甲穿透/g,
      cdr: /<attention>(\d+)<\/attention>\s*技能急速/g,
      lifesteal: /<attention>(\d+)%<\/attention>\s*生命偷取/g,
      spellvamp: /<attention>(\d+)%<\/attention>\s*法术吸血/g,
      hpregen: /<attention>(\d+)%<\/attention>\s*基础生命回复/g,
      manaregen: /<attention>(\d+)%<\/attention>\s*基础法力回复/g,
      healShieldPower: /<attention>(\d+)%<\/attention>\s*治疗和护盾强度/g,
    };

    // 特殊处理法术穿透 - 先匹配百分比，再匹配固定值
    const magicPenPercentPattern = /<attention>(\d+)%<\/attention>\s*法术穿透/g;
    const magicPenFlatPattern = /<attention>(\d+)<\/attention>\s*法术穿透/g;

    // 提取百分比法术穿透
    let match;
    while ((match = magicPenPercentPattern.exec(statsContent)) !== null) {
      const value = parseInt(match[1], 10);
      if (!isNaN(value)) {
        stats.magicPenPercent = value;
      }
    }

    // 提取固定法术穿透
    while ((match = magicPenFlatPattern.exec(statsContent)) !== null) {
      const value = parseInt(match[1], 10);
      if (!isNaN(value)) {
        stats.magicPen = value;
      }
    }

    // 特殊处理移动速度 - 先匹配百分比，再匹配固定值
    const msPercentPattern = /<attention>(\d+)%<\/attention>\s*移动速度/g;
    const msFlatPattern = /<attention>(\d+)<\/attention>\s*移动速度/g;

    // 提取百分比移动速度
    while ((match = msPercentPattern.exec(statsContent)) !== null) {
      const value = parseInt(match[1], 10);
      if (!isNaN(value)) {
        stats.msPercent = value;
      }
    }

    // 提取固定移动速度
    while ((match = msFlatPattern.exec(statsContent)) !== null) {
      const value = parseInt(match[1], 10);
      if (!isNaN(value)) {
        stats.ms = value;
      }
    }

    // 提取其他属性
    for (const [key, pattern] of Object.entries(patterns)) {
      while ((match = pattern.exec(statsContent)) !== null) {
        const value = parseInt(match[1], 10);
        if (!isNaN(value)) {
          (stats as any)[key] = value;
        }
      }
    }

    return stats;
  }
}
