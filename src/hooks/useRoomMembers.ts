import { ref, computed } from 'vue';
import { roomService } from '@/lib/service/service-manager';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import type { Room, Member } from '@/types/room';
import type { MemberWithDetails } from '@/types/room-management';
import { updateMembersData } from '@/utils/room-management-utils';
import { toast } from 'vue-sonner';

export function useRoomMembers() {
  const currentRoom = ref<Room | null>(null);
  const roomMembers = ref<MemberWithDetails[]>([]);

  // 创建5个位置的数组，类似其他 hooks 的 slots 模式
  const roomSlots = computed(() => {
    const slots: (MemberWithDetails | null)[] = Array.from(
      { length: 5 },
      () => null
    );

    // 填充房间成员到对应位置
    roomMembers.value.forEach((member, index) => {
      if (index < 5) {
        slots[index] = member;
      }
    });

    return slots as (MemberWithDetails | null)[];
  });

  // 判断当前用户是否有踢人权限
  const canKickMembers = computed(() => {
    return currentRoom.value?.localMember?.allowedKickOthers === true;
  });

  // 获取房间成员详细信息 - 使用缓存优化
  const fetchRoomMembersDetails = async (members: Member[]): Promise<void> => {
    // 创建当前成员的映射
    const currentMemberMap = new Map(
      roomMembers.value.map(m => [m.summonerId, m])
    );
    const newMemberMap = new Map(members.map(m => [m.summonerId, m]));

    // 找出新增的成员
    const newMembers = members.filter(m => !currentMemberMap.has(m.summonerId));
    // 找出离开的成员
    const leftMemberIds = roomMembers.value
      .filter(m => !newMemberMap.has(m.summonerId))
      .map(m => m.summonerId);

    // 如果没有变化，直接返回
    if (newMembers.length === 0 && leftMemberIds.length === 0) {
      return;
    }

    console.log(
      `🏠 房间成员变动: 新增 ${newMembers.length} 人，离开 ${leftMemberIds.length} 人`
    );

    // 移除离开的成员
    if (leftMemberIds.length > 0) {
      roomMembers.value = roomMembers.value.filter(
        m => !leftMemberIds.includes(m.summonerId)
      );
    }

    // 如果没有新成员，直接返回
    if (newMembers.length === 0) {
      return;
    }

    // 为新成员添加基本信息
    const newMembersWithDetails: MemberWithDetails[] = newMembers.map(
      member => ({
        ...member,
        isLoading: false,
      })
    );

    // 添加新成员到列表
    roomMembers.value = [...roomMembers.value, ...newMembersWithDetails];

    // 使用通用函数批量加载召唤师数据和排位统计
    const summonerIds = newMembers.map(m => m.summonerId).filter(Boolean);
    const result = await updateMembersData(roomMembers.value, summonerIds);

    if (!result.success) {
      console.error('房间成员数据加载失败:', result.error);
      toast.error(result.error || '房间成员数据加载失败');
    }
  };

  // 更新房间信息
  const updateRoomMembers = async (
    currentPhase: GameflowPhaseEnum
  ): Promise<void> => {
    // 只在真正的Lobby阶段才调用房间API
    if (currentPhase !== GameflowPhaseEnum.Lobby) {
      console.log('🏠 当前不在房间阶段，跳过房间API调用');
      return;
    }

    try {
      // 直接获取房间和成员信息
      const room = await roomService.getCurrentLobby();
      currentRoom.value = room;

      const members = await roomService.getLobbyMembers();
      await fetchRoomMembersDetails(members);
    } catch (error) {
      console.error('更新房间信息失败:', error);

      // 获取房间信息失败，清理数据
      currentRoom.value = null;
      roomMembers.value = [];
    }
  };

  // 踢出成员
  const kickMember = async (
    summonerId: number,
    currentPhase: GameflowPhaseEnum
  ): Promise<void> => {
    // 前置权限检查
    if (currentPhase !== GameflowPhaseEnum.Lobby || !canKickMembers.value) {
      console.warn('当前阶段或权限不允许踢人操作');
      toast.error('当前阶段或权限不允许踢人操作');
      return;
    }

    try {
      await roomService.kickMember(summonerId);
      await updateRoomMembers(currentPhase);
      toast.success('成员已被踢出');
    } catch (error) {
      console.error('踢出成员失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : '踢出成员失败';
      toast.error(errorMessage);
    }
  };

  // 清理房间数据
  const clearRoomData = (): void => {
    currentRoom.value = null;
    roomMembers.value = [];
    console.log('🏠 已清理房间数据');
  };

  return {
    currentRoom,
    roomMembers,
    roomSlots,
    canKickMembers,
    updateRoomMembers,
    kickMember,
    clearRoomData,
  };
}
