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
  const positionSettingsNotified = ref<boolean>(false); // 记录是否已经提示过位置设置未配置
  const skipChampSelectPhase = ref<boolean>(false); // 记录是否跳过当前选人阶段

  const handleChampSelectPhase = async (): Promise<void> => {
    const session = await banPickService.getChampSelectSession();
    const { actions, myTeam, localPlayerCellId } = session;
    const flatActions = actions.flat();
    const positionSettings = $local.getItem('positionSettings')!;

    // 如果已经标记跳过当前选人阶段，则直接返回不做任何处理
    if (skipChampSelectPhase.value) {
      return;
    }

    // 检查是否是预选阶段，如果预选成功，17 秒以后就是开始 ban 了。
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
      // 如果还没有提示过，则提示一次并标记跳过当前选人阶段
      if (!positionSettingsNotified.value) {
        chatNotificationService.sendSystemMessage('未配置当前位置的设置');
        positionSettingsNotified.value = true;
        skipChampSelectPhase.value = true;
      }
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
      return;
    }

    // 倒计时结束，执行操作
    if (!gamePhaseManager.currentState.actionExecuted) {
      gamePhaseManager.markActionExecuted();

      if (type === 'ban') {
        await autoActionService.executeBanAction(flatActions, myPositionInfo);
      } else if (type === 'pick') {
        await autoActionService.executePickAction(flatActions, myPositionInfo);
      }
      resetPhaseState();
    }
  };

  const resetPhaseState = () => {
    gamePhaseManager.resetActionState();
    lastPhase.value = null;
    prePickSuccessTime.value = null;
    positionSettingsNotified.value = false;
    skipChampSelectPhase.value = false;
  };

  return {
    lastPhase,
    gamePhaseManager,
    autoActionService,
    handleChampSelectPhase,
    resetPhaseState,
  };
}
