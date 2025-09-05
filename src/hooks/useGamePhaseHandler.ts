import { ref } from 'vue';
import {
  banPickService,
  autoActionService,
  gamePhaseManager,
  chatNotificationService,
} from '@/lib/service/service-manager';
import { $local } from '@/storages/storage-use';
import { GameflowPhaseEnum } from '@/types/gameflow-session';

export function useGamePhaseHandler() {
  const lastPhase = ref<GameflowPhaseEnum | null>(null);
  const prePickSuccessTime = ref<number | null>(null);

  const handleChampSelectPhase = async (): Promise<void> => {
    const session = await banPickService.getChampSelectSession();
    const { actions, myTeam, localPlayerCellId } = session;
    const flatActions = actions.flat();
    const positionSettings = $local.getItem('positionSettings');

    if (!positionSettings) {
      chatNotificationService.sendSystemMessage('未配置位置设置');
      return;
    }

    // 检查是否是预选阶段，如果预选成功，15 秒以后就是开始 ban 了。
    if (flatActions.every(a => !a.completed) && !prePickSuccessTime.value) {
      await autoActionService.executePrePickAction(session);
      // 记录预选成功的时间
      prePickSuccessTime.value = Date.now();
      chatNotificationService.sendSystemMessage('预选成功，17秒内不做检查');
      return;
    }
    const s = 17000;

    // 如果在预选成功后的 17 秒内，不做任何检查
    if (prePickSuccessTime.value && Date.now() - prePickSuccessTime.value < s) {
      chatNotificationService.sendSystemMessage(
        `预选成功后等待中，剩余${Math.ceil((s - (Date.now() - prePickSuccessTime.value)) / 1000)}秒...`
      );
      return;
    }

    // 处理当前进行中的操作
    const action = flatActions.find(
      a => a.isInProgress && a.actorCellId === localPlayerCellId
    );

    if (!action) {
      // chatNotificationService.sendSystemMessage(
      //   '当前位置未开始选择，等待中...'
      // );
      gamePhaseManager.resetActionState();
      return;
    }

    const myPosition = myTeam.find(
      item => item.cellId === localPlayerCellId
    )?.assignedPosition;
    if (!myPosition) {
      chatNotificationService.sendSystemMessage('无法获取当前位置');
      return;
    }

    const myPositionInfo = positionSettings[myPosition];
    if (!myPositionInfo) {
      chatNotificationService.sendSystemMessage('未配置当前位置的设置');
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
      chatNotificationService.sendSystemMessage(
        `⏳ ${type} 操作倒计时中，还剩 ${remainingSeconds} 秒`
      );
      return;
    }

    // 倒计时结束，执行操作
    if (!gamePhaseManager.currentState.actionExecuted) {
      chatNotificationService.sendSystemMessage(
        `⏰ ${type} 倒计时结束，开始执行操作`
      );
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
    prePickSuccessTime.value = null;
  };

  return {
    lastPhase,
    gamePhaseManager,
    autoActionService,
    handleChampSelectPhase,
    resetPhaseState,
  };
}
