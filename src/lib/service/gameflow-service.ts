import { GameflowPhaseEnum, GameflowSession } from '@/types/gameflow-session';
import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

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
    return this.makeRequest('GET', '/lol-gameflow/v1/session');
  }

  // 获取当前游戏流程阶段
  async getGameflowPhase(): Promise<GameflowPhaseEnum> {
    return this.makeRequest('GET', '/lol-gameflow/v1/gameflow-phase');
  }

  // 获取 Ready Check 状态
  async getReadyCheckState(): Promise<ReadyCheckState> {
    return this.makeRequest('GET', '/lol-matchmaking/v1/ready-check');
  }

  // 接受 Ready Check
  async acceptReadyCheck(): Promise<void> {
    await this.makeRequest('POST', '/lol-matchmaking/v1/ready-check/accept');
  }

  // 拒绝 Ready Check
  async declineReadyCheck(): Promise<void> {
    await this.makeRequest('POST', '/lol-matchmaking/v1/ready-check/decline');
  }

  // 检查是否有待接受的对局
  async hasReadyCheck(): Promise<boolean> {
    const phase = await this.getGameflowPhase();
    if (phase !== GameflowPhaseEnum.ReadyCheck) {
      return false;
    }
    const readyCheckState = await this.getReadyCheckState();
    return readyCheckState.playerResponse === 'None';
  }

  // 检查是否在游戏中
  async isInGame(): Promise<boolean> {
    const phase = await this.getGameflowPhase();
    return [
      GameflowPhaseEnum.ChampSelect,
      GameflowPhaseEnum.GameStart,
      GameflowPhaseEnum.InProgress,
      GameflowPhaseEnum.Reconnect,
      GameflowPhaseEnum.WaitingForStats,
      GameflowPhaseEnum.PreEndOfGame,
      GameflowPhaseEnum.EndOfGame,
    ].includes(phase);
  }
}
