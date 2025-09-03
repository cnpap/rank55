import { Ref } from 'vue';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { Member } from '@/types/room';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import { SgpMatchHistoryResult } from '@/types/match-history-sgp';

export interface MemberWithDetails extends Member {
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: SgpMatchHistoryResult;
  isLoading?: boolean;
  isLoadingSummonerData?: boolean;
  isLoadingRankedStats?: boolean;
  isLoadingMatchHistory?: boolean;
  error?: string;
}

export interface ChampSelectMember {
  // 基本信息来自 RankTeam
  summonerId: number;
  summonerName: string;
  puuid: string;
  assignedPosition: string;
  cellId: number;
  championId: number;
  isLeader: boolean; // 根据 cellId 判断

  // 详细信息
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  isLoading?: boolean;
  error?: string;
}

export interface GameStartMember {
  summonerId: number;
  summonerName: string;
  teamId: number;
  isMyTeam: boolean;
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  isLoading?: boolean;
  error?: string;
}

/**
 * 创建MemberWithDetails的默认字段
 */
function createMemberWithDetailsDefaults(): Partial<MemberWithDetails> {
  return {
    allowedChangeActivity: false,
    allowedInviteOthers: false,
    allowedKickOthers: false,
    allowedStartActivity: false,
    allowedToggleInvite: false,
    autoFillEligible: false,
    autoFillProtectedForPromos: false,
    autoFillProtectedForSoloing: false,
    autoFillProtectedForStreaking: false,
    botChampionId: 0,
    botDifficulty: '',
    botId: '',
    firstPositionPreference: '',
    isBot: false,
    isSpectator: false,
    ready: true,
    secondPositionPreference: '',
    showGhostedBanner: false,
  };
}

/**
 * 将ChampSelectMember转换为MemberWithDetails
 */
export function convertChampSelectMemberToMemberWithDetails(
  member: ChampSelectMember
): MemberWithDetails {
  return {
    summonerId: member.summonerId,
    summonerName: member.summonerName,
    isLeader: member.isLeader,
    summonerData: member.summonerData,
    rankedStats: member.rankedStats,
    isLoading: member.isLoading,
    error: member.error,
    isOwner: member.isLeader,
    puuid: member.puuid,
    summonerIconId: member.summonerData?.profileIconId || 0,
    summonerLevel: member.summonerData?.summonerLevel || 0,
    teamId: 1,
    ...createMemberWithDetailsDefaults(),
  } as MemberWithDetails;
}

/**
 * 将GameStartMember转换为MemberWithDetails
 */
export function convertGameStartMemberToMemberWithDetails(
  member: GameStartMember
): MemberWithDetails {
  return {
    summonerId: member.summonerId,
    summonerName: member.summonerName,
    isLeader: false, // 游戏开始阶段没有房主概念
    summonerData: member.summonerData,
    rankedStats: member.rankedStats,
    isLoading: member.isLoading,
    error: member.error,
    isOwner: false,
    puuid: '',
    summonerIconId: member.summonerData?.profileIconId || 0,
    summonerLevel: member.summonerData?.summonerLevel || 0,
    teamId: member.teamId,
    ...createMemberWithDetailsDefaults(),
  } as MemberWithDetails;
}

/**
 * 计算成员ID字符串
 */
export function calculateMemberIds(
  members:
    | (ChampSelectMember | GameStartMember | MemberWithDetails | null)[]
    | null
): string {
  if (!members) return '';
  return members.map(m => m?.summonerId || 'null').join(',');
}

/**
 * 计算成员详细信息字符串
 */
export function calculateMemberDetails(
  members:
    | (ChampSelectMember | GameStartMember | MemberWithDetails | null)[]
    | null
): string {
  if (!members) return '';
  return members
    .map(m =>
      m ? `${m.summonerId}-${!!m.summonerData}-${!!m.rankedStats}` : 'null'
    )
    .join(',');
}

/**
 * 检查是否需要重新计算显示槽位
 */
export function shouldRecalculateSlots(
  currentPhase: GameflowPhaseEnum,
  lastPhase: GameflowPhaseEnum | null,
  currentMemberIds: string,
  lastMemberIds: string,
  currentMemberDetails: string,
  lastMemberDetails: string
): boolean {
  return (
    lastPhase !== currentPhase ||
    lastMemberIds !== currentMemberIds ||
    lastMemberDetails !== currentMemberDetails
  );
}

