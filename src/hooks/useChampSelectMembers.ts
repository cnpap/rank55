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

  // 获取英雄选择成员详细信息
  const fetchChampSelectMembersDetails = async (
    myTeam: RankTeam[]
  ): Promise<void> => {
    // 第一阶段：立即显示基本信息
    champSelectMembers.value = myTeam.map(member => ({
      summonerId: member.summonerId,
      summonerName: member.gameName || `Player${member.summonerId}`,
      puuid: member.puuid,
      assignedPosition: member.assignedPosition,
      cellId: member.cellId,
      championId: member.championId,
      isLeader: member.cellId === 0, // 通常 cellId 0 是房主
      isLoading: false,
    }));

    // 第二阶段：并行加载召唤师基本数据
    const summonerPromises = myTeam.map(async (member, index) => {
      if (!member.summonerId) return;

      try {
        const summonerData = await summonerService.getSummonerByID(
          member.summonerId
        );
        if (champSelectMembers.value[index]) {
          champSelectMembers.value[index] = {
            ...champSelectMembers.value[index],
            summonerData,
          };
        }
        return { index, summonerData };
      } catch (error) {
        console.warn(`获取成员 ${member.gameName} 召唤师数据失败:`, error);
        return null;
      }
    });

    const summonerResults = await Promise.all(summonerPromises);

    // 第三阶段：加载排位统计
    summonerResults.forEach(async result => {
      if (!result?.summonerData?.puuid) return;

      const { index, summonerData } = result;

      try {
        const rankedStats = await summonerService.getRankedStats(
          summonerData.puuid
        );
        if (champSelectMembers.value[index]) {
          champSelectMembers.value[index] = {
            ...champSelectMembers.value[index],
            rankedStats,
          };
        }
      } catch (error) {
        console.warn(`获取排位统计失败:`, error);
      }
    });
  };

  // 更新英雄选择成员数据
  const updateChampSelectMembers = async (): Promise<void> => {
    champSelectError.value = null;

    // 获取英雄选择会话数据
    const session: ChampSelectSession =
      await banPickService.getChampSelectSession();
    const { myTeam } = session;

    // 检查成员是否有变化
    const currentMemberIds = myTeam.map(m => String(m.summonerId)).sort();
    const existingMemberIds = champSelectMembers.value
      .map(m => String(m.summonerId))
      .sort();

    const hasChanges =
      currentMemberIds.length !== existingMemberIds.length ||
      !currentMemberIds.every((id, index) => id === existingMemberIds[index]);

    if (hasChanges) {
      console.log(
        `🎯 英雄选择成员发生变化，重新获取详细信息: ${myTeam.length} 名成员`
      );
      await fetchChampSelectMembersDetails(myTeam);
    } else {
      console.log(`🎯 英雄选择成员无变化: ${myTeam.length} 名成员`);
      // 更新基本信息但保留详细数据
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
    }
  };

  return {
    champSelectMembers,
    champSelectError,
    champSelectSlots,
    updateChampSelectMembers,
  };
}
