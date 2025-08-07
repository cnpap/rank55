export interface PlaysInfo {
  timestamp: string;
  currentSummoner: CurrentSummoner;
  basicPlayersInfo: BasicPlayersInfo;
  detailedPlayersInfo: DetailedPlayersInfo;
}

export interface CurrentSummoner {
  accountId: number;
  displayName: string;
  gameName: string;
  internalName: string;
  nameChangeFlag: boolean;
  percentCompleteForNextLevel: number;
  privacy: string;
  profileIconId: number;
  puuid: string;
  rerollPoints: RerollPoints;
  summonerId: number;
  summonerLevel: number;
  tagLine: string;
  unnamed: boolean;
  xpSinceLastLevel: number;
  xpUntilNextLevel: number;
}

export interface RerollPoints {
  currentPoints: number;
  maxRolls: number;
  numberOfRolls: number;
  pointsCostToRoll: number;
  pointsToReroll: number;
}

export interface BasicPlayersInfo {
  myTeam: MyTeam[];
  theirTeam: TheirTeam[];
  localPlayerCellId: number;
  chatDetails: ChatDetails;
}

export interface MyTeam {
  assignedPosition:
    | 'assignedPosition'
    | 'bottom'
    | 'top'
    | 'middle'
    | 'jungle'
    | 'string'
    | 'utility';
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  internalName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  pickMode: number;
  pickTurn: number;
  playerAlias: string;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
  wardSkinId: number;
}

export interface TheirTeam {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  internalName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  pickMode: number;
  pickTurn: number;
  playerAlias: string;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
  wardSkinId: number;
}

export interface ChatDetails {
  mucJwtDto: MucJwtDto;
  multiUserChatId: string;
  multiUserChatPassword: string;
}

export interface MucJwtDto {
  channelClaim: string;
  domain: string;
  jwt: string;
  targetRegion: string;
}

export interface DetailedPlayersInfo {
  currentSummoner: CurrentSummoner2;
  myTeam: MyTeam2[];
  theirTeam: TheirTeam2[];
  localPlayerCellId: number;
  chatDetails: ChatDetails2;
}

export interface CurrentSummoner2 {
  accountId: number;
  displayName: string;
  gameName: string;
  internalName: string;
  nameChangeFlag: boolean;
  percentCompleteForNextLevel: number;
  privacy: string;
  profileIconId: number;
  puuid: string;
  rerollPoints: RerollPoints2;
  summonerId: number;
  summonerLevel: number;
  tagLine: string;
  unnamed: boolean;
  xpSinceLastLevel: number;
  xpUntilNextLevel: number;
}

export interface RerollPoints2 {
  currentPoints: number;
  maxRolls: number;
  numberOfRolls: number;
  pointsCostToRoll: number;
  pointsToReroll: number;
}

export interface MyTeam2 {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  internalName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  pickMode: number;
  pickTurn: number;
  playerAlias: string;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
  wardSkinId: number;
  rankedInfo?: RankedInfo;
  isLocalPlayer: boolean;
}

export interface RankedInfo {
  currentSeasonSplitPoints: number;
  earnedRegaliaRewardIds: any[];
  highestCurrentSeasonReachedTierSR: string;
  highestPreviousSeasonEndDivision: string;
  highestPreviousSeasonEndTier: string;
  highestRankedEntry: HighestRankedEntry;
  highestRankedEntrySR: HighestRankedEntrySr;
  previousSeasonSplitPoints: number;
  queueMap: QueueMap;
  queues: Queue[];
  rankedRegaliaLevel: number;
  seasons: Seasons;
  splitsProgress: SplitsProgress;
}

export interface HighestRankedEntry {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface HighestRankedEntrySr {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface QueueMap {
  RANKED_FLEX_SR: RankedFlexSr;
  RANKED_SOLO_5x5: RankedSolo5x5;
  RANKED_TFT: RankedTft;
  RANKED_TFT_DOUBLE_UP: RankedTftDoubleUp;
  RANKED_TFT_TURBO: RankedTftTurbo;
}

export interface RankedFlexSr {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface RankedSolo5x5 {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface RankedTft {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface RankedTftDoubleUp {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface RankedTftTurbo {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface Queue {
  currentSeasonWinsForRewards: number;
  division: string;
  highestDivision: string;
  highestTier: string;
  isProvisional: boolean;
  leaguePoints: number;
  losses: number;
  miniSeriesProgress: string;
  previousSeasonEndDivision: string;
  previousSeasonEndTier: string;
  previousSeasonHighestDivision: string;
  previousSeasonHighestTier: string;
  previousSeasonWinsForRewards: number;
  provisionalGameThreshold: number;
  provisionalGamesRemaining: number;
  queueType: string;
  ratedRating: number;
  ratedTier: string;
  tier: string;
  warnings: any;
  wins: number;
}

export interface Seasons {
  RANKED_FLEX_SR: RankedFlexSr2;
  RANKED_SOLO_5x5: RankedSolo5x52;
  RANKED_TFT: RankedTft2;
  RANKED_TFT_DOUBLE_UP: RankedTftDoubleUp2;
  RANKED_TFT_TURBO: RankedTftTurbo2;
}

export interface RankedFlexSr2 {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}

export interface RankedSolo5x52 {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}

export interface RankedTft2 {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}

export interface RankedTftDoubleUp2 {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}

export interface RankedTftTurbo2 {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}

export interface SplitsProgress {}

export interface TheirTeam2 {
  assignedPosition: string;
  cellId: number;
  championId: number;
  championPickIntent: number;
  gameName: string;
  internalName: string;
  isHumanoid: boolean;
  nameVisibilityType: string;
  obfuscatedPuuid: string;
  obfuscatedSummonerId: number;
  pickMode: number;
  pickTurn: number;
  playerAlias: string;
  playerType: string;
  puuid: string;
  selectedSkinId: number;
  spell1Id: number;
  spell2Id: number;
  summonerId: number;
  tagLine: string;
  team: number;
  wardSkinId: number;
  rankedInfo: any;
  isLocalPlayer: boolean;
}

export interface ChatDetails2 {
  mucJwtDto: MucJwtDto2;
  multiUserChatId: string;
  multiUserChatPassword: string;
}

export interface MucJwtDto2 {
  channelClaim: string;
  domain: string;
  jwt: string;
  targetRegion: string;
}
