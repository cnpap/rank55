import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { useGameConnection } from './useGameConnection';
import { useGamePhaseHandler } from './useGamePhaseHandler';
import { RoomService } from '@/lib/service/room-service';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);

  // 使用拆分后的 hooks
  const connection = useGameConnection();
  const phaseHandler = useGamePhaseHandler();

  // 简化的房间状态 - 只保留是否在房间的状态
  const isInRoom = ref(false);
  const roomService = new RoomService();

  const checkGamePhaseAndExecute = async (): Promise<void> => {
    try {
      // 检查连接状态
      const connected = await connection.checkConnection();

      if (!connected) {
        isInRoom.value = false;
        return;
      }

      const phase = await phaseHandler.gamePhaseManager.getCurrentPhase();

      // 阶段变化日志
      if (phaseHandler.lastPhase.value !== phase) {
        console.log(
          `游戏阶段变化: ${phaseHandler.lastPhase.value} -> ${phase}`
        );
        phaseHandler.lastPhase.value = phase;
      }

      // 场景 0: None 状态 - 获取用户信息
      await connection.fetchCurrentUser();

      // 场景 1: 房间阶段 - 只检测是否在房间中
      if (
        [
          GameflowPhaseEnum.Lobby,
          GameflowPhaseEnum.Matchmaking,
          GameflowPhaseEnum.ReadyCheck,
          GameflowPhaseEnum.ChampSelect,
        ].includes(phase)
      ) {
        isInRoom.value = await roomService.isInLobby();

        // 场景 2: 准备检查阶段
        if (phase === GameflowPhaseEnum.ReadyCheck) {
          await phaseHandler.autoActionService.executeReadyCheckAction();
          return;
        }

        // 场景 3: 英雄选择阶段
        if (phase === GameflowPhaseEnum.ChampSelect) {
          await phaseHandler.handleChampSelectPhase();
          return;
        }

        return;
      }

      // 场景 4: 游戏开始阶段
      if (phase === GameflowPhaseEnum.GameStart) {
        await phaseHandler.gamePhaseManager.handleGameStartPhase();
        return;
      }

      // 其他阶段重置相关状态
      if (
        ![
          GameflowPhaseEnum.None,
          GameflowPhaseEnum.Lobby,
          GameflowPhaseEnum.ChampSelect,
          GameflowPhaseEnum.GameStart,
        ].includes(phase)
      ) {
        phaseHandler.resetPhaseState();
        isInRoom.value = false;
      }
    } catch (error) {
      console.error('游戏阶段轮询出错:', error);
      isInRoom.value = false;
    } finally {
      // 安排下一次执行
      scheduleNextPoll();
    }
  };

  const scheduleNextPoll = (): void => {
    if (gamePhaseTimer.value) {
      gamePhaseTimer.value = setTimeout(checkGamePhaseAndExecute, 3000);
    }
  };

  const startGamePhasePolling = (): void => {
    console.log('🎮 开始游戏阶段轮询');
    gamePhaseTimer.value = setTimeout(checkGamePhaseAndExecute, 0); // 立即开始第一次
  };

  const stopGamePhasePolling = (): void => {
    if (gamePhaseTimer.value) {
      clearTimeout(gamePhaseTimer.value);
      gamePhaseTimer.value = null;
    }
    phaseHandler.resetPhaseState();
    isInRoom.value = false;
    connection.resetConnection();
    console.log('🛑 停止游戏阶段轮询');
  };

  onMounted(() => {
    startGamePhasePolling();
  });

  onUnmounted(() => {
    stopGamePhasePolling();
  });

  return {
    // 连接相关
    isConnected: connection.isConnected,
    clientUser: connection.clientUser,

    // 简化的房间状态 - 只返回是否在房间中
    isInRoom,

    // 游戏阶段相关
    gamePhaseManager: phaseHandler.gamePhaseManager,
    autoActionService: phaseHandler.autoActionService,

    // 控制方法
    startGamePhasePolling,
    stopGamePhasePolling,
  };
}
