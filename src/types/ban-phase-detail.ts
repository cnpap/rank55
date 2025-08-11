export interface BanPhaseDetail {
  isInChampSelect: boolean;
  isBanPhase: boolean;
  timerPhase: string;
  localPlayerCellId: number;
  timer: Timer;
  banActions: BanAction[];
  allActions: AllAction[][];
  timestamp: string;
}

export interface Timer {
  adjustedTimeLeftInPhase: number;
  internalNowInEpochMs: number;
  isInfinite: boolean;
  phase: string;
  totalTimeInPhase: number;
}

export interface BanAction {
  groupIndex: number;
  actionIndex: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  pickTurn: number;
  type: 'ban' | 'pick';
  isLocalPlayer: boolean;
}

export interface AllAction {
  actorCellId: number;
  championId: number;
  completed: boolean;
  id: number;
  isAllyAction: boolean;
  isInProgress: boolean;
  pickTurn: number;
  type: 'ban' | 'pick' | 'ten_bans_reveal';
}
