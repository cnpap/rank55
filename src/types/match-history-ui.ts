/**
 * 比赛历史 UI 相关类型定义
 * 用于前端组件的数据处理和展示
 */

import type { ChampionData } from './champion';
import type { Game, Participant, Team } from './match-history-sgp';

// KDA 数据结构
export interface KDAData {
  kills: number;
  deaths: number;
  assists: number;
  ratio: number;
}

// 游戏统计数据
export interface GameStats {
  cs: number; // 补刀数
  gold: number; // 金币
  damage: number; // 伤害
  damageTaken: number; // 承受伤害
  level: number; // 等级
}

// 玩家信息
export interface MatchPlayer {
  puuid: string;
  riotIdGameName: string;
  riotIdTagline: string;
  displayName: string; // 格式化后的名称 "name#tag"
  championId: number;
  championName: string;
  teamId: number; // 100=蓝色方, 200=红色方
  teamPosition: string; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
  isCurrentPlayer: boolean;
  kda: KDAData;
  stats: {
    level: number;
    cs: number;
    gold: number;
    damage: number;
  };
  items: number[];
  spells: [number, number];
  runes: [number, number];
}

// 队伍信息
export interface MatchTeam {
  teamId: number;
  win: boolean;
  players: MatchPlayer[];
}

// 处理后的比赛数据
export interface ProcessedMatch {
  gameId: number;
  championId: number;
  championName: string;
  result: 'victory' | 'defeat';
  queueType: string;
  queueId: number;
  duration: string;
  createdAt: number; // SGP使用timestamp而不是string
  kda: KDAData;
  stats: GameStats;
  items: number[];
  spells: [number, number]; // 召唤师技能 [spell1Id, spell2Id]
  runes: [number, number]; // 天赋系 [perkPrimaryStyle, perkSubStyle]
  expanded: boolean;
  // 新增：所有玩家信息
  teams: MatchTeam[]; // 蓝色方和红色方
  allPlayers: MatchPlayer[]; // 所有10个玩家
}

// 英雄数据状态
export interface ChampionState {
  champions: ChampionData[];
  championNames: Map<string, string>;
  isLoading: boolean;
}

// 详细比赛信息 - 更新为SGP结构
export interface DetailedMatchInfo {
  game: Game; // 现在使用SGP的Game类型
  allParticipants: Participant[]; // SGP的Participant类型
  teams: Team[]; // SGP的Team类型
}

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
