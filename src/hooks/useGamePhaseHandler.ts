import { ref } from 'vue';
import {
  banPickService,
  autoActionService,
  gamePhaseManager,
  chatNotificationService,
} from '@/lib/service/service-manager';
import { $local } from '@/storages/storage-use';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { DebounceCache } from '@/lib/service/debounce-cache';

export function useGamePhaseHandler() {
  const lastPhase = ref<GameflowPhaseEnum | null>(null);
  const lastGameId = ref<number | null>(null);
  const prePickSuccessTime = ref<number | null>(null);
  const skipChampSelectPhase = ref<boolean>(false); // 记录是否跳过当前选人阶段
  const chatNotificationHistory = ref<Record<string, boolean>>({});

  const handleChampSelectPhase = async (): Promise<void> => {
    const session = await banPickService.getChampSelectSession();
    const currentGameId = session.gameId;
    const { actions, myTeam, localPlayerCellId } = session;
    const flatActions = actions.flat();
    const positionSettings = $local.getItem('positionSettings')!;

    // 检查 gameId 是否变化，如果变化则重置状态
    if (lastGameId.value !== null && lastGameId.value !== currentGameId) {
      resetPhaseState();
    }
    lastGameId.value = currentGameId;

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
      return;
    }

    const myPosition = myTeam.find(
      item => item.cellId === localPlayerCellId
    )?.assignedPosition;
    if (!myPosition) {
      if (!chatNotificationHistory.value['noPosition']) {
        chatNotificationService.sendSystemMessage('无法获取当前位置');
        chatNotificationHistory.value['noPosition'] = true;
      }
      return;
    }

    const myPositionInfo = positionSettings[myPosition];
    if (!myPositionInfo) {
      if (!chatNotificationHistory.value['noPositionSettings']) {
        chatNotificationService.sendSystemMessage('未配置当前位置的设置');
        chatNotificationHistory.value['noPositionSettings'] = true;
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
    DebounceCache.debounce(
      'banpick',
      async () => {
        if (type === 'ban') {
          await autoActionService.executeBanAction(flatActions, myPositionInfo);
        } else if (type === 'pick') {
          await autoActionService.executePickAction(
            flatActions,
            myPositionInfo
          );
        }
        gamePhaseManager.resetActionState();
      },
      2000
    );
  };

  const resetPhaseState = () => {
    lastPhase.value = null;
    lastGameId.value = null;
    prePickSuccessTime.value = null;
    skipChampSelectPhase.value = false;
    chatNotificationHistory.value = {};
  };

  return {
    lastPhase,
    gamePhaseManager,
    autoActionService,
    handleChampSelectPhase,
    resetPhaseState,
  };
}
