// 游戏模式过滤器 - 使用tag系统
export interface GameModesFilter {
  selectedTag: string; // 当前选中的tag
}

// 游戏模式tag选项
export const GAME_MODE_TAGS = {
  all: '所有模式',
  current: '当前模式',
  q_420: '单双排位',
  q_430: '匹配模式',
  q_440: '灵活排位',
  q_450: '极地大乱斗',
  q_480: '快速模式',
  q_490: '快速匹配',
  q_900: '无限乱斗',
  q_1700: '斗魂竞技场',
  q_1900: '无限火力',
  q_2300: '神木之门',
} as const;

export type GameModeTag = keyof typeof GAME_MODE_TAGS;
