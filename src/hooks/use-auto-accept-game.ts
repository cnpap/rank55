import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { useGameConnection } from './useGameConnection';
import { useRoomManager } from './useRoomManager';
import { useGamePhaseHandler } from './useGamePhaseHandler';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const route = useRoute();

  // 使用拆分后的 hooks
  const connection = useGameConnection();
  const roomManager = useRoomManager();
  const phaseHandler = useGamePhaseHandler();

  const checkGamePhaseAndExecute = async (): Promise<void> => {
    try {
      // 检查连接状态
      const connected = await connection.checkConnection();

      if (!connected) {
        roomManager.resetRoom();
        roomManager.errorMessage.value = '游戏客户端连接断开';
        return;
      } else {
        roomManager.clearError();
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
      // if ([GameflowPhaseEnum.None, GameflowPhaseEnum.Lobby].includes(phase)) {
      // }

      // 场景 1: 房间阶段 - 只有在房间管理页面时才执行房间逻辑
      if (phase === GameflowPhaseEnum.Lobby) {
        // 检查当前是否在房间管理页面
        if (route.name === 'RoomManagement') {
          await roomManager.updateRoom();
        } else {
          // 如果不在房间管理页面，重置房间状态但不显示错误
          roomManager.resetRoom();
        }
        return;
      }

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

      // 场景 4: 游戏开始阶段
      if (phase === GameflowPhaseEnum.GameStart) {
        await phaseHandler.handleGameStartPhase();
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
        roomManager.resetRoom();
      }
    } catch (error) {
      console.error('游戏阶段轮询出错:', error);
      roomManager.errorMessage.value = '检查游戏状态失败';
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
    roomManager.resetRoom();
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

    // 房间相关
    currentRoom: roomManager.currentRoom,
    roomMembers: roomManager.roomMembers,
    isLoadingRoom: roomManager.isLoadingRoom,
    isLoadingMembers: roomManager.isLoadingMembers,
    isLoading: roomManager.isLoading,
    isInRoom: roomManager.isInRoom,
    roomLeader: roomManager.roomLeader,
    otherMembers: roomManager.otherMembers,
    errorMessage: roomManager.errorMessage,
    kickMember: roomManager.kickMember,
    clearError: roomManager.clearError,

    // 游戏阶段相关
    gamePhaseManager: phaseHandler.gamePhaseManager,
    autoActionService: phaseHandler.autoActionService,

    // 控制方法
    startGamePhasePolling,
    stopGamePhasePolling,
  };
}
