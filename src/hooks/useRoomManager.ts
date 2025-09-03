import { ref, computed } from 'vue';
import {
  roomService,
  summonerService,
  sgpMatchService,
} from '@/lib/service/service-manager';
import type { Room, Member } from '@/types/room';
import type { MemberWithDetails } from '@/types/room-management';

export function useRoomManager() {
  const currentRoom = ref<Room | null>(null);
  const roomMembers = ref<MemberWithDetails[]>([]);
  const isLoadingRoom = ref(false);
  const isLoadingMembers = ref(false);
  const errorMessage = ref<string | null>(null);

  const isLoading = computed(
    () => isLoadingRoom.value || isLoadingMembers.value
  );
  const roomLeader = computed(() =>
    roomMembers.value.find(member => member.isLeader)
  );
  const otherMembers = computed(() =>
    roomMembers.value.filter(member => !member.isLeader)
  );

  const fetchMembersDetails = async (members: Member[]): Promise<void> => {
    // 第一阶段：立即显示基本信息
    roomMembers.value = members.map(member => ({
      ...member,
      isLoading: false,
    }));

    // 第二阶段：并行加载召唤师基本数据
    const summonerPromises = members.map(async (member, index) => {
      if (!member.summonerId) return;

      try {
        const summonerData = await summonerService.getSummonerByID(
          member.summonerId
        );
        if (roomMembers.value[index]) {
          roomMembers.value[index] = {
            ...roomMembers.value[index],
            summonerData,
          };
        }
        return { index, summonerData };
      } catch (error) {
        console.warn(`获取成员 ${member.summonerName} 召唤师数据失败:`, error);
        return null;
      }
    });

    const summonerResults = await Promise.all(summonerPromises);

    // 第三阶段：基于召唤师数据加载排位和历史记录
    summonerResults.forEach(async result => {
      if (!result?.summonerData?.puuid) return;

      const { index, summonerData } = result;

      // 并行加载排位统计和比赛历史
      Promise.all([
        summonerService.getRankedStats(summonerData.puuid).catch(error => {
          console.warn(`获取排位统计失败:`, error);
          return undefined;
        }),
        sgpMatchService
          .getMatchHistory(summonerData.puuid, 0, 19, {
            serverId:
              (await sgpMatchService._inferCurrentUserServerId()) as string,
          })
          .catch(error => {
            console.warn(`获取比赛历史失败:`, error);
            return undefined;
          }),
      ]).then(([rankedStats, matchHistory]) => {
        if (roomMembers.value[index]) {
          roomMembers.value[index] = {
            ...roomMembers.value[index],
            rankedStats,
            matchHistory,
          };
        }
      });
    });
  };

  const updateRoom = async (): Promise<void> => {
    try {
      isLoadingRoom.value = true;

      const inLobby = await roomService.isInLobby();
      if (!inLobby) {
        currentRoom.value = null;
        roomMembers.value = [];
        errorMessage.value = '当前不在游戏房间中';
        return;
      }

      const room = await roomService.getCurrentLobby();
      currentRoom.value = room;
      clearError();

      isLoadingMembers.value = true;
      const members = await roomService.getLobbyMembers();

      // 改进的成员变化检测逻辑
      const currentMemberIds = members.map(m => String(m.summonerId)).sort();
      const existingMemberIds = roomMembers.value
        .map(m => String(m.summonerId))
        .sort();

      // 更严格的比较
      const hasChanges =
        currentMemberIds.length !== existingMemberIds.length ||
        !currentMemberIds.every((id, index) => id === existingMemberIds[index]);

      if (hasChanges) {
        console.log(
          `🏠 房间成员发生变化，重新获取详细信息: ${members.length} 名成员`
        );
        await fetchMembersDetails(members);
      } else {
        console.log(`🏠 房间成员无变化: ${members.length} 名成员`);
        // 更安全的更新逻辑
        roomMembers.value = roomMembers.value.map(existingMember => {
          const updatedMember = members.find(
            m => m.summonerId === existingMember.summonerId
          );
          if (updatedMember) {
            return {
              ...existingMember,
              ...updatedMember,
              // 保留详细信息
              summonerData: existingMember.summonerData,
              rankedStats: existingMember.rankedStats,
              matchHistory: existingMember.matchHistory,
              isLoading: existingMember.isLoading,
              error: existingMember.error,
            };
          }
          return existingMember;
        });
      }
    } catch (error: any) {
      console.error('更新房间信息失败:', error);
      errorMessage.value = error.message || '获取房间信息失败';
    } finally {
      isLoadingRoom.value = false;
      isLoadingMembers.value = false;
    }
  };

  const kickMember = async (summonerId: number): Promise<void> => {
    try {
      await roomService.kickMember(summonerId);
      await updateRoom();
    } catch (error: any) {
      console.error('踢出成员失败:', error);
      errorMessage.value = error.message || '踢出成员失败';
    }
  };

  const clearError = () => {
    errorMessage.value = null;
  };

  const resetRoom = () => {
    currentRoom.value = null;
    roomMembers.value = [];
    isLoadingRoom.value = false;
    isLoadingMembers.value = false;
    clearError();
  };

  return {
    currentRoom,
    roomMembers,
    isLoadingRoom,
    isLoadingMembers,
    isLoading,
    roomLeader,
    otherMembers,
    errorMessage,
    updateRoom,
    kickMember,
    clearError,
    resetRoom,
  };
}
