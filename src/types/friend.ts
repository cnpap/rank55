// 好友在线状态类型
export type AvailabilityType =
  | 'chat'
  | 'mobile'
  | 'dnd'
  | 'away'
  | 'offline'
  | 'online'
  | 'spectating';

// 好友LOL信息接口
export interface FriendLol {
  bannerIdSelected: string;
  challengeCrystalLevel: string;
  challengePoints: string;
  challengeTokensSelected: string;
  championId: string;
  companionId: string;
  damageSkinId: string;
  gameId: string;
  gameMode: string;
  gameQueueType: string;
  gameStatus: string;
  iconOverride: string;
  initSummoner: string;
  isObservable: string;
  mapId: string;
  mapSkinId: string;
  profileIcon: string;
  queueId: string;
  regalia: string;
  skinVariant: string;
  skinname: string;
  timeStamp: string;
}

// 好友信息接口
export interface Friend {
  availability: string;
  displayGroupId: number;
  displayGroupName: string;
  gameName: string;
  gameTag: string;
  groupId: number;
  groupName: string;
  icon: number;
  id: string;
  isP2PConversationMuted: boolean;
  lastSeenOnlineTimestamp?: any;
  lol: FriendLol;
  name: string;
  note: string;
  patchline: string;
  pid: string;
  platformId: string;
  product: string;
  productName: string;
  puuid: string;
  statusMessage: string;
  summary: string;
  summonerId: number;
  time: number;
}

// 好友分组接口
export interface FriendGroup {
  collapsed: boolean;
  id: number;
  isLocalized: boolean;
  isMetaGroup: boolean;
  name: string;
  priority: number;
}

// 聊天LOL信息接口
export interface ChatLol {
  bannerIdSelected: string;
  challengeCrystalLevel: string;
  challengeTitleSelected: string;
  challengeTokensSelected: string;
  championId: string;
  companionId: string;
  damageSkinId: string;
  gameId: string;
  gameMode: string;
  gameQueueType: string;
  gameStatus: string;
  iconOverride: string;
  initRankStat: string;
  initSummoner: string;
  isObservable: string;
  mapId: string;
  mapSkinId: string;
  pty: string;
  queueId: string;
  regalia: string;
  skinVariant: string;
  skinname: string;
  timeStamp: string;
}

// 聊天人员信息接口
export interface ChatPerson {
  availability: string;
  gameName: string;
  gameTag: string;
  icon: number;
  id: string;
  lastSeenOnlineTimestamp?: any;
  lol: ChatLol;
  name: string;
  obfuscatedSummonerId: number;
  patchline: string;
  pid: string;
  platformId: string;
  product: string;
  productName: string;
  puuid: string;
  statusMessage: string;
  summary: string;
  summonerId: number;
  time: number;
}

// 简化的好友接口（保留原有的接口）
export interface SimpleFriend {
  id: string;
  gameName: string;
  tagLine: string;
  isOnline: boolean;
  isInGame: boolean;
}
