import type { AssignedPosition } from '@/types/players-info';

// 位置信息接口
export interface PositionInfo {
  key: AssignedPosition;
  name: string;
  icon: string;
}

// 推荐英雄配置接口
export interface RecommendedChampion {
  championId: number; // 英雄ID（数字）
  runes?: {
    primary: number; // 主要天赋系ID
    secondary: number; // 次要天赋系ID
  };
  spells?: {
    spell1: number; // 召唤师技能1 ID
    spell2: number; // 召唤师技能2 ID
  };
}

// 位置推荐配置接口
export interface PositionRecommendation {
  banChampions: RecommendedChampion[];
  pickChampions: RecommendedChampion[];
}

// 所有位置的推荐配置
export type PositionRecommendations = Record<
  AssignedPosition,
  PositionRecommendation
>;

// 位置信息配置
export const positions: PositionInfo[] = [
  {
    key: 'top',
    name: '上单',
    icon: 'top.png',
  },
  {
    key: 'jungle',
    name: '打野',
    icon: 'jungle.png',
  },
  {
    key: 'middle',
    name: '中单',
    icon: 'middle.png',
  },
  {
    key: 'bottom',
    name: 'ADC',
    icon: 'bottom.png',
  },
  {
    key: 'support',
    name: '辅助',
    icon: 'support.png',
  },
];

// 推荐英雄配置数据（静态数据）
export const recommendedChampions: PositionRecommendations = {
  top: {
    banChampions: [
      { championId: 266 }, // 阿特洛克斯
      { championId: 24 }, // 贾克斯
      { championId: 114 }, // 菲奥娜
      { championId: 92 }, // 瑞文
      { championId: 122 }, // 德莱厄斯
    ],
    pickChampions: [
      { championId: 86 }, // 盖伦
      { championId: 58 }, // 雷克顿
      { championId: 75 }, // 纳尔
      { championId: 126 }, // 杰斯
      { championId: 164 }, // 卡蜜尔
      { championId: 39 }, // 艾瑞莉娅
      { championId: 85 }, // 凯南
      { championId: 150 }, // 纳尔
      { championId: 240 }, // 克烈
      { championId: 516 }, // 奥恩
    ],
  },
  jungle: {
    banChampions: [
      { championId: 64 }, // 李青
      { championId: 121 }, // 卡兹克
      { championId: 104 }, // 格雷夫斯
      { championId: 234 }, // 薇古丝
      { championId: 76 }, // 豹女
    ],
    pickChampions: [
      { championId: 11 }, // 易大师
      { championId: 19 }, // 沃里克
      { championId: 5 }, // 信爷
      { championId: 77 }, // 乌迪尔
      { championId: 120 }, // 赫卡里姆
      { championId: 60 }, // 伊莉丝
      { championId: 79 }, // 格拉加斯
      { championId: 113 }, // 瑟庄妮
      { championId: 154 }, // 扎克
      { championId: 72 }, // 斯卡纳
    ],
  },
  middle: {
    banChampions: [
      { championId: 157 }, // 亚索
      { championId: 238 }, // 劫
      { championId: 103 }, // 阿狸
      { championId: 91 }, // 塔隆
      { championId: 7 }, // 勒布朗
    ],
    pickChampions: [
      { championId: 1 }, // 安妮
      { championId: 61 }, // 奥莉安娜
      { championId: 134 }, // 辛德拉
      { championId: 99 }, // 勒布朗
      { championId: 45 }, // 维迦
      { championId: 69 }, // 卡萨丁
      { championId: 127 }, // 丽桑卓
      { championId: 131 }, // 黛安娜
      { championId: 84 }, // 阿卡丽
      { championId: 112 }, // 维克托
    ],
  },
  bottom: {
    banChampions: [
      { championId: 22 }, // 艾希
      { championId: 51 }, // 凯特琳
      { championId: 67 }, // 薇恩
      { championId: 145 }, // 卡莎
      { championId: 202 }, // 金克丝
    ],
    pickChampions: [
      { championId: 21 }, // 赏金猎人
      { championId: 18 }, // 崔丝塔娜
      { championId: 29 }, // 图奇
      { championId: 96 }, // 寇格魔
      { championId: 110 }, // 韦鲁斯
      { championId: 119 }, // 德莱文
      { championId: 222 }, // 金克丝
      { championId: 236 }, // 卢锡安
      { championId: 498 }, // 霞
      { championId: 523 }, // 阿菲利欧斯
    ],
  },
  support: {
    banChampions: [
      { championId: 412 }, // 锤石
      { championId: 53 }, // 布里茨
      { championId: 555 }, // 派克
      { championId: 526 }, // 芮尔
      { championId: 111 }, // 鹦鹉
    ],
    pickChampions: [
      { championId: 40 }, // 风女
      { championId: 267 }, // 娜美
      { championId: 37 }, // 索娜
      { championId: 16 }, // 索拉卡
      { championId: 25 }, // 莫甘娜
      { championId: 43 }, // 卡尔玛
      { championId: 117 }, // 璐璐
      { championId: 143 }, // 婕拉
      { championId: 201 }, // 布拉姆
      { championId: 350 }, // 约里克
    ],
  },
};

// 常量定义
export const MAX_BAN_CHAMPIONS = 5;
export const MAX_PICK_CHAMPIONS = 10;
