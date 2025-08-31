import { inject, type Ref } from 'vue';
import type { SummonerData } from '@/types/summoner';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { GamePhaseManager } from '../service/game-phase-manager';

export interface GameState {
  currentPhase: Ref<GameflowPhaseEnum>;
  clientUser: Ref<SummonerData | null>;
  gamePhaseManager: GamePhaseManager;
}

export function useGameState(): GameState {
  const gameState = inject<GameState>('gameState');

  if (!gameState) {
    throw new Error(
      'useGameState must be used within a component that has access to gameState'
    );
  }

  return gameState;
}
