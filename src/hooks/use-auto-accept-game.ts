import { ref, onMounted, onUnmounted } from 'vue';
import { GamePhaseManager } from '@/lib/service/game-phase-manager';
import { AutoActionService } from '@/lib/service/auto-action-service';
import { BanPickService } from '@/lib/service/ban-pick-service';
import { $local } from '@/storages/storage-use';
import { GameflowPhaseEnum } from '@/types/gameflow-session';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const gamePhaseManager = new GamePhaseManager();
  const autoActionService = new AutoActionService();
  const banpickService = new BanPickService();

  const checkGamePhaseAndExecute = async (): Promise<void> => {
    try {
      const phase = await gamePhaseManager.getCurrentPhase();
      console.log(`当前游戏阶段: ${phase}`);

      // 场景 1: 准备检查阶段
      if (phase === GameflowPhaseEnum.ReadyCheck) {
        await autoActionService.executeReadyCheckAction();
        return;
      }

      // 场景 2: 英雄选择阶段
      if (phase === GameflowPhaseEnum.ChampSelect) {
        await handleChampSelectPhase();
      } else {
        // 如果不在 ChampSelect 阶段，重置操作状态
        gamePhaseManager.resetActionState();
      }

      // 记录阶段变化
      const { currentPhase, lastPhase } = gamePhaseManager.currentState;
      if (lastPhase !== currentPhase) {
        console.log(`游戏阶段变化: ${lastPhase} -> ${currentPhase}`);
      }
    } catch (error) {
      console.error('游戏阶段轮询出错:', error);
    }
  };

  const handleChampSelectPhase = async (): Promise<void> => {
    const session = await banpickService.getChampSelectSession();
    const { actions, myTeam, localPlayerCellId } = session;
    const flatActions = actions.flat();
    const positionSettings = $local.getItem('positionSettings');

    if (!positionSettings) {
      console.log('未配置位置设置');
      return;
    }

    // 检查是否是预选阶段
    if (flatActions.every(a => !a.isInProgress)) {
      await autoActionService.executePrePickAction(session);
      return;
    }

    // 检查游戏是否即将开始
    const gameWillStart = await gamePhaseManager.checkGameStartCondition();
    if (gameWillStart) {
      console.log('🎮 游戏即将开始，session 已持久化');
      return;
    }

    // 处理当前进行中的操作
    const action = flatActions.find(
      a => a.isInProgress && a.actorCellId === localPlayerCellId
    );

    if (!action) {
      console.log('当前位置未开始选择，等待中...');
      gamePhaseManager.resetActionState();
      return;
    }

    const myPosition = myTeam.find(
      item => item.cellId === localPlayerCellId
    )?.assignedPosition;
    if (!myPosition) {
      console.log('无法获取当前位置');
      return;
    }

    const myPositionInfo = positionSettings[myPosition];
    if (!myPositionInfo) {
      console.log('未配置当前位置的设置');
      return;
    }

    const type = action.type as 'ban' | 'pick';
    gamePhaseManager.setActionState(type);

    // 获取倒计时设置
    const countdownKey =
      type === 'ban' ? 'autoBanCountdown' : 'autoPickCountdown';
    const countdown = $local.getItem(countdownKey) || 5;
    const remainingTime = gamePhaseManager.getRemainingTime(countdown);

    if (remainingTime > 0) {
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      console.log(`⏳ ${type} 操作倒计时中，还剩 ${remainingSeconds} 秒`);
      return;
    }

    // 倒计时结束，执行操作
    if (!gamePhaseManager.currentState.actionExecuted) {
      console.log(`⏰ ${type} 倒计时结束，开始执行操作`);
      gamePhaseManager.markActionExecuted();

      if (type === 'ban') {
        await autoActionService.executeBanAction(flatActions, myPositionInfo);
      } else if (type === 'pick') {
        await autoActionService.executePickAction(flatActions, myPositionInfo);
      }
    }
  };

  const startGamePhasePolling = (): void => {
    console.log('🎮 开始游戏阶段轮询');
    gamePhaseTimer.value = setInterval(checkGamePhaseAndExecute, 2000);
  };

  const stopGamePhasePolling = (): void => {
    if (gamePhaseTimer.value) {
      clearInterval(gamePhaseTimer.value);
      gamePhaseTimer.value = null;
    }
    gamePhaseManager.resetActionState();
    console.log('🛑 停止游戏阶段轮询');
  };

  onMounted(() => {
    startGamePhasePolling();
  });

  onUnmounted(() => {
    stopGamePhasePolling();
  });

  return {
    gamePhaseManager,
    autoActionService,
    startGamePhasePolling,
    stopGamePhasePolling,
  };
}
