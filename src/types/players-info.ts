import { MucJwtDto } from './room';
import { SummonerData } from './summoner';

export interface PlaysInfo {
  timestamp: string;
  currentSummoner: SummonerData;
  basicPlayersInfo: DetailedPlayersInfo;
  detailedPlayersInfo: DetailedPlayersInfo;
}

export type AssignedPosition =
  | 'bottom'
  | 'top'
  | 'middle'
  | 'jungle'
  | 'support';

export interface RankTeam {
  assignedPosition: AssignedPosition;
  // 如果进入游戏就应该使用 selectedPosition
  selectedPosition: AssignedPosition;
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

export interface DetailedPlayersInfo {
  currentSummoner?: SummonerData;
  myTeam: RankTeam[];
  theirTeam: RankTeam[];
  localPlayerCellId: number;
  chatDetails: ChatDetails;
}
