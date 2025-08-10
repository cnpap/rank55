import { AllAction, Timer } from './ban-phase-detail';
import { GameflowSession } from './gameflow-session';

export interface GamePhaseInfo {
  timestamp: string;
  gamePhase: string;
  gameflowSession: GameflowSession;
  isInChampSelect: boolean;
  champSelectInfo: ChampSelectInfo;
}

export interface ChampSelectInfo {
  phase: string;
  isInProgress: boolean;
  actions: AllAction[][];
  localPlayerCellId: number;
  timer: Timer;
}
