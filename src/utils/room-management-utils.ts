import { Ref } from 'vue';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import {
  MemberWithDetails,
  ChampSelectMemberWithDetails,
  GameStartMemberWithDetails,
  AnyMemberWithDetails,
  ErrorHandlingResult,
  GamePhaseCategory,
  MemberDataUpdateable,
  GAME_PHASES,
} from '@/types/room-management';
import { summonerDataCache } from '@/lib/service/summoner-data-cache';

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
 * 将ChampSelectMemberWithDetails转换为MemberWithDetails
 */
export function convertChampSelectMemberToMemberWithDetails(
  member: ChampSelectMemberWithDetails
): MemberWithDetails {
  return {
    ...createMemberWithDetailsDefaults(),
    assignedPosition: member.assignedPosition,
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
  } as MemberWithDetails;
}

/**
 * 将GameStartMemberWithDetails转换为MemberWithDetails
 */
export function convertGameStartMemberToMemberWithDetails(
  member: GameStartMemberWithDetails
): MemberWithDetails {
  return {
    ...createMemberWithDetailsDefaults(),
    summonerId: member.summonerId,
    summonerName: member.summonerName,
    isLeader: false, // 游戏开始阶段没有房主概念
    summonerData: member.summonerData,
    rankedStats: member.rankedStats,
    isLoading: member.isLoading,
    error: member.error,
    assignedPosition: member.assignedPosition,
    isOwner: false,
    puuid: '',
    summonerIconId: member.summonerData?.profileIconId || 0,
    summonerLevel: member.summonerData?.summonerLevel || 0,
    teamId: member.teamId,
    championId: member.championId, // 传递英雄ID
  } as MemberWithDetails;
}

/**
 * 计算成员ID数组
 */
export function calculateMemberIds(
  members: (AnyMemberWithDetails | null)[] | null
): string[] {
  if (!members) return [];
  return members
    .filter((member): member is AnyMemberWithDetails => member !== null)
    .map(member => member.summonerId.toString());
}

/**
 * 计算成员详细信息数组
 */
export function calculateMemberDetails(
  members: (AnyMemberWithDetails | null)[] | null
): string[] {
  if (!members) return [];
  return members
    .filter((member): member is AnyMemberWithDetails => member !== null)
    .map(m => {
      // 包含基础信息的变化检测
      const basicInfo = 'isLeader' in m ? `${m.isLeader}` : 'false';
      const positionInfo =
        'firstPositionPreference' in m && 'secondPositionPreference' in m
          ? `${m.firstPositionPreference || ''}-${m.secondPositionPreference || ''}`
          : '';
      const readyInfo = 'ready' in m ? `${m.ready}` : 'true';
      const assignedPos = m.assignedPosition || '';
      // 添加英雄选择阶段特有的字段检测
      const championInfo = 'championId' in m ? `${m.championId || 0}` : '0';
      const cellInfo = 'cellId' in m ? `${m.cellId || 0}` : '0';

      return `${m.summonerId}-${!!m.summonerData}-${!!m.rankedStats}-${basicInfo}-${positionInfo}-${readyInfo}-${assignedPos}-${championInfo}-${cellInfo}`;
    });
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
  champSelectSlots: (ChampSelectMemberWithDetails | null)[]
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
  gameStartSlots: (GameStartMemberWithDetails | null)[]
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
  const newSlots: (MemberWithDetails | null)[] = Array.from(
    { length: 5 },
    () => null
  );

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
  champSelectSlots: (ChampSelectMemberWithDetails | null)[],
  gameStartSlots: (GameStartMemberWithDetails | null)[],
  roomMembers: MemberWithDetails[],
  cachedSlots: (MemberWithDetails | null)[],
  lastPhase: Ref<GameflowPhaseEnum | null>,
  lastMemberIds: Ref<string>,
  lastMemberDetails: Ref<string>
): (MemberWithDetails | null)[] {
  let currentMemberIds: string[] = [];
  let currentMemberDetails: string[] = [];

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
    currentMemberIds.join(','),
    lastMemberIds.value,
    currentMemberDetails.join(','),
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
  lastMemberIds.value = currentMemberIds.join(',');
  lastMemberDetails.value = currentMemberDetails.join(',');

  return newSlots;
}

/**
 * 通用的成员数据更新函数 - 批量加载召唤师数据和排位统计
 * 这个函数可以被所有hooks复用，避免重复代码
 * 增强了错误处理和重试机制
 */
