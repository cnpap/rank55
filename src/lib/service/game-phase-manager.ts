import { ref, type Ref } from 'vue';
import { GameflowService } from './gameflow-service';
import { BanPickService } from './ban-pick-service';
import { SessionStorageService } from './session-storage-service';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { RankTeam } from '@/types/players-info';

export interface GamePhaseState {
  currentPhase: GameflowPhaseEnum | null;
  lastPhase: GameflowPhaseEnum | null;
  actionStartTime: number | null;
  currentActionType: 'ban' | 'pick' | null;
  actionExecuted: boolean;
}

export class GamePhaseManager {
  private gameflowService: GameflowService;
  private sessionStorage: SessionStorageService;
  private state: Ref<GamePhaseState>;

  constructor() {
    this.gameflowService = new GameflowService();
    this.sessionStorage = new SessionStorageService();
    this.state = ref({
      currentPhase: null,
      lastPhase: null,
      actionStartTime: null,
      currentActionType: null,
      actionExecuted: false,
    });
  }

  get currentState(): GamePhaseState {
    return this.state.value;
  }

  resetActionState(): void {
    this.state.value.actionStartTime = null;
    this.state.value.currentActionType = null;
    this.state.value.actionExecuted = false;
  }

  async getCurrentPhase(): Promise<GameflowPhaseEnum> {
    const phase = await this.gameflowService.getGameflowPhase();
    this.state.value.lastPhase = this.state.value.currentPhase;
    this.state.value.currentPhase = phase;
    return phase;
  }

  async checkGameStartCondition(): Promise<boolean> {
    // 直接检查游戏阶段是否为 GameStart
    const currentPhase = await this.gameflowService.getGameflowPhase();

    if (currentPhase === GameflowPhaseEnum.GameStart) {
      console.log('🎮 检测到游戏开始阶段，正在获取完整的游戏会话信息...');

      // 使用 gameflowService 获取完整的游戏会话信息
      const gameflowSession = await this.gameflowService.getGameflowSession();

      // 从 gameflowSession 中提取需要的信息来构建 ChampSelectSession
      // 或者直接保存 gameflowSession
      await this.sessionStorage.saveGameflowSession(gameflowSession);
      return true;
    }

    return false;
  }

  setActionState(type: 'ban' | 'pick'): void {
    if (
      this.state.value.currentActionType !== type ||
      this.state.value.actionExecuted
    ) {
      this.state.value.actionStartTime = Date.now();
      this.state.value.currentActionType = type;
      this.state.value.actionExecuted = false;
      console.log(`🕐 开始 ${type} 阶段倒计时`);
    }
  }

  markActionExecuted(): void {
    this.state.value.actionExecuted = true;
  }

  getRemainingTime(countdown: number): number {
    const elapsed = Date.now() - (this.state.value.actionStartTime || 0);
    return Math.max(0, countdown * 1000 - elapsed);
  }
}
