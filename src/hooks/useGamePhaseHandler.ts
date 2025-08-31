import { ref } from 'vue';
import { GamePhaseManager } from '@/lib/service/game-phase-manager';
import { AutoActionService } from '@/lib/service/auto-action-service';
import { BanPickService } from '@/lib/service/ban-pick-service';
import { $local } from '@/storages/storage-use';
import { GameflowPhaseEnum } from '@/types/gameflow-session';

export function useGamePhaseHandler() {
  const lastPhase = ref<GameflowPhaseEnum | null>(null);
  const gamePhaseManager = new GamePhaseManager();
  const autoActionService = new AutoActionService();
  const banpickService = new BanPickService();

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
    if (flatActions.every(a => !a.completed)) {
      await autoActionService.executePrePickAction(session);
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

  const resetPhaseState = () => {
    gamePhaseManager.resetActionState();
    lastPhase.value = null;
  };

  return {
    lastPhase,
    gamePhaseManager,
    autoActionService,
    handleChampSelectPhase,
    handleGameStartPhase: gamePhaseManager.handleGameStartPhase,
    resetPhaseState,
  };
}
