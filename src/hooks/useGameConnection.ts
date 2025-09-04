import { ref } from 'vue';
import type { SummonerData } from '@/types/summoner';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import {
  summonerService,
  sgpMatchService,
  connectionService,
} from '@/lib/service/service-manager';

export function useGameConnection() {
  const isConnected = ref(false);
  const clientUserStore = useClientUserStore();
  const matchHistoryStore = useMatchHistoryStore();

  const checkConnection = async (): Promise<boolean> => {
    try {
      const connected = await connectionService.isConnected();

      if (connected !== isConnected.value) {
        isConnected.value = connected;

        if (connected) {
          console.log('🔌 游戏客户端已连接');
        } else {
          console.log('🔌 游戏客户端连接断开');
          clientUserStore.setUser({} as SummonerData);
        }
      }

      return connected;
    } catch (error) {
      console.error('检查连接状态失败:', error);
      return false;
    }
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
  };

  return {
    isConnected,
    clientUser: clientUserStore.user,
    checkConnection,
    fetchCurrentUser,
    resetConnection,
  };
}
