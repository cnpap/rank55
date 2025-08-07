/**
 * 比赛历史 UI 相关类型定义
 * 用于前端组件的数据处理和展示
 */

import type { ChampionData } from './champion';
import type { Game, Participant, Team } from './match-history';

// 游戏模式过滤选项
export interface GameModesFilter {
  showSolo: boolean; // 单双排位 (420)
  showFlex: boolean; // 灵活排位 (440)
  showNormal: boolean; // 匹配模式 (400, 430)
  showARAM: boolean; // 极地大乱斗 (450)
  showArena: boolean; // 斗魂竞技场 (1700)
  showTraining: boolean; // 训练模式 (0)
  showOthers: boolean; // 其他模式
}

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

// 处理后的比赛数据
export interface ProcessedMatch {
  gameId: number;
  championId: number;
  championName: string;
  result: 'victory' | 'defeat';
  queueType: string;
  queueId: number;
  duration: string;
  createdAt: string;
  kda: KDAData;
  stats: GameStats;
  items: number[];
  spells: [number, number]; // 召唤师技能 [spell1Id, spell2Id]
  runes: [number, number]; // 天赋系 [perkPrimaryStyle, perkSubStyle]
  expanded: boolean;
}

// 英雄数据状态
export interface ChampionState {
  champions: ChampionData[];
  championNames: Map<string, string>;
  isLoading: boolean;
}

// 详细比赛信息
export interface DetailedMatchInfo {
  game: Game;
  allParticipants: Participant[];
  teams: Team[];
}
