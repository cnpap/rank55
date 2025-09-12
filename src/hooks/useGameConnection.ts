import { ref } from 'vue';
import type { SummonerData } from '@/types/summoner';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import {
  summonerService,
  sgpMatchService,
  connectionService,
  lolStaticAssetsService,
} from '@/lib/service/service-manager';
import { gameDataDB } from '@/storages/game-data-db';

export function useGameConnection() {
  const isConnected = ref(false);
  const clientUserStore = useClientUserStore();
  const matchHistoryStore = useMatchHistoryStore();

  const checkConnection = async (): Promise<boolean> => {
    if (isConnected.value) {
      return true;
    }
    const result = await connectionService.isConnected();
    if (result) {
      console.log('🔌 游戏客户端已连接');
      // 在设置连接状态前，先获取并持久化游戏数据
      await gameDataDB.loadAll();
      isConnected.value = true;

      return true;
    }
    return false;
  };

  const fetchCurrentUser = async (): Promise<void> => {
    if (clientUserStore.user.puuid) return;

    try {
      const summoner = await summonerService.getCurrentSummoner();
      clientUserStore.setUser(summoner);
      const serverId = await sgpMatchService._inferCurrentUserServerId();
      clientUserStore.setServerId(serverId!);
      matchHistoryStore.setSelectedServerId(serverId!);
      console.log(
        `👤 用户信息获取成功: ${summoner.displayName || summoner.gameName}`
      );
    } catch (error) {
      console.error('获取用户信息失败:', error);
      clientUserStore.setUser({} as SummonerData);
    }
  };

  const resetConnection = () => {
    isConnected.value = false;
    clientUserStore.setUser({} as SummonerData);
  };

  return {
    isConnected,
    clientUser: clientUserStore.user,
    checkConnection,
    fetchCurrentUser,
    resetConnection,
  };
}
