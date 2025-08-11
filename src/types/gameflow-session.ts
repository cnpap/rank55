export interface GameflowSessionResponse {
  timestamp: string;
  gameflowPhase: string;
  isInMatchmaking: boolean;
  hasReadyCheck: boolean;
  isInGame: boolean;
  gameflowSession: GameflowSession;
  readyCheckState: any;
  statusSummary: StatusSummary;
}

// 游戏流程状态枚举
export enum GameflowPhaseEnum {
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

export interface GameflowSession {
  gameClient: GameClient;
  gameData: GameData;
  gameDodge: GameDodge;
  map: Map;
  phase: GameflowPhaseEnum;
}

export interface GameClient {
  observerServerIp: string;
  observerServerPort: number;
  running: boolean;
  serverIp: string;
  serverPort: number;
  visible: boolean;
}

export interface GameData {
  gameId: number;
  gameName: string;
  isCustomGame: boolean;
  password: string;
  playerChampionSelections: any[];
  queue: Queue;
  spectatorsAllowed: boolean;
  teamOne: any[];
  teamTwo: any[];
}

export interface Queue {
  allowablePremadeSizes: number[];
  areFreeChampionsAllowed: boolean;
  assetMutator: string;
  category: string;
  championsRequiredToPlay: number;
  description: string;
  detailedDescription: string;
  gameMode: string;
  gameTypeConfig: GameTypeConfig;
  id: number;
  isCustom: boolean;
  isRanked: boolean;
  isTeamBuilderManaged: boolean;
  lastToggledOffTime: number;
  lastToggledOnTime: number;
  mapId: number;
  maximumParticipantListSize: number;
  minLevel: number;
  minimumParticipantListSize: number;
  name: string;
  numPlayersPerTeam: number;
  queueAvailability: string;
  queueRewards: QueueRewards;
  removalFromGameAllowed: boolean;
  removalFromGameDelayMinutes: number;
  shortName: string;
  showPositionSelector: boolean;
  spectatorEnabled: boolean;
  type: string;
}

export interface GameTypeConfig {
  advancedLearningQuests: boolean;
  allowTrades: boolean;
  banMode: string;
  banTimerDuration: number;
  battleBoost: boolean;
  crossTeamChampionPool: boolean;
  deathMatch: boolean;
  doNotRemove: boolean;
  duplicatePick: boolean;
  exclusivePick: boolean;
  id: number;
  learningQuests: boolean;
  mainPickTimerDuration: number;
  maxAllowableBans: number;
  name: string;
  onboardCoopBeginner: boolean;
  pickMode: string;
  postPickTimerDuration: number;
  reroll: boolean;
  teamChampionPool: boolean;
}

export interface QueueRewards {
  isChampionPointsEnabled: boolean;
  isIpEnabled: boolean;
  isXpEnabled: boolean;
  partySizeIpRewards: any[];
}

export interface GameDodge {
  dodgeIds: any[];
  phase: string;
  state: string;
}

export interface Map {
  assets: Assets;
  categorizedContentBundles: CategorizedContentBundles;
  description: string;
  gameMode: string;
  gameModeName: string;
  gameModeShortName: string;
  gameMutator: string;
  id: number;
  isRGM: boolean;
  mapStringId: string;
  name: string;
  perPositionDisallowedSummonerSpells: PerPositionDisallowedSummonerSpells;
  perPositionRequiredSummonerSpells: PerPositionRequiredSummonerSpells;
  platformId: string;
  platformName: string;
  properties: Properties;
}

export interface Assets {
  'champ-select-background-sound': string;
  'champ-select-flyout-background': string;
  'champ-select-planning-intro': string;
  'game-select-icon-active': string;
  'game-select-icon-active-video': string;
  'game-select-icon-default': string;
  'game-select-icon-disabled': string;
  'game-select-icon-hover': string;
  'game-select-icon-intro-video': string;
  'gameflow-background': string;
  'gameflow-background-dark': string;
  'gameselect-button-hover-sound': string;
  'icon-defeat': string;
  'icon-defeat-v2': string;
  'icon-defeat-video': string;
  'icon-empty': string;
  'icon-hover': string;
  'icon-leaver': string;
  'icon-leaver-v2': string;
  'icon-loss-forgiven-v2': string;
  'icon-v2': string;
  'icon-victory': string;
  'icon-victory-video': string;
  'map-north': string;
  'map-south': string;
  'music-inqueue-loop-sound': string;
  'parties-background': string;
  'postgame-ambience-loop-sound': string;
  'ready-check-background': string;
  'ready-check-background-sound': string;
  'sfx-ambience-pregame-loop-sound': string;
  'social-icon-leaver': string;
  'social-icon-victory': string;
}

export interface CategorizedContentBundles {}

export interface PerPositionDisallowedSummonerSpells {}

export interface PerPositionRequiredSummonerSpells {}

export interface Properties {
  suppressRunesMasteriesPerks: boolean;
}

export interface StatusSummary {
  phase: string;
  description: string;
}
