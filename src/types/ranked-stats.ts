export interface RankedStats {
  currentSeasonSplitPoints: number;
  earnedRegaliaRewardIds: any[];
  highestCurrentSeasonReachedTierSR: string;
  highestPreviousSeasonEndDivision: string;
  highestPreviousSeasonEndTier: string;
  highestRankedEntry: Queue;
  highestRankedEntrySR: Queue;
  previousSeasonSplitPoints: number;
  queueMap: QueueMap;
  queues: Queue[];
  rankedRegaliaLevel: number;
  seasons: Seasons;
  splitsProgress: any;
}

export interface QueueMap {
  RANKED_FLEX_SR: Queue;
  RANKED_SOLO_5x5: Queue;
  RANKED_TFT: Queue;
  RANKED_TFT_DOUBLE_UP: Queue;
  RANKED_TFT_TURBO: Queue;
}

export interface Queue {
  currentSeasonWinsForRewards?: number;
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
  RANKED_FLEX_SR: RankedSeason;
  RANKED_SOLO_5x5: RankedSeason;
  RANKED_TFT: RankedSeason;
  RANKED_TFT_DOUBLE_UP: RankedSeason;
  RANKED_TFT_TURBO: RankedSeason;
}

export interface RankedSeason {
  currentSeasonEnd: number;
  currentSeasonId: number;
  nextSeasonStart: number;
}
