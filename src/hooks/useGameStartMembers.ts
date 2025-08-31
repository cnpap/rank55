import { ref, computed } from 'vue';
import { SummonerService } from '@/lib/service/summoner-service';
import type { GameflowSession } from '@/types/gameflow-session';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import { RankTeam } from '@/types/players-info';

export interface GameStartMemberWithDetails {
  // 基本信息
  summonerId: number;
  summonerName: string;
  teamId: number; // 1为我方，2为敌方
  isMyTeam: boolean;

  // 详细信息
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  isLoading?: boolean;
  error?: string;
}

export function useGameStartMembers() {
  const gameStartMembers = ref<GameStartMemberWithDetails[]>([]);
  const gameStartError = ref<string | null>(null);

  const summonerService = new SummonerService();

  // 创建10个位置的数组，前5个是我方，后5个是敌方
  const gameStartSlots = computed(() => {
    const slots = Array(10).fill(null);

    // 分离我方和敌方成员
    const myTeamMembers = gameStartMembers.value.filter(
      member => member.isMyTeam
    );
    const enemyTeamMembers = gameStartMembers.value.filter(
      member => !member.isMyTeam
    );

    // 填充我方成员（位置0-4）
    myTeamMembers.forEach((member, index) => {
      if (index < 5) {
        slots[index] = member;
      }
    });

    // 填充敌方成员（位置5-9）
    enemyTeamMembers.forEach((member, index) => {
      if (index < 5) {
        slots[5 + index] = member;
      }
    });

    return slots as (GameStartMemberWithDetails | null)[];
  });

  // 获取游戏开始阶段成员详细信息
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
      isLoading: false,
    }));

    // 第二阶段：并行加载召唤师基本数据
    const summonerPromises = allPlayers.map(async (player, index) => {
      if (!player.summonerId) return;

      try {
        const summonerData = await summonerService.getSummonerByID(
          player.summonerId
        );
        if (gameStartMembers.value[index]) {
          gameStartMembers.value[index] = {
            ...gameStartMembers.value[index],
            summonerData,
          };
        }
        return { index, summonerData };
      } catch (error) {
        console.warn(`获取成员 ${player.summonerId} 召唤师数据失败:`, error);
        if (gameStartMembers.value[index]) {
          gameStartMembers.value[index] = {
            ...gameStartMembers.value[index],
            error: '获取召唤师数据失败',
          };
        }
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
        if (gameStartMembers.value[index]) {
          gameStartMembers.value[index] = {
            ...gameStartMembers.value[index],
            rankedStats,
          };
        }
      } catch (error) {
        console.warn(`获取排位统计失败:`, error);
      }
    });
  };

  // 更新游戏开始阶段成员数据
  const updateGameStartMembers = async (
    gameflowSession: GameflowSession
  ): Promise<void> => {
    gameStartError.value = null;

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
            };
          }
          return existingMember;
        });
      }
    } catch (error) {
      console.error('更新游戏开始阶段成员数据失败:', error);
      gameStartError.value = '获取游戏数据失败';
    }
  };

  return {
    gameStartMembers,
    gameStartError,
    gameStartSlots,
    updateGameStartMembers,
  };
}
