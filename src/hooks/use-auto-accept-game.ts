import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { useGameConnection } from './useGameConnection';
import { useGamePhaseHandler } from './useGamePhaseHandler';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);

  // 使用拆分后的 hooks
  const connection = useGameConnection();
  const phaseHandler = useGamePhaseHandler();
  const currentPhase = ref<GameflowPhaseEnum>(GameflowPhaseEnum.None);

  const checkGamePhaseAndExecute = async (): Promise<void> => {
    try {
      // 检查连接状态
      const connected = await connection.checkConnection();

      if (!connected) {
        // 只有当当前阶段不是 None 时才更新
        if (currentPhase.value !== GameflowPhaseEnum.None) {
          currentPhase.value = GameflowPhaseEnum.None;
        }
        return;
      }

      const phase = await phaseHandler.gamePhaseManager.getCurrentPhase();
      const lastPhase = phaseHandler.gamePhaseManager.currentState.lastPhase;

      // 只有当阶段真正发生变化时才更新 currentPhase
      if (currentPhase.value !== phase) {
        currentPhase.value = phase;
        console.log(`游戏阶段变化: ${lastPhase} -> ${phase}`);
      }

      // 移除重复的阶段变化日志，因为已经在上面处理了
      // if (lastPhase !== phase) {
      //   console.log(`游戏阶段变化: ${lastPhase} -> ${phase}`);
      // }

      // 场景 0: None 状态 - 获取用户信息
      await connection.fetchCurrentUser();

      // 场景 1: 房间阶段 - 只检测是否在房间中
      if (
        [
          GameflowPhaseEnum.Lobby,
          GameflowPhaseEnum.Matchmaking,
          GameflowPhaseEnum.ReadyCheck,
          GameflowPhaseEnum.ChampSelect,
          GameflowPhaseEnum.GameStart,
          GameflowPhaseEnum.InProgress,
        ].includes(phase)
      ) {
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

        // 场景 4: 游戏开始阶段（包括 GameStart 和 InProgress）
        if (
          phase === GameflowPhaseEnum.GameStart ||
          phase === GameflowPhaseEnum.InProgress
        ) {
          await phaseHandler.gamePhaseManager.handleGameStartPhase();
          return;
        }

        return;
      }

      // 其他阶段重置相关状态 - 修复这里的逻辑
      // 当不在房间相关阶段时，应该立即重置房间状态
      if (currentPhase.value !== GameflowPhaseEnum.None) {
        phaseHandler.resetPhaseState();
        currentPhase.value = GameflowPhaseEnum.None;
      }
    } catch (error) {
      console.error('游戏阶段轮询出错:', error);
      // 只有当当前阶段不是 None 时才更新
      if (currentPhase.value !== GameflowPhaseEnum.None) {
        currentPhase.value = GameflowPhaseEnum.None;
      }
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
    currentPhase.value = GameflowPhaseEnum.None;
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
    currentPhase,

    // 游戏阶段相关
    gamePhaseManager: phaseHandler.gamePhaseManager,
    autoActionService: phaseHandler.autoActionService,

    // 控制方法
    startGamePhasePolling,
    stopGamePhasePolling,
  };
}
