// 图片信息
export interface Image {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// 装备属性统计（简化版）
export interface ItemTinyStats {
  ad?: number; // 攻击力
  ap?: number; // 法术强度
  hp?: number; // 生命值
  armor?: number; // 护甲
  mr?: number; // 魔法抗性
  as?: number; // 攻击速度(%)
  crit?: number; // 暴击几率(%)
  mana?: number; // 法力值
  ms?: number; // 移动速度
  msPercent?: number; // 百分比移动速度(%)
  lethality?: number; // 穿甲
  armorPenPercent?: number; // 百分比护甲穿透(%)
  magicPen?: number; // 法术穿透
  magicPenPercent?: number; // 百分比法术穿透(%)
  cdr?: number; // 技能急速
  lifesteal?: number; // 生命偷取(%)
  spellvamp?: number; // 法术吸血(%)
  hpregen?: number; // 基础生命回复(%)
  manaregen?: number; // 基础法力回复(%)
  healShieldPower?: number; // 治疗和护盾强度(%)
}

// 属性显示信息
export interface StatDisplay {
  key: string; // 属性键名
  value: number; // 属性值
  displayName: string; // 显示名称
  suffix: string; // 后缀（如%）
  formatted: string; // 格式化后的完整显示文本
  calculatedValue?: number; // 新增：该属性的计算价值
}

// 新增：价值详情接口
export interface ValueBreakdown {
  statsValue: number; // 装备属性价值
  effectValue: number; // 特效价值
  totalValue: number; // 总价值
  actualPrice: number; // 装备价格
  efficiency: number; // 性价比
}

// 装备简化数据
export interface ItemTinyData {
  id: string; // 装备ID
  name: string; // 装备名称
  plaintext: string; // 简单描述
  stats: ItemTinyStats; // 解析后的属性
  statsDisplay: StatDisplay[]; // 预处理的属性显示
  actualPrice: number; // 实际价格
  calculatedValue: number; // 计算价值
  efficiency: number; // 性价比
  tags: string[]; // 标签
  image: Image; // 图片信息
  passiveEffects: string[]; // 被动/主动效果
  effectPrice: number; // 特效价格
  valueBreakdown?: ValueBreakdown; // 新增：价值详情
  // 新增合成信息
  from?: string[]; // 合成所需的前置装备ID列表
  into?: string[]; // 可以合成的后续装备ID列表
}

// 装备简化信息
export interface ItemTiny {
  type: string;
  version: string;
  data: Record<string, ItemTinyData>;
}

// 标签数据
export interface TagInfo {
  chineseName: string;
  count: number;
}

export interface TagData {
  tags: Record<string, TagInfo>;
}
