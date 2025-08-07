export interface RankedStats {
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
