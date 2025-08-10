import { AllAction, Timer } from './ban-phase-detail';
import { ChatDetails, RankTeam } from './players-info';

export interface ChampSelectSession {
  actions: AllAction[][];
  allowBattleBoost: boolean;
  allowDuplicatePicks: boolean;
  allowLockedEvents: boolean;
  allowRerolling: boolean;
  allowSkinSelection: boolean;
  allowSubsetChampionPicks: boolean;
  bans: Bans;
  benchChampions: any[];
  benchEnabled: boolean;
  boostableSkinCount: number;
  chatDetails: ChatDetails;
  counter: number;
  gameId: number;
  hasSimultaneousBans: boolean;
  hasSimultaneousPicks: boolean;
  id: string;
  isCustomGame: boolean;
  isLegacyChampSelect: boolean;
  isSpectating: boolean;
  localPlayerCellId: number;
  lockedEventIndex: number;
  myTeam: RankTeam[];
  pickOrderSwaps: any[];
  positionSwaps: any[];
  queueId: number;
  rerollsRemaining: number;
  showQuitButton: boolean;
  skipChampionSelect: boolean;
  theirTeam: RankTeam[];
  timer: Timer;
  trades: any[];
}

export interface Bans {
  myTeamBans: number[];
  numBans: number;
  theirTeamBans: number[];
}
