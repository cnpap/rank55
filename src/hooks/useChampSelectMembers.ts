import { ref, computed } from 'vue';
import { banPickService } from '@/lib/service/service-manager';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { RankTeam } from '@/types/players-info';
import {
  ChampSelectMemberWithDetails,
  POSITION_ORDER,
} from '@/types/room-management';
import { updateMembersData } from '@/utils/room-management-utils';
import { toast } from 'vue-sonner';

export function useChampSelectMembers() {
  const champSelectMembers = ref<ChampSelectMemberWithDetails[]>([]);

  // 创建5个位置的数组，类似房间的 roomSlots
  const champSelectSlots = computed(() => {
    const slots: (ChampSelectMemberWithDetails | null)[] = Array.from(
      { length: 5 },
      () => null
    );

    // 按位置顺序排列：使用统一的位置常量

    champSelectMembers.value.forEach(member => {
      const positionIndex = POSITION_ORDER.indexOf(
        member.assignedPosition as any
      );
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
      let hasBasicInfoChanged = false;
      champSelectMembers.value = champSelectMembers.value.map(
        existingMember => {
          const updatedMember = myTeam.find(
            m => m.summonerId === existingMember.summonerId
          );
          if (updatedMember) {
            // 检查基础信息是否有变化
            const hasChanged =
              existingMember.championId !== updatedMember.championId ||
              existingMember.assignedPosition !==
                updatedMember.assignedPosition;

            if (hasChanged) {
              hasBasicInfoChanged = true;
            }

            return {
              ...existingMember,
              championId: updatedMember.championId,
              assignedPosition: updatedMember.assignedPosition,
              // 更新其他可能变化的基础信息
              cellId: updatedMember.cellId,
              isLeader: updatedMember.cellId === 0,
              summonerName:
                updatedMember.gameName || existingMember.summonerName,
            };
          }
          return existingMember;
        }
      );

      // 如果有基础信息变化，记录日志
      if (hasBasicInfoChanged) {
        console.log('🎯 英雄选择基础信息更新: 英雄ID、位置等信息已更新');
      }

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

    // 使用通用函数批量加载召唤师数据和排位统计
    const summonerIds = newMembers.map(m => m.summonerId).filter(Boolean);
    const result = await updateMembersData(
      champSelectMembers.value,
      summonerIds
    );

    if (!result.success) {
      console.error('英雄选择成员数据加载失败:', result.error);
      toast.error(result.error || '数据加载失败');
    }
  };

  // 更新英雄选择成员数据
  const updateChampSelectMembers = async (): Promise<void> => {
    try {
      // 获取英雄选择会话数据
      const session: ChampSelectSession =
        await banPickService.getChampSelectSession();
      const { myTeam } = session;

      // 直接调用优化后的增量更新函数
      await fetchChampSelectMembersDetails(myTeam);
    } catch (error) {
      console.error('更新英雄选择成员失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : '获取英雄选择数据失败';
      toast.error(errorMessage);

      // 设置所有成员的错误状态
      champSelectMembers.value.forEach(member => {
        member.isLoading = false;
        member.error = errorMessage;
      });
    }
  };

  return {
    champSelectMembers,
    champSelectSlots,
    updateChampSelectMembers,
  };
}
