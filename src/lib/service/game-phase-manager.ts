import { ref, type Ref } from 'vue';
import { gameflowService, sessionStorageService } from './service-manager';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { $local } from '@/storages/storage-use';

export interface GamePhaseState {
  currentPhase: GameflowPhaseEnum | null;
  lastPhase: GameflowPhaseEnum | null;
  actionStartTime: number | null;
  currentActionType: 'ban' | 'pick' | null;
}

export class GamePhaseManager {
  private state: Ref<GamePhaseState>;

  constructor() {
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
  }

  async getCurrentPhase(): Promise<GameflowPhaseEnum> {
    const phase = await gameflowService.getGameflowPhase();
    this.state.value.lastPhase = this.state.value.currentPhase;
    this.state.value.currentPhase = phase;
    return phase;
  }

  async handleGameStartPhase() {
    // 使用 gameflowService 获取完整的游戏会话信息
    const gameflowSession = await gameflowService.getGameflowSession();

    // 从 gameflowSession 中提取需要的信息来构建 ChampSelectSession
    // 或者直接保存 gameflowSession
    await sessionStorageService.saveGameflowSession(gameflowSession);
    return gameflowSession;
  }

  setActionState(type: 'ban' | 'pick'): void {
    if (this.state.value.currentActionType !== type) {
      this.state.value.actionStartTime = Date.now();
      this.state.value.currentActionType = type;
      const countdownKey =
        type === 'ban' ? 'autoBanCountdown' : 'autoPickCountdown';
      const countdown = $local.getItem(countdownKey) || 5;
      console.log(`🕐 开始 ${type} 阶段倒计时 ${countdown} 秒`);
    }
  }

  getRemainingTime(countdown: number): number {
    const elapsed = Date.now() - (this.state.value.actionStartTime || 0);
    return Math.max(0, countdown * 1000 - elapsed);
  }
}