/**
 * 计算英雄选择阶段的显示槽位
 */
export function calculateChampSelectSlots(
  champSelectSlots: (ChampSelectMember | null)[]
): (MemberWithDetails | null)[] {
  return champSelectSlots.map(member => {
    if (!member) return null;
    return convertChampSelectMemberToMemberWithDetails(member);
  });
}

/**
 * 计算游戏开始阶段的显示槽位
 */
export function calculateGameStartSlots(
  gameStartSlots: (GameStartMember | null)[]
): (MemberWithDetails | null)[] {
  return gameStartSlots.map(member => {
    if (!member) return null;
    return convertGameStartMemberToMemberWithDetails(member);
  });
}

/**
 * 计算房间阶段的显示槽位
 */
export function calculateRoomSlots(
  roomMembers: MemberWithDetails[]
): (MemberWithDetails | null)[] {
  const newSlots = new Array(5).fill(null);

  // 安全地查找房主
  const leader = roomMembers.find(member => member.isLeader);
  if (leader) {
    newSlots[0] = leader;
  }

  // 填充其他成员到剩余位置
  const otherMembersList = roomMembers.filter(member => !member.isLeader);
  for (let i = 0; i < Math.min(otherMembersList.length, 4); i++) {
    newSlots[i + 1] = otherMembersList[i];
  }

  return newSlots;
}

/**
 * 计算显示槽位的主函数
 */
export function calculateDisplaySlots(
  currentPhase: GameflowPhaseEnum,
  champSelectSlots: (ChampSelectMember | null)[],
  gameStartSlots: (GameStartMember | null)[],
  roomMembers: MemberWithDetails[],
  cachedSlots: (MemberWithDetails | null)[],
  lastPhase: Ref<GameflowPhaseEnum | null>,
  lastMemberIds: Ref<string>,
  lastMemberDetails: Ref<string>
): (MemberWithDetails | null)[] {
  let currentMemberIds = '';
  let currentMemberDetails = '';

  // 根据当前阶段计算成员ID和详细信息
  if (currentPhase === GameflowPhaseEnum.ChampSelect) {
    currentMemberIds = calculateMemberIds(champSelectSlots);
    currentMemberDetails = calculateMemberDetails(champSelectSlots);
  } else if (
    currentPhase === GameflowPhaseEnum.GameStart ||
    currentPhase === GameflowPhaseEnum.InProgress
  ) {
    currentMemberIds = calculateMemberIds(gameStartSlots);
    currentMemberDetails = calculateMemberDetails(gameStartSlots);
  } else {
    currentMemberIds = calculateMemberIds(roomMembers);
    currentMemberDetails = calculateMemberDetails(roomMembers);
  }

  // 检查是否需要重新计算
  const needsRecalculation = shouldRecalculateSlots(
    currentPhase,
    lastPhase.value,
    currentMemberIds,
    lastMemberIds.value,
    currentMemberDetails,
    lastMemberDetails.value
  );

  // 如果没有变化且有缓存，直接返回缓存
  if (!needsRecalculation && cachedSlots.length > 0) {
    return cachedSlots;
  }

  let newSlots: (MemberWithDetails | null)[];

  // 根据当前阶段计算新的槽位
  if (currentPhase === GameflowPhaseEnum.ChampSelect) {
    newSlots = calculateChampSelectSlots(champSelectSlots);
  } else if (
    currentPhase === GameflowPhaseEnum.GameStart ||
    currentPhase === GameflowPhaseEnum.InProgress
  ) {
    newSlots = calculateGameStartSlots(gameStartSlots);
  } else {
    newSlots = calculateRoomSlots(roomMembers);
  }

  console.log('newSlots', newSlots);

  // 更新缓存
  lastPhase.value = currentPhase;
  lastMemberIds.value = currentMemberIds;
  lastMemberDetails.value = currentMemberDetails;

  return newSlots;
}

/**
 * 判断是否为游戏开始阶段（需要两排布局）
 */
export function isGameStartPhase(currentPhase: GameflowPhaseEnum): boolean {
  return (
    currentPhase === GameflowPhaseEnum.GameStart ||
    currentPhase === GameflowPhaseEnum.InProgress
  );
}
