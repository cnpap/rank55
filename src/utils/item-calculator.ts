import type {
  ItemTinyStats,
  ItemTinyData,
  ItemTiny,
  StatDisplay,
  ValueBreakdown,
} from '@/types/item';

// 属性价值配置类型
export type AttributeValues = Required<ItemTinyStats>;

// 默认属性价值配置
export const defaultAttributeValues: AttributeValues = {
  ad: 32,
  ap: 19,
  hp: 2.35,
  armor: 19,
  mr: 17,
  as: 22,
  crit: 34,
  mana: 1,
  ms: 9,
  msPercent: 80,
  lethality: 48,
  armorPenPercent: 29,
  magicPen: 29,
  magicPenPercent: 36,
  cdr: 22,
  manaregen: 3.5,
  healShieldPower: 52,
  hpregen: 2.75,
  lifesteal: 32,
  spellvamp: 23,
};

// 过滤条件类型
export interface FilterOptions {
  searchTerm: string;
  filterBy: string;
  tagFilter: string[];
}

export function calculateStatValues(
  stats: ItemTinyStats,
  attributeValues: AttributeValues
): StatDisplay[] {
  const statDisplays: StatDisplay[] = [];

  const statMappings = [
    { key: 'ad', displayName: '攻击力', suffix: '' },
    { key: 'ap', displayName: '法术强度', suffix: '' },
    { key: 'hp', displayName: '生命值', suffix: '' },
    { key: 'armor', displayName: '护甲', suffix: '' },
    { key: 'mr', displayName: '魔法抗性', suffix: '' },
    { key: 'as', displayName: '攻击速度', suffix: '%' },
    { key: 'crit', displayName: '暴击几率', suffix: '%' },
    { key: 'mana', displayName: '法力值', suffix: '' },
    { key: 'ms', displayName: '移动速度', suffix: '' },
    { key: 'msPercent', displayName: '移动速度', suffix: '%' },
    { key: 'lethality', displayName: '穿甲', suffix: '' },
    { key: 'armorPenPercent', displayName: '护甲穿透', suffix: '%' },
    { key: 'magicPen', displayName: '法术穿透', suffix: '' },
    { key: 'magicPenPercent', displayName: '法术穿透', suffix: '%' },
    { key: 'cdr', displayName: '技能急速', suffix: '' },
    { key: 'lifesteal', displayName: '生命偷取', suffix: '%' },
    { key: 'spellvamp', displayName: '法术吸血', suffix: '%' },
    { key: 'hpregen', displayName: '生命回复', suffix: '%' },
    { key: 'manaregen', displayName: '法力回复', suffix: '%' },
    { key: 'healShieldPower', displayName: '治疗护盾强度', suffix: '%' },
  ];

  for (const mapping of statMappings) {
    const value = stats[mapping.key as keyof ItemTinyStats];
    if (value && value > 0) {
      const calculatedValue = Math.round(
        value * attributeValues[mapping.key as keyof AttributeValues]
      );
      statDisplays.push({
        key: mapping.key,
        value,
        displayName: mapping.displayName,
        suffix: mapping.suffix,
        formatted: `${mapping.displayName} ${value}${mapping.suffix}`,
        calculatedValue,
      });
    }
  }

  return statDisplays;
}

// 新增：计算价值详情
export function calculateValueBreakdown(
  stats: ItemTinyStats,
  effectPrice: number,
  actualPrice: number,
  attributeValues: AttributeValues
): ValueBreakdown {
  const statsValue = calculateItemValue(stats, attributeValues);
  const totalValue = statsValue + effectPrice;
  const efficiency = actualPrice > 0 ? (totalValue / actualPrice) * 100 : 0;

  return {
    statsValue,
    effectValue: effectPrice,
    totalValue,
    actualPrice,
    efficiency: Math.round(efficiency * 100) / 100,
  };
}

// 计算装备价值
export function calculateItemValue(
  stats: ItemTinyStats,
  attributeValues: AttributeValues
): number {
  let totalValue = 0;
  if (stats.ad) totalValue += stats.ad * attributeValues.ad;
  if (stats.ap) totalValue += stats.ap * attributeValues.ap;
  if (stats.hp) totalValue += stats.hp * attributeValues.hp;
  if (stats.armor) totalValue += stats.armor * attributeValues.armor;
  if (stats.mr) totalValue += stats.mr * attributeValues.mr;
  if (stats.as) totalValue += stats.as * attributeValues.as;
  if (stats.crit) totalValue += stats.crit * attributeValues.crit;
  if (stats.mana) totalValue += stats.mana * attributeValues.mana;
  if (stats.ms) totalValue += stats.ms * attributeValues.ms;
  if (stats.msPercent)
    totalValue += stats.msPercent * attributeValues.msPercent;
  if (stats.lethality)
    totalValue += stats.lethality * attributeValues.lethality;
  if (stats.armorPenPercent)
    totalValue += stats.armorPenPercent * attributeValues.armorPenPercent;
  if (stats.magicPen) totalValue += stats.magicPen * attributeValues.magicPen;
  if (stats.magicPenPercent)
    totalValue += stats.magicPenPercent * attributeValues.magicPenPercent;
  if (stats.cdr) totalValue += stats.cdr * attributeValues.cdr;
  if (stats.manaregen)
    totalValue += stats.manaregen * attributeValues.manaregen;
  if (stats.healShieldPower)
    totalValue += stats.healShieldPower * attributeValues.healShieldPower;
  if (stats.hpregen) totalValue += stats.hpregen * attributeValues.hpregen;
  if (stats.lifesteal)
    totalValue += stats.lifesteal * attributeValues.lifesteal;
  if (stats.spellvamp)
    totalValue += stats.spellvamp * attributeValues.spellvamp;
  return Math.round(totalValue);
}

