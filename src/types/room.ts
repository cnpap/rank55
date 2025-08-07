export interface Room {
  canStartActivity: boolean;
  gameConfig: GameConfig;
  invitations: Invitation[];
  localMember: LocalMember;
  members: Member[];
  mucJwtDto: MucJwtDto;
  multiUserChatId: string;
  multiUserChatPassword: string;
  partyId: string;
  partyType: string;
  popularChampions: any[];
  restrictions: any[];
  scarcePositions: string[];
  warnings: any[];
}

export interface GameConfig {
  allowablePremadeSizes: number[];
  customLobbyName: string;
  customMutatorName: string;
  customRewardsDisabledReasons: any[];
  customSpectatorPolicy: string;
  customSpectators: any[];
  customTeam100: any[];
  customTeam200: any[];
  gameMode: string;
  isCustom: boolean;
  isLobbyFull: boolean;
  isTeamBuilderManaged: boolean;
  mapId: number;
  maxHumanPlayers: number;
  maxLobbySize: number;
  maxLobbySpectatorCount: number;
  maxTeamSize: number;
  numPlayersPerTeam: number;
  numberOfTeamsInLobby: number;
  pickType: string;
  premadeSizeAllowed: boolean;
  queueId: number;
  shouldForceScarcePositionSelection: boolean;
  showPositionSelector: boolean;
  showQuickPlaySlotSelection: boolean;
}

export interface Invitation {
  invitationId: string;
  invitationType: string;
  state: string;
  timestamp: string;
  toSummonerId: number;
  toSummonerName: string;
}

export interface LocalMember {
  allowedChangeActivity: boolean;
  allowedInviteOthers: boolean;
  allowedKickOthers: boolean;
  allowedStartActivity: boolean;
  allowedToggleInvite: boolean;
  autoFillEligible: boolean;
  autoFillProtectedForPromos: boolean;
  autoFillProtectedForRemedy: boolean;
  autoFillProtectedForSoloing: boolean;
  autoFillProtectedForStreaking: boolean;
  botChampionId: number;
  botDifficulty: string;
  botId: string;
  botPosition: string;
  botUuid: string;
  firstPositionPreference: string;
  intraSubteamPosition: any;
  isBot: boolean;
  isLeader: boolean;
  isSpectator: boolean;
  memberData: any;
  playerSlots: any[];
  puuid: string;
  ready: boolean;
  secondPositionPreference: string;
  showGhostedBanner: boolean;
  strawberryMapId: any;
  subteamIndex: any;
  summonerIconId: number;
  summonerId: number;
  summonerInternalName: string;
  summonerLevel: number;
  summonerName: string;
  teamId: number;
}

export interface Member {
  allowedChangeActivity: boolean;
  allowedInviteOthers: boolean;
  allowedKickOthers: boolean;
  allowedStartActivity: boolean;
  allowedToggleInvite: boolean;
  autoFillEligible: boolean;
  autoFillProtectedForPromos: boolean;
  autoFillProtectedForRemedy: boolean;
  autoFillProtectedForSoloing: boolean;
  autoFillProtectedForStreaking: boolean;
  botChampionId: number;
  botDifficulty: string;
  botId: string;
  botPosition: string;
  botUuid: string;
  firstPositionPreference: string;
  intraSubteamPosition: any;
  isBot: boolean;
  isLeader: boolean;
  isSpectator: boolean;
  memberData: any;
  playerSlots: any[];
  puuid: string;
  ready: boolean;
  secondPositionPreference: string;
  showGhostedBanner: boolean;
  strawberryMapId: any;
  subteamIndex: any;
  summonerIconId: number;
  summonerId: number;
  summonerInternalName: string;
  summonerLevel: number;
  summonerName: string;
  teamId: number;
}

export interface MucJwtDto {
  channelClaim: string;
  domain: string;
  jwt: string;
  targetRegion: string;
}
