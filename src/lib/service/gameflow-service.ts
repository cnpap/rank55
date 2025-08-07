import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

// 游戏流程状态枚举
export enum GameflowPhase {
  None = 'None',
  Lobby = 'Lobby',
  Matchmaking = 'Matchmaking',
  ReadyCheck = 'ReadyCheck',
  ChampSelect = 'ChampSelect',
  GameStart = 'GameStart',
  InProgress = 'InProgress',
  Reconnect = 'Reconnect',
  WaitingForStats = 'WaitingForStats',
  PreEndOfGame = 'PreEndOfGame',
  EndOfGame = 'EndOfGame',
  TerminatedInError = 'TerminatedInError',
}

// 游戏流程会话数据
export interface GameflowSession {
  phase: GameflowPhase;
  gameData?: any;
  map?: any;
  gameMode?: string;
  isCustomGame?: boolean;
}

// Ready Check 数据
export interface ReadyCheckState {
  state:
    | 'InProgress'
    | 'EveryoneReady'
    | 'StrangerNotReady'
    | 'PartyNotReady'
    | 'Invalid';
  playerResponse: 'None' | 'Accepted' | 'Declined';
  dodgeWarning: 'None' | 'Warning' | 'Penalty';
  timer: number;
  declinerIds: number[];
}

export class GameflowService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取当前游戏流程会话
  async getGameflowSession(): Promise<GameflowSession> {
    try {
      const data = await this.makeRequest('GET', '/lol-gameflow/v1/session');
      return data;
    } catch (error) {
      throw new Error(`获取游戏流程会话失败: ${error}`);
    }
  }

  // 获取当前游戏流程阶段
  async getGameflowPhase(): Promise<GameflowPhase> {
    try {
      const phase = await this.makeRequest(
        'GET',
        '/lol-gameflow/v1/gameflow-phase'
      );
      return phase as GameflowPhase;
    } catch (error) {
      throw new Error(`获取游戏流程阶段失败: ${error}`);
    }
  }

  // 获取 Ready Check 状态
  async getReadyCheckState(): Promise<ReadyCheckState> {
    try {
      const data = await this.makeRequest(
        'GET',
        '/lol-matchmaking/v1/ready-check'
      );
      return data;
    } catch (error) {
      throw new Error(`获取 Ready Check 状态失败: ${error}`);
    }
  }

  // 接受 Ready Check
  async acceptReadyCheck(): Promise<void> {
    try {
      await this.makeRequest('POST', '/lol-matchmaking/v1/ready-check/accept');
      console.log('成功接受 Ready Check');
    } catch (error) {
      throw new Error(`接受 Ready Check 失败: ${error}`);
    }
  }

  // 拒绝 Ready Check
  async declineReadyCheck(): Promise<void> {
    try {
      await this.makeRequest('POST', '/lol-matchmaking/v1/ready-check/decline');
      console.log('成功拒绝 Ready Check');
    } catch (error) {
      throw new Error(`拒绝 Ready Check 失败: ${error}`);
    }
  }

  // 检查是否有待接受的对局
  async hasReadyCheck(): Promise<boolean> {
    try {
      const phase = await this.getGameflowPhase();
      if (phase !== GameflowPhase.ReadyCheck) {
        return false;
      }

      const readyCheckState = await this.getReadyCheckState();
      return (
        readyCheckState.state === 'InProgress' &&
        readyCheckState.playerResponse === 'None'
      );
    } catch (error) {
      // 如果获取失败，可能是没有 Ready Check 或者不在相应阶段
      console.warn('检查 Ready Check 状态失败:', error);
      return false;
    }
  }

  // 检查是否在匹配中
  async isInMatchmaking(): Promise<boolean> {
    try {
      const phase = await this.getGameflowPhase();
      return phase === GameflowPhase.Matchmaking;
    } catch (error) {
      console.warn('检查匹配状态失败:', error);
      return false;
    }
  }

  // 检查是否在游戏中
  async isInGame(): Promise<boolean> {
    try {
      const phase = await this.getGameflowPhase();
      return [
        GameflowPhase.ChampSelect,
        GameflowPhase.GameStart,
        GameflowPhase.InProgress,
        GameflowPhase.Reconnect,
        GameflowPhase.WaitingForStats,
        GameflowPhase.PreEndOfGame,
        GameflowPhase.EndOfGame,
      ].includes(phase);
    } catch (error) {
      console.warn('检查游戏状态失败:', error);
      return false;
    }
  }
}