// 处理装备数据
export function processItems(
  data: ItemTiny,
  attributeValues: AttributeValues
): ItemTinyData[] {
  const processedItems: ItemTinyData[] = [];
  for (const [id, item] of Object.entries(data.data)) {
    const statsDisplay = calculateStatValues(item.stats, attributeValues);
    const valueBreakdown = calculateValueBreakdown(
      item.stats,
      item.effectPrice,
      item.actualPrice,
      attributeValues
    );

    processedItems.push({
      ...item,
      statsDisplay,
      valueBreakdown,
      calculatedValue: valueBreakdown.totalValue,
      efficiency: valueBreakdown.efficiency,
    });
  }
  return processedItems;
}

// 过滤装备
export function filterItems(
  items: ItemTinyData[],
  filters: FilterOptions
): ItemTinyData[] {
  return items.filter(item => {
    // 名称搜索
    if (!item.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // 效率过滤
    switch (filters.filterBy) {
      case 'efficient':
        if (item.efficiency <= 80) return false;
        break;
      case 'inefficient':
        if (item.efficiency >= 60) return false;
        break;
      case 'purchasable':
        if (item.actualPrice <= 0) return false;
        break;
    }

    // 标签过滤 - 装备必须包含所有选中的标签
    if (filters.tagFilter.length > 0) {
      if (
        !item.tags ||
        !filters.tagFilter.every(tag => item.tags.includes(tag))
      ) {
        return false;
      }
    }

    return true;
  });
}

// 排序装备
export function sortItems(
  items: ItemTinyData[],
  sortBy: string
): ItemTinyData[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'efficiency-desc':
        return b.efficiency - a.efficiency;
      case 'efficiency-asc':
        return a.efficiency - b.efficiency;
      case 'price-asc':
        return a.actualPrice - b.actualPrice;
      case 'price-desc':
        return b.actualPrice - a.actualPrice;
      case 'value-desc':
        return b.calculatedValue - a.calculatedValue;
      case 'value-asc':
        return a.calculatedValue - b.calculatedValue;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return b.efficiency - a.efficiency;
    }
  });
}

// 获取效率颜色
export function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 110) return 'text-yellow-600'; // 金色 神级
  if (efficiency >= 100) return 'text-yellow-700'; // 深金色 极高
  if (efficiency >= 90) return 'text-blue-600'; // 蓝色 高性价比
  if (efficiency >= 80) return 'text-green-600'; // 绿色 良好
  if (efficiency >= 70) return 'text-indigo-600'; // 靛蓝 一般
  if (efficiency >= 60) return 'text-purple-600'; // 紫色 较低
  return 'text-red-600'; // 红色 极低性价比
}

// 获取效率等级
export function getEfficiencyGrade(efficiency: number): {
  score: number;
  textColor: string;
  bgColor: string;
} {
  const score = Math.round(efficiency);

  // 神级性价比 (110%+) - 金色渐变，参考主装备配色
  if (efficiency >= 110) {
    return {
      score,
      textColor: 'text-yellow-900 font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-lg border border-yellow-200',
    };
  }

  // 极高性价比 (100-109%) - 深金色渐变
  if (efficiency >= 100) {
    return {
      score,
      textColor: 'text-white font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg border border-yellow-300',
    };
  }

  // 高性价比 (90-99%) - 蓝色渐变，参考中间材料配色
  if (efficiency >= 90) {
    return {
      score,
      textColor: 'text-white font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 shadow-lg border border-blue-300',
    };
  }

  // 良好性价比 (80-89%) - 绿色渐变，参考基础材料配色
  if (efficiency >= 80) {
    return {
      score,
      textColor: 'text-white font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 shadow-lg border border-green-300',
    };
  }

  // 一般性价比 (70-79%) - 靛蓝渐变
  if (efficiency >= 70) {
    return {
      score,
      textColor: 'text-white font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 shadow-lg border border-indigo-300',
    };
  }

  // 较低性价比 (60-69%) - 紫色渐变
  if (efficiency >= 60) {
    return {
      score,
      textColor: 'text-white font-bold drop-shadow-sm',
      bgColor:
        'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-lg border border-purple-300',
    };
  }

  // 极低性价比 (<60%) - 红色渐变，用于标识低性价比
  return {
    score,
    textColor: 'text-white font-bold drop-shadow-sm',
    bgColor:
      'bg-gradient-to-br from-red-400 via-red-500 to-red-600 shadow-lg border border-red-300',
  };
}

// 获取效率描述
export function getEfficiencyDescription(efficiency: number): string {
  if (efficiency >= 110) return '神级性价比';
  if (efficiency >= 100) return '极高性价比';
  if (efficiency >= 90) return '高性价比';
  if (efficiency >= 80) return '良好性价比';
  if (efficiency >= 70) return '一般性价比';
  if (efficiency >= 60) return '较低性价比';
  return '极低性价比';
}
