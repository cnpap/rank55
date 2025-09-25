import { ref, computed } from 'vue';
import type { GameflowSession } from '@/types/gameflow-session';
import { RankTeam } from '@/types/players-info';
import {
  GameStartMemberWithDetails,
  POSITION_ORDER,
} from '@/types/room-management';
import { updateMembersData } from '@/utils/room-management-utils';
import { toast } from 'vue-sonner';

export function useGameStartMembers() {
  const gameStartMembers = ref<GameStartMemberWithDetails[]>([]);

  // 创建10个位置的数组，前5个是我方，后5个是敌方
  const gameStartSlots = computed(() => {
    const slots: (GameStartMemberWithDetails | null)[] = Array.from(
      { length: 10 },
      () => null
    );

    // 分离我方和敌方成员
    const myTeamMembers = gameStartMembers.value.filter(
      member => member.isMyTeam
    );
    const enemyTeamMembers = gameStartMembers.value.filter(
      member => !member.isMyTeam
    );

    // 按位置排序我方成员
    const sortedMyTeam = myTeamMembers.sort((a, b) => {
      const positionIndexA = POSITION_ORDER.indexOf(a.assignedPosition as any);
      const positionIndexB = POSITION_ORDER.indexOf(b.assignedPosition as any);
      return positionIndexA - positionIndexB;
    });

    // 按位置排序敌方成员
    const sortedEnemyTeam = enemyTeamMembers.sort((a, b) => {
      const positionIndexA = POSITION_ORDER.indexOf(a.assignedPosition as any);
      const positionIndexB = POSITION_ORDER.indexOf(b.assignedPosition as any);
      return positionIndexA - positionIndexB;
    });
    console.log(sortedMyTeam, sortedEnemyTeam);
    // 填充我方成员（位置0-4）
    sortedMyTeam.forEach((member, index) => {
      if (index < 5) {
        slots[index] = member;
      }
    });

    // 填充敌方成员（位置5-9）
    sortedEnemyTeam.forEach((member, index) => {
      if (index < 5) {
        slots[5 + index] = member;
      }
    });

    return slots as (GameStartMemberWithDetails | null)[];
  });

  // 获取游戏开始阶段成员详细信息 - 使用缓存优化
  const fetchGameStartMembersDetails = async (
    teamOne: RankTeam[],
    teamTwo: RankTeam[]
  ): Promise<void> => {
    // 合并两个队伍的数据
    const allPlayers = [
      ...teamOne.map(player => ({ ...player, teamId: 1, isMyTeam: true })),
      ...teamTwo.map(player => ({ ...player, teamId: 2, isMyTeam: false })),
    ];

    // 第一阶段：立即显示基本信息
    gameStartMembers.value = allPlayers.map(player => ({
      summonerId: player.summonerId,
      summonerName: `Player${player.summonerId}`,
      teamId: player.teamId,
      isMyTeam: player.isMyTeam,
      assignedPosition:
        player.assignedPosition || player.selectedPosition?.toLowerCase() || '',
      championId: player.championId,
      isLoading: false,
    }));

    // 第二阶段：使用通用函数批量加载召唤师数据和排位统计
    const summonerIds = allPlayers.map(p => p.summonerId).filter(Boolean);
    const result = await updateMembersData(gameStartMembers.value, summonerIds);

    if (!result.success) {
      console.error('游戏开始成员数据加载失败:', result.error);
      toast.error(result.error || '数据加载失败');
    }
  };

  // 更新游戏开始阶段成员数据
  const updateGameStartMembers = async (
    gameflowSession: GameflowSession
  ): Promise<void> => {
    try {
      const { teamOne, teamTwo } = gameflowSession.gameData;

      // 检查成员是否有变化
      const currentPlayerIds = [...teamOne, ...teamTwo]
        .map(p => String(p.summonerId))
        .sort();
      const existingPlayerIds = gameStartMembers.value
        .map(m => String(m.summonerId))
        .sort();

      const hasChanges =
        currentPlayerIds.length !== existingPlayerIds.length ||
        !currentPlayerIds.every((id, index) => id === existingPlayerIds[index]);

      if (hasChanges) {
        console.log(
          `🎮 游戏开始阶段成员发生变化，重新获取详细信息: ${teamOne.length + teamTwo.length} 名成员`
        );
        await fetchGameStartMembersDetails(teamOne, teamTwo);
      } else {
        console.log(
          `🎮 游戏开始阶段成员无变化: ${teamOne.length + teamTwo.length} 名成员`
        );
        // 更新基本信息但保留详细数据
        const allPlayers = [
          ...teamOne.map(player => ({ ...player, teamId: 1, isMyTeam: true })),
          ...teamTwo.map(player => ({ ...player, teamId: 2, isMyTeam: false })),
        ];

        gameStartMembers.value = gameStartMembers.value.map(existingMember => {
          const updatedPlayer = allPlayers.find(
            p => p.summonerId === existingMember.summonerId
          );
          if (updatedPlayer) {
            return {
              ...existingMember,
              teamId: updatedPlayer.teamId,
              isMyTeam: updatedPlayer.isMyTeam,
              assignedPosition:
                updatedPlayer.assignedPosition ||
                updatedPlayer.selectedPosition.toLowerCase(),
              championId: updatedPlayer.championId,
            };
          }
          return existingMember;
        });
      }
    } catch (error) {
      console.error('更新游戏开始阶段成员数据失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : '获取游戏数据失败';
      toast.error(errorMessage);

      // 设置所有成员的错误状态
      gameStartMembers.value.forEach(member => {
        member.isLoading = false;
        member.error = errorMessage;
      });
    }
  };

  return {
    gameStartMembers,
    gameStartSlots,
    updateGameStartMembers,
  };
}
