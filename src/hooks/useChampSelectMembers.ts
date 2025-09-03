import { ref, computed } from 'vue';
import { BanPickService } from '@/lib/service/ban-pick-service';
import { SummonerService } from '@/lib/service/summoner-service';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { RankTeam } from '@/types/players-info';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';

export interface ChampSelectMemberWithDetails {
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

export function useChampSelectMembers() {
  const champSelectMembers = ref<ChampSelectMemberWithDetails[]>([]);
  const champSelectError = ref<string | null>(null);

  const banPickService = new BanPickService();
  const summonerService = new SummonerService();

  // 创建5个位置的数组，类似房间的 roomSlots
  const champSelectSlots = computed(() => {
    const slots = Array(5).fill(null);

    // 按位置顺序排列：top, jungle, middle, bottom, support
    const positionOrder = ['top', 'jungle', 'middle', 'bottom', 'support'];

    champSelectMembers.value.forEach(member => {
      const positionIndex = positionOrder.indexOf(member.assignedPosition);
      if (positionIndex !== -1) {
        slots[positionIndex] = member;
      }
    });

    return slots as (ChampSelectMemberWithDetails | null)[];
  });

  // 获取英雄选择成员详细信息 - 修改为增量更新
  const fetchChampSelectMembersDetails = async (
    myTeam: RankTeam[]
  ): Promise<void> => {
    // 创建当前成员的映射
    const currentMemberMap = new Map(
      champSelectMembers.value.map(m => [m.summonerId, m])
    );
    const newMemberMap = new Map(myTeam.map(m => [m.summonerId, m]));

    // 找出新增的成员
    const newMembers = myTeam.filter(m => !currentMemberMap.has(m.summonerId));
    // 找出离开的成员
    const leftMemberIds = champSelectMembers.value
      .filter(m => !newMemberMap.has(m.summonerId))
      .map(m => m.summonerId);

    // 如果没有变化，只更新基本信息（英雄ID、位置等）
    if (newMembers.length === 0 && leftMemberIds.length === 0) {
      champSelectMembers.value = champSelectMembers.value.map(
        existingMember => {
          const updatedMember = myTeam.find(
            m => m.summonerId === existingMember.summonerId
          );
          if (updatedMember) {
            return {
              ...existingMember,
              championId: updatedMember.championId,
              assignedPosition: updatedMember.assignedPosition,
            };
          }
          return existingMember;
        }
      );
      return;
    }

    console.log(
      `🎯 英雄选择成员变动: 新增 ${newMembers.length} 人，离开 ${leftMemberIds.length} 人`
    );

    // 移除离开的成员
    if (leftMemberIds.length > 0) {
      champSelectMembers.value = champSelectMembers.value.filter(
        m => !leftMemberIds.includes(m.summonerId)
      );
    }

    // 如果没有新成员，直接返回
    if (newMembers.length === 0) {
      return;
    }

    // 为新成员添加基本信息
    const newMembersWithDetails: ChampSelectMemberWithDetails[] =
      newMembers.map(member => ({
        summonerId: member.summonerId,
        summonerName: member.gameName || `Player${member.summonerId}`,
        puuid: member.puuid,
        assignedPosition: member.assignedPosition,
        cellId: member.cellId,
        championId: member.championId,
        isLeader: member.cellId === 0,
        isLoading: false,
      }));

    // 添加新成员到列表
    champSelectMembers.value = [
      ...champSelectMembers.value,
      ...newMembersWithDetails,
    ];

    // 只为新成员加载详细信息
    const summonerPromises = newMembers.map(async (member, index) => {
      if (!member.summonerId) return;

      try {
        const summonerData = await summonerService.getSummonerByID(
          member.summonerId
        );

        // 找到对应的成员并更新
        const memberIndex = champSelectMembers.value.findIndex(
          m => m.summonerId === member.summonerId
        );
        if (memberIndex !== -1) {
          champSelectMembers.value[memberIndex] = {
            ...champSelectMembers.value[memberIndex],
            summonerData,
          };
        }
        return { summonerId: member.summonerId, summonerData };
      } catch (error) {
        console.warn(`获取成员 ${member.gameName} 召唤师数据失败:`, error);
        return null;
      }
    });

    const summonerResults = await Promise.all(summonerPromises);

    // 为新成员加载排位统计
    const rankedPromises = summonerResults.map(async result => {
      if (!result?.summonerData?.puuid) return null;

      const { summonerId, summonerData } = result;
      try {
        const rankedStats = await summonerService.getRankedStats(
          summonerData.puuid
        );

        // 找到对应的成员并更新排位统计
        const memberIndex = champSelectMembers.value.findIndex(
          m => m.summonerId === summonerId
        );
        if (memberIndex !== -1) {
          champSelectMembers.value[memberIndex] = {
            ...champSelectMembers.value[memberIndex],
            rankedStats,
          };
        }
        return { summonerId, rankedStats };
      } catch (error) {
        console.warn(`获取排位统计失败:`, error);
        return null;
      }
    });

    await Promise.all(rankedPromises);
  };

  // 更新英雄选择成员数据
  const updateChampSelectMembers = async (): Promise<void> => {
    champSelectError.value = null;

    try {
      // 获取英雄选择会话数据
      const session: ChampSelectSession =
        await banPickService.getChampSelectSession();
      const { myTeam } = session;

      // 直接调用优化后的增量更新函数
      await fetchChampSelectMembersDetails(myTeam);
    } catch (error) {
      console.error('更新英雄选择成员失败:', error);
      champSelectError.value = '获取英雄选择数据失败';
    }
  };

  return {
    champSelectMembers,
    champSelectError,
    champSelectSlots,
    updateChampSelectMembers,
  };
}
