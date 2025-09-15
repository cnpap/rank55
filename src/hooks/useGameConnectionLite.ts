import { ref } from 'vue';
import { connectionService } from '@/lib/service/service-manager';
import { gameDataDB } from '@/storages/game-data-db';

export function useGameConnectionLite() {
  const isConnected = ref(false);

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

  return {
    isConnected,
    checkConnection,
  };
}
