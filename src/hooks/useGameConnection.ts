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
import { gameDataDB } from '@/lib/db/game-data-db';

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
      await loadAndPersistGameData();
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

  // 加载并持久化游戏数据到 Dexie 数据库
  const loadAndPersistGameData = async (): Promise<void> => {
    console.log('📥 开始检查游戏数据...');

    // 检查数据库中是否已有数据
    const championsCount = await gameDataDB.champions.count();
    const itemsCount = await gameDataDB.items.count();

    // 如果数据库中已有数据，直接加载到内存
    if (championsCount > 0 && itemsCount > 0) {
      console.log('📦 数据库中已有数据，直接加载到内存');
      await gameDataDB.loadAllChampions();
      await gameDataDB.loadAllItems();
      console.log(
        `✅ 已从数据库加载 ${championsCount} 个英雄和 ${itemsCount} 个物品数据`
      );
      return;
    }

    console.log('📥 数据库中无数据，开始从远程获取...');

    const championSummaries = await lolStaticAssetsService.getChampionSummary();
    await gameDataDB.saveChampions(championSummaries);

    // 获取物品数据
    const items = await lolStaticAssetsService.getItems();
    await gameDataDB.saveItems(items);

    console.log('✅ 游戏数据加载并持久化完成');
  };

  return {
    isConnected,
    clientUser: clientUserStore.user,
    checkConnection,
    fetchCurrentUser,
    resetConnection,
    loadAndPersistGameData, // 导出方法以便外部调用
  };
}
