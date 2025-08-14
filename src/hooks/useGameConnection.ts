import { ref } from 'vue';
import { SummonerService } from '@/lib/service/summoner-service';
import type { SummonerData } from '@/types/summoner';

export function useGameConnection() {
  const isConnected = ref(false);
  const currentUser = ref<SummonerData | null>(null);
  const summonerService = new SummonerService();

  const checkConnection = async (): Promise<boolean> => {
    try {
      const connected = await summonerService.isConnected();

      if (connected !== isConnected.value) {
        isConnected.value = connected;

        if (connected) {
          console.log('🔌 游戏客户端已连接');
        } else {
          console.log('🔌 游戏客户端连接断开');
          currentUser.value = null;
        }
      }

      return connected;
    } catch (error) {
      console.error('检查连接状态失败:', error);
      return false;
    }
  };

  const fetchCurrentUser = async (): Promise<void> => {
    if (currentUser.value) return;

    try {
      console.log('🔍 获取用户信息...');
      const userData = await summonerService.getCurrentSummoner();
      currentUser.value = userData;
      console.log(
        `👤 用户信息获取成功: ${userData.displayName || userData.gameName}`
      );
    } catch (error) {
      console.error('获取用户信息失败:', error);
      currentUser.value = null;
    }
  };

  const resetConnection = () => {
    isConnected.value = false;
    currentUser.value = null;
  };

  return {
    isConnected,
    currentUser,
    checkConnection,
    fetchCurrentUser,
    resetConnection,
  };
}
