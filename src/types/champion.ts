import { Image } from './item';

// 英雄基础信息
export interface ChampionInfo {
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

// 英雄属性
export interface ChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

// 英雄详细数据
export interface ChampionData {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: ChampionInfo;
  image: Image;
  tags: string[];
  partype: string;
  stats: ChampionStats;
  query?: string; // 添加查询字段，包含拼音搜索信息
}

// 所有英雄基础信息
export interface Champion {
  type: string;
  format: string;
  version: string;
  data: Record<string, ChampionData>;
}
