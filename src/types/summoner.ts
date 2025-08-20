export interface SummonerLedge {
  id: number;
  puuid: string;
  accountId: number;
  name: string;
  internalName: string;
  profileIconId: number;
  level: number;
  expPoints: number;
  levelAndXpVersion: number;
  revisionId: number;
  revisionDate: number;
  lastGameDate: number;
  nameChangeFlag: boolean;
  unnamed: boolean;
  privacy: string;
  expToNextLevel: number;
}

export interface SummonerData {
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