export async function updateMembersData<T extends MemberDataUpdateable>(
  members: T[],
  summonerIds: number[],
  maxRetries: number = 2
): Promise<ErrorHandlingResult> {
  let retryCount = 0;

  // 设置加载状态
  members.forEach(member => {
    if (summonerIds.includes(member.summonerId)) {
      member.isLoading = true;
      member.error = undefined;
    }
  });

  while (retryCount <= maxRetries) {
    try {
      // 第一阶段：使用缓存服务批量加载召唤师数据
      const summonerDataMap =
        await summonerDataCache.batchGetSummonerData(summonerIds);

      // 更新召唤师基本数据
      for (const [summonerId, summonerData] of summonerDataMap) {
        const memberIndex = members.findIndex(m => m.summonerId === summonerId);
        if (memberIndex !== -1) {
          members[memberIndex] = {
            ...members[memberIndex],
            summonerData: summonerData || undefined,
            isLoading: true, // 继续加载排位数据
          };
        }
      }

      // 第二阶段：使用缓存服务批量加载排位统计
      const rankedRequests = Array.from(summonerDataMap.entries())
        .filter(([_, summonerData]) => summonerData?.puuid)
        .map(([summonerId, summonerData]) => ({
          summonerId,
          puuid: summonerData!.puuid,
        }));

      const rankedStatsMap =
        await summonerDataCache.batchGetRankedStats(rankedRequests);

      // 更新排位统计数据并清除加载状态
      for (const summonerId of summonerIds) {
        const memberIndex = members.findIndex(m => m.summonerId === summonerId);
        if (memberIndex !== -1) {
          const rankedStats = rankedStatsMap.get(summonerId);
          members[memberIndex] = {
            ...members[memberIndex],
            rankedStats: rankedStats || undefined,
            isLoading: false,
            error: undefined,
          };
        }
      }

      return { success: true, retryCount };
    } catch (error) {
      retryCount++;
      console.warn(
        `成员数据更新失败 (尝试 ${retryCount}/${maxRetries + 1}):`,
        error
      );

      if (retryCount > maxRetries) {
        // 最终失败，设置错误状态
        const errorMessage =
          error instanceof Error ? error.message : '数据加载失败';
        members.forEach(member => {
          if (summonerIds.includes(member.summonerId)) {
            member.isLoading = false;
            member.error = errorMessage;
          }
        });

        return {
          success: false,
          error: errorMessage,
          retryCount,
        };
      }

      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }

  return { success: false, error: '未知错误', retryCount };
}

/**
 * 游戏阶段管理器 - 统一管理所有阶段相关的判断逻辑
 */
export class GamePhaseManager {
  /**
   * 获取阶段分类
   */
  static getPhaseCategory(phase: GameflowPhaseEnum): GamePhaseCategory {
    if (GAME_PHASES.IDLE.includes(phase)) {
      return GamePhaseCategory.Idle;
    }
    if (GAME_PHASES.LOBBY.includes(phase)) {
      return GamePhaseCategory.Lobby;
    }
    if (GAME_PHASES.CHAMP_SELECT.includes(phase)) {
      return GamePhaseCategory.ChampSelect;
    }
    if (GAME_PHASES.GAME_START.includes(phase)) {
      return GamePhaseCategory.GameStart;
    }
    if (GAME_PHASES.GAME_END.includes(phase)) {
      return GamePhaseCategory.GameEnd;
    }
    return GamePhaseCategory.Unknown;
  }

  /**
   * 判断是否为空闲阶段
   */
  static isIdlePhase(phase: GameflowPhaseEnum): boolean {
    return GAME_PHASES.IDLE.includes(phase);
  }

  /**
   * 判断是否为大厅阶段
   */
  static isLobbyPhase(phase: GameflowPhaseEnum): boolean {
    return GAME_PHASES.LOBBY.includes(phase);
  }

  /**
   * 判断是否为英雄选择阶段
   */
  static isChampSelectPhase(phase: GameflowPhaseEnum): boolean {
    return GAME_PHASES.CHAMP_SELECT.includes(phase);
  }

  /**
   * 判断是否为游戏开始阶段（需要两排布局）
   */
  static isGameStartPhase(phase: GameflowPhaseEnum): boolean {
    return GAME_PHASES.GAME_START.includes(phase);
  }

  /**
   * 判断是否为游戏结束阶段
   */
  static isGameEndPhase(phase: GameflowPhaseEnum): boolean {
    return GAME_PHASES.GAME_END.includes(phase);
  }

  /**
   * 判断是否为需要轮询的阶段
   */
  static shouldPoll(phase: GameflowPhaseEnum): boolean {
    return (
      this.isLobbyPhase(phase) ||
      this.isChampSelectPhase(phase) ||
      this.isGameStartPhase(phase)
    );
  }

  /**
   * 判断是否需要清理缓存
   */
  static shouldClearCache(phase: GameflowPhaseEnum): boolean {
    return this.isGameEndPhase(phase);
  }

  /**
   * 判断是否应该清理数据但不清理缓存（空闲阶段）
   */
  static shouldClearDataOnly(phase: GameflowPhaseEnum): boolean {
    return this.isIdlePhase(phase);
  }
}

/**
 * 判断是否为游戏开始阶段（需要两排布局）
 * @deprecated 使用 GamePhaseManager.isGameStartPhase 替代
 */
export function isGameStartPhase(currentPhase: GameflowPhaseEnum): boolean {
  return GamePhaseManager.isGameStartPhase(currentPhase);
}
