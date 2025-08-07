// 原始 item.json 数据结构类型定义

import { Image } from './item';

// 符文信息
export interface Rune {
  isrune: boolean;
  tier: number;
  type: string;
}

// 金币信息
export interface Gold {
  base: number;
  total: number;
  sell: number;
  purchasable: boolean;
}

// 地图可用性
export interface ItemMaps {
  '1': boolean;
  '8': boolean;
  '10': boolean;
  '11': boolean;
  '12': boolean;
  '21': boolean;
  '22': boolean;
  '30': boolean;
  '33': boolean;
  '35': boolean;
}

// 装备详细属性（原始数据中的复杂属性结构）
export interface ItemStats {
  FlatHPPoolMod?: number;
  rFlatHPModPerLevel?: number;
  FlatMPPoolMod?: number;
  rFlatMPModPerLevel?: number;
  PercentHPPoolMod?: number;
  PercentMPPoolMod?: number;
  FlatHPRegenMod?: number;
  rFlatHPRegenModPerLevel?: number;
  PercentHPRegenMod?: number;
  FlatMPRegenMod?: number;
  rFlatMPRegenModPerLevel?: number;
  PercentMPRegenMod?: number;
  FlatArmorMod?: number;
  rFlatArmorModPerLevel?: number;
  PercentArmorMod?: number;
  rFlatArmorPenetrationMod?: number;
  rFlatArmorPenetrationModPerLevel?: number;
  rPercentArmorPenetrationMod?: number;
  rPercentArmorPenetrationModPerLevel?: number;
  FlatPhysicalDamageMod?: number;
  rFlatPhysicalDamageModPerLevel?: number;
  PercentPhysicalDamageMod?: number;
  FlatMagicDamageMod?: number;
  rFlatMagicDamageModPerLevel?: number;
  PercentMagicDamageMod?: number;
  FlatMovementSpeedMod?: number;
  rFlatMovementSpeedModPerLevel?: number;
  PercentMovementSpeedMod?: number;
  rPercentMovementSpeedModPerLevel?: number;
  FlatAttackSpeedMod?: number;
  PercentAttackSpeedMod?: number;
  rPercentAttackSpeedModPerLevel?: number;
  rFlatDodgeMod?: number;
  rFlatDodgeModPerLevel?: number;
  PercentDodgeMod?: number;
  FlatCritChanceMod?: number;
  rFlatCritChanceModPerLevel?: number;
  PercentCritChanceMod?: number;
  FlatCritDamageMod?: number;
  rFlatCritDamageModPerLevel?: number;
  PercentCritDamageMod?: number;
  FlatBlockMod?: number;
  PercentBlockMod?: number;
  FlatSpellBlockMod?: number;
  rFlatSpellBlockModPerLevel?: number;
  PercentSpellBlockMod?: number;
  FlatEXPBonus?: number;
  PercentEXPBonus?: number;
  rPercentCooldownMod?: number;
  rPercentCooldownModPerLevel?: number;
  rFlatTimeDeadMod?: number;
  rFlatTimeDeadModPerLevel?: number;
  rPercentTimeDeadMod?: number;
  rPercentTimeDeadModPerLevel?: number;
  rFlatGoldPer10Mod?: number;
  rFlatMagicPenetrationMod?: number;
  rFlatMagicPenetrationModPerLevel?: number;
  rPercentMagicPenetrationMod?: number;
  rPercentMagicPenetrationModPerLevel?: number;
  FlatEnergyRegenMod?: number;
  rFlatEnergyRegenModPerLevel?: number;
  FlatEnergyPoolMod?: number;
  rFlatEnergyModPerLevel?: number;
  PercentLifeStealMod?: number;
  PercentSpellVampMod?: number;
}

// 装备基础信息
export interface ItemBasic {
  name: string;
  rune: Rune;
  gold: Gold;
  group: string;
  description: string;
  colloq: string;
  plaintext: string;
  consumed: boolean;
  stacks: number;
  depth: number;
  consumeOnFull: boolean;
  from: (string | number)[];
  into: (string | number)[];
  specialRecipe: number;
  inStore: boolean;
  hideFromAll: boolean;
  requiredChampion: string;
  requiredAlly: string;
  stats: ItemStats;
  tags: (string | number)[];
  maps: ItemMaps;
}

// 装备数据中的简化属性
export interface ItemDataStats {
  PercentAttackSpeedMod?: number;
}

// 装备详细数据
export interface ItemData {
  name: string;
  description: string;
  colloq: string;
  plaintext: string;
  specialRecipe: number;
  image: Image;
  gold: Gold;
  tags: string[];
  maps: ItemMaps;
  stats: ItemDataStats;
  from?: string[];
  into?: string[];
}

// 装备组信息
export interface ItemGroup {
  id: string;
  MaxGroupOwnable: string;
}

// 装备树信息
export interface ItemTree {
  header: string;
  tags: string[];
}

// 完整的装备数据结构
export interface ItemRaw {
  type: string;
  version: string;
  basic: ItemBasic;
  data: Record<string, ItemData>;
  groups: ItemGroup[];
  tree: ItemTree[];
}
