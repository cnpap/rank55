import type { Member } from './room';
import type { SummonerData } from './summoner';
import type { RankedStats } from './ranked-stats';
import { SgpMatchHistoryResult } from './match-history-sgp';
import { GameflowPhaseEnum } from './gameflow-session';

/**
 * 基础成员接口 - 包含所有成员共有的详细信息字段
 */
export interface BaseMemberWithDetails {
  summonerId: number;
  summonerName: string;

  // 详细信息
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: SgpMatchHistoryResult;

  // 加载状态
  isLoading?: boolean;
  isLoadingSummonerData?: boolean;
  isLoadingRankedStats?: boolean;
  isLoadingMatchHistory?: boolean;

  // 错误状态
  error?: string;
}

/**
 * 房间成员详细信息接口 - 继承自 Member 和 BaseMemberWithDetails
 */
export interface MemberWithDetails extends Member, BaseMemberWithDetails {
  assignedPosition?: string;
}

/**
 * 英雄选择阶段成员详细信息接口
 */
export interface ChampSelectMemberWithDetails extends BaseMemberWithDetails {
  // 基本信息来自 RankTeam
  puuid: string;
  assignedPosition: string;
  cellId: number;
  championId: number;
  isLeader: boolean; // 根据 cellId 判断
}

/**
 * 游戏开始阶段成员详细信息接口
 */
export interface GameStartMemberWithDetails extends BaseMemberWithDetails {
  // 基本信息
  teamId: number; // 1为我方，2为敌方
  isMyTeam: boolean;
  assignedPosition: string; // 添加位置信息用于排序
}

/**
 * 通用成员类型 - 用于类型联合
 */
export type AnyMemberWithDetails =
  | MemberWithDetails
  | ChampSelectMemberWithDetails
  | GameStartMemberWithDetails;

/**
 * 错误处理结果接口
 */
export interface ErrorHandlingResult {
  success: boolean;
  error?: string;
  retryCount?: number;
}

/**
 * 游戏阶段分类枚举
 */
export enum GamePhaseCategory {
  Idle = 'idle',
  Lobby = 'lobby',
  ChampSelect = 'champSelect',
  GameStart = 'gameStart',
  GameEnd = 'gameEnd',
  Unknown = 'unknown',
}

/**
 * 成员数据更新函数的通用接口
 */
export interface MemberDataUpdateable {
  summonerId: number;
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  isLoading?: boolean;
  error?: string;
  assignedPosition?: string;
}

/**
 * 槽位计算相关的类型
 */
export type MemberSlot<T = MemberWithDetails> = T | null;
export type MemberSlots<T = MemberWithDetails> = MemberSlot<T>[];

/**
 * 位置顺序常量
 */
export const POSITION_ORDER = [
  'top',
  'jungle',
  'middle',
  'bottom',
  'support',
  'utility',
] as const;
export type Position = (typeof POSITION_ORDER)[number];

/**
 * 游戏阶段常量
 */
export const GAME_PHASES = {
  IDLE: [GameflowPhaseEnum.None] as GameflowPhaseEnum[],
  LOBBY: [
    GameflowPhaseEnum.Lobby,
    GameflowPhaseEnum.Matchmaking,
    GameflowPhaseEnum.ReadyCheck,
  ] as GameflowPhaseEnum[],
  CHAMP_SELECT: [GameflowPhaseEnum.ChampSelect] as GameflowPhaseEnum[],
  GAME_START: [
    GameflowPhaseEnum.GameStart,
    GameflowPhaseEnum.InProgress,
  ] as GameflowPhaseEnum[],
  GAME_END: [
    GameflowPhaseEnum.EndOfGame,
    GameflowPhaseEnum.PreEndOfGame,
    GameflowPhaseEnum.WaitingForStats,
  ] as GameflowPhaseEnum[],
};
