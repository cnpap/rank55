// 英雄联盟英雄数据根接口
export interface ChampionDetail {
  type: string; // 数据类型，通常为 "champion"
  format: string; // 数据格式，如 "standAloneComplex"
  version: string; // 游戏版本号，如 "15.13.1"
  data: Data; // 英雄数据集合
}

// 英雄数据集合，键为英雄ID，值为英雄详细信息
export interface Data {
  [key: string]: Detail;
}

// 英雄详细信息
export interface Detail {
  id: string; // 英雄唯一标识符，如 "Aatrox"
  key: string; // 英雄数字键值，如 "266"
  name: string; // 英雄中文名称，如 "暗裔剑魔"
  title: string; // 英雄称号，如 "亚托克斯"
  image: Image; // 英雄头像图片信息
  skins: Skin[]; // 英雄皮肤列表
  lore: string; // 英雄背景故事（详细版）
  blurb: string; // 英雄背景故事（简短版）
  allytips: string[]; // 友方使用该英雄的技巧提示
  enemytips: string[]; // 对抗该英雄的技巧提示
  tags: string[]; // 英雄标签，如 ["Fighter", "Tank"]
  partype: string; // 资源类型，如 "鲜血魔井"、"法力"、"能量"
  info: Info; // 英雄基础属性评级（1-10分）
  stats: { [key: string]: number }; // 英雄具体数值属性
  spells: Spell[]; // 英雄技能列表（Q、W、E、R）
  passive: Passive; // 英雄被动技能
  recommended: any[]; // 推荐装备（通常为空）
}

// 图片信息
export interface Image {
  full: string; // 完整图片文件名，如 "Aatrox.png"
  sprite: string; // 精灵图文件名，如 "champion0.png"
  group: string; // 图片分组，如 "champion"、"spell"、"passive"
  x: number; // 在精灵图中的X坐标
  y: number; // 在精灵图中的Y坐标
  w: number; // 图片宽度（像素）
  h: number; // 图片高度（像素）
}

// 英雄基础属性评级（1-10分制）
export interface Info {
  attack: number; // 攻击力评级
  defense: number; // 防御力评级
  magic: number; // 法术强度评级
  difficulty: number; // 操作难度评级
}

// 英雄被动技能
export interface Passive {
  name: string; // 被动技能名称
  description: string; // 被动技能描述
  image: Image; // 被动技能图标
}

// 英雄皮肤信息
export interface Skin {
  id: string; // 皮肤唯一ID
  num: number; // 皮肤编号
  name: string; // 皮肤名称
  chromas: boolean; // 是否有炫彩皮肤
}

// 英雄技能信息
export interface Spell {
  id: string; // 技能唯一ID，如 "AatroxQ"
  name: string; // 技能名称
  description: string; // 技能描述
  tooltip: string; // 技能详细说明（包含数值模板）
  leveltip: Leveltip; // 技能升级提示
  maxrank: number; // 技能最大等级
  cooldown: number[]; // 各等级冷却时间数组
  cooldownBurn: string; // 冷却时间字符串表示
  cost: number[]; // 各等级消耗数组
  costBurn: string; // 消耗字符串表示
  datavalues: Datavalues; // 技能数据值（通常为空）
  effect: Array<number[] | null>; // 技能效果数值数组
  effectBurn: Array<null | string>; // 技能效果字符串数组
  vars: any[]; // 技能变量（通常为空）
  costType: string; // 消耗类型，如 "无消耗"、"法力"
  maxammo: string; // 最大弹药数（通常为 "-1"）
  range: number[]; // 各等级技能范围数组
  rangeBurn: string; // 技能范围字符串表示
  image: Image; // 技能图标
  resource: string; // 资源消耗描述
}

// 技能数据值（预留接口）
export interface Datavalues {}

// 技能升级提示
export interface Leveltip {
  label: string[]; // 升级属性标签，如 ["冷却时间", "伤害"]
  effect: string[]; // 升级效果描述数组
}
