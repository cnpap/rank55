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
  private banpickService: BanPickService;
  private sessionStorage: SessionStorageService;
  private state: Ref<GamePhaseState>;

  constructor() {
    this.gameflowService = new GameflowService();
    this.banpickService = new BanPickService();
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
    try {
      const session = await this.banpickService.getChampSelectSession();
      const { actions, myTeam, theirTeam } = session;
      const flatActions = actions.flat();

      // 检查所有操作是否都完成了
      const allActionsCompleted = flatActions.every(a => a.completed);
      if (!allActionsCompleted) {
        return false;
      }

      // 检查是否等待到玩家信息了
      const rankTeams: RankTeam[] = myTeam.concat(theirTeam);
      const allPlayersReady = rankTeams.every(man => man.summonerId !== 0);

      if (allActionsCompleted && allPlayersReady) {
        console.log('🎮 检测到游戏即将开始，正在持久化 session...');
        await this.sessionStorage.saveSession(session);
        return true;
      }

      return false;
    } catch (error) {
      console.error('检查游戏开始条件时出错:', error);
      return false;
    }
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
