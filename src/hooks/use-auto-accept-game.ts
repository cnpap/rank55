import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowService, GameflowPhase } from '@/lib/service/gameflow-service';
import { BanPickService } from '@/lib/service/ban-pick-service';
import { eventBus } from '@/lib/event-bus';
import { $local } from '@/storages/storage-use';
import { toast } from 'vue-sonner';

export function useAutoAcceptGame() {
  const isEnabled = ref(false);
  const isPolling = ref(false);
  const pollTimer = ref<NodeJS.Timeout | null>(null);

  // 自动 ban/pick 状态
  const autoBanEnabled = ref(false);
  const autoPickEnabled = ref(false);

  // 游戏阶段检查状态
  const isGamePhasePolling = ref(false);
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const lastGamePhase = ref<GameflowPhase | null>(null);

  const gameflowService = new GameflowService();
  const banPickService = new BanPickService();

  // 检查并接受对局
  const checkAndAcceptGame = async (): Promise<void> => {
    try {
      // 检查 LCU 连接状态
      const isConnected = await gameflowService.isConnected();
      if (!isConnected) {
        console.log('LCU 未连接，跳过自动接受检查');
        return;
      }

      // 检查是否有待接受的对局
      const hasReadyCheck = await gameflowService.hasReadyCheck();
      if (hasReadyCheck) {
        console.log('检测到待接受的对局，正在自动接受...');
        await gameflowService.acceptReadyCheck();

        // 发送成功事件和通知
        eventBus.emit('auto-accept:accepted');
        toast.success('已自动接受对局');
        console.log('✅ 自动接受对局成功');

        // 接受对局后，如果自动ban/pick功能开启，开始游戏阶段检查
        if (autoBanEnabled.value || autoPickEnabled.value) {
          startGamePhasePolling();
        }
      }
    } catch (error: any) {
      console.error('自动接受对局失败:', error);
      eventBus.emit('auto-accept:error', error.message || '自动接受对局失败');

      // 只在第一次出错时显示通知，避免频繁弹窗
      if (error.message && !error.message.includes('获取')) {
        toast.error(`自动接受对局失败: ${error.message}`);
      }
    }
  };

  // 检查游戏阶段并执行相应操作
  const checkGamePhaseAndExecute = async (): Promise<void> => {
    try {
      // 检查 LCU 连接状态
      const isConnected = await gameflowService.isConnected();
      if (!isConnected) {
        console.log('LCU 未连接，跳过游戏阶段检查');
        return;
      }

      // 获取当前游戏阶段
      const currentPhase = await gameflowService.getGameflowPhase();

      // 如果阶段发生变化，记录日志
      if (lastGamePhase.value !== currentPhase) {
        console.log(`游戏阶段变化: ${lastGamePhase.value} -> ${currentPhase}`);
        lastGamePhase.value = currentPhase;
      }

      // 检查是否退出了对局
      if (
        currentPhase === GameflowPhase.None ||
        currentPhase === GameflowPhase.Lobby ||
        currentPhase === GameflowPhase.EndOfGame
      ) {
        console.log('检测到退出对局，停止游戏阶段检查');
        stopGamePhasePolling();
        return;
      }

      // 如果在英雄选择阶段，执行自动ban/pick
      if (currentPhase === GameflowPhase.ChampSelect) {
        await checkAndExecuteAutoBan();
        await checkAndExecuteAutoPick();
      }
    } catch (error: any) {
      console.error('游戏阶段检查失败:', error);
    }
  };

  // 检查并执行自动 ban
  const checkAndExecuteAutoBan = async (): Promise<void> => {
    if (!autoBanEnabled.value) return;

    try {
      // 检查是否在ban阶段
      const isBanPhase = await banPickService.isBanPhase();
      if (!isBanPhase) {
        return;
      }

      // 获取当前玩家可执行的action
      const currentAction = await banPickService.getCurrentPlayerAction();
      if (
        !currentAction ||
        currentAction.type !== 'ban' ||
        currentAction.completed
      ) {
        return;
      }

      console.log('🚫 检测到ban阶段，准备执行自动ban...');

      // 获取倒计时设置
      const autoBanCountdown = $local.getItem('autoBanCountdown') || 5;

      // 获取当前阶段信息以检查剩余时间
      const phaseInfo = await banPickService.getCurrentPhaseInfo();
      if (phaseInfo && phaseInfo.timer) {
        const remainingTime = Math.floor(
          phaseInfo.timer.adjustedTimeLeftInPhase / 1000
        );

        // 如果剩余时间小于等于设定的倒计时，执行ban
        if (remainingTime <= autoBanCountdown) {
          // TODO: 这里需要根据位置设置获取要ban的英雄
          // const positionSettings = $local.getItem('positionSettings') || {};
          // const banList = positionSettings[currentPosition]?.banChampions || [];
          // if (banList.length > 0) {
          //   const result = await banPickService.banChampion(banList[0]);
          //   if (result.success) {
          //     eventBus.emit('auto-ban:executed', banList[0]);
          //     toast.success(`已自动ban英雄: ${banList[0]}`);
          //   }
          // }

          console.log(`⏰ 倒计时剩余${remainingTime}秒，应该执行自动ban`);
        }
      }
    } catch (error: any) {
      console.error('自动 ban 失败:', error);
      eventBus.emit('auto-ban:error', error.message || '自动 ban 失败');
    }
  };

  // 检查并执行自动选择
  const checkAndExecuteAutoPick = async (): Promise<void> => {
    if (!autoPickEnabled.value) return;

    try {
      // 获取当前玩家可执行的action
      const currentAction = await banPickService.getCurrentPlayerAction();
      if (
        !currentAction ||
        currentAction.type !== 'pick' ||
        currentAction.completed
      ) {
        return;
      }

      console.log('✅ 检测到pick阶段，准备执行自动pick...');

      // 获取倒计时设置
      const autoPickCountdown = $local.getItem('autoPickCountdown') || 5;

      // 获取当前阶段信息以检查剩余时间
      const phaseInfo = await banPickService.getCurrentPhaseInfo();
      if (phaseInfo && phaseInfo.timer) {
        const remainingTime = Math.floor(
          phaseInfo.timer.adjustedTimeLeftInPhase / 1000
        );

        // 如果剩余时间小于等于设定的倒计时，执行pick
        if (remainingTime <= autoPickCountdown) {
          // TODO: 这里需要根据位置设置获取要pick的英雄
          // const positionSettings = $local.getItem('positionSettings') || {};
          // const pickList = positionSettings[currentPosition]?.pickChampions || [];
          // if (pickList.length > 0) {
          //   const result = await banPickService.pickChampion(pickList[0]);
          //   if (result.success) {
          //     eventBus.emit('auto-pick:executed', pickList[0]);
          //     toast.success(`已自动选择英雄: ${pickList[0]}`);
          //   }
          // }

          console.log(`⏰ 倒计时剩余${remainingTime}秒，应该执行自动pick`);
        }
      }
    } catch (error: any) {
      console.error('自动选择失败:', error);
      eventBus.emit('auto-pick:error', error.message || '自动选择失败');
    }
  };

  // 开始游戏阶段轮询
  const startGamePhasePolling = () => {
    if (isGamePhasePolling.value) {
      console.log('游戏阶段轮询已在进行中');
      return;
    }

    console.log('🎮 开始游戏阶段轮询');
    isGamePhasePolling.value = true;

    // 立即执行一次检查
    checkGamePhaseAndExecute();

    // 设置定时器，每1秒检查一次游戏阶段
    gamePhaseTimer.value = setInterval(async () => {
      await checkGamePhaseAndExecute();
    }, 1000);
  };

  // 停止游戏阶段轮询
  const stopGamePhasePolling = () => {
    if (gamePhaseTimer.value) {
      clearInterval(gamePhaseTimer.value);
      gamePhaseTimer.value = null;
    }
    isGamePhasePolling.value = false;
    lastGamePhase.value = null;
    console.log('🛑 停止游戏阶段轮询');
  };

  // 开始自动接受轮询
  const startPolling = () => {
    if (isPolling.value) {
      console.log('自动接受游戏轮询已在进行中');
      return;
    }

    console.log('🎮 开始自动接受游戏轮询');
    isPolling.value = true;

    // 立即执行一次检查
    checkAndAcceptGame();

    // 设置定时器，每2秒检查一次
    pollTimer.value = setInterval(async () => {
      await checkAndAcceptGame();
    }, 2000);
  };

  // 停止自动接受轮询
  const stopPolling = () => {
    if (pollTimer.value) {
      clearInterval(pollTimer.value);
      pollTimer.value = null;
    }
    isPolling.value = false;
    console.log('🛑 停止自动接受游戏轮询');
  };

  // 启用自动接受
  const enable = () => {
    isEnabled.value = true;
    startPolling();
    console.log('✅ 自动接受游戏已启用');
  };

  // 禁用自动接受
  const disable = () => {
    isEnabled.value = false;
    stopPolling();
    console.log('❌ 自动接受游戏已禁用');

    // 如果自动接受被禁用，但自动ban/pick仍然开启，则直接开始游戏阶段检查
    if (autoBanEnabled.value || autoPickEnabled.value) {
      startGamePhasePolling();
    }
  };

  // 启用自动 ban
  const enableAutoBan = () => {
    autoBanEnabled.value = true;
    $local.setItem('autoBanEnabled', true);
    console.log('✅ 自动 ban 已启用');

    // 如果自动接受未开启，直接开始游戏阶段检查
    if (!isEnabled.value && !isGamePhasePolling.value) {
      startGamePhasePolling();
    }
  };

  // 禁用自动 ban
  const disableAutoBan = () => {
    autoBanEnabled.value = false;
    $local.setItem('autoBanEnabled', false);
    console.log('❌ 自动 ban 已禁用');

    // 如果自动pick也被禁用且自动接受也被禁用，停止游戏阶段检查
    if (!autoPickEnabled.value && !isEnabled.value) {
      stopGamePhasePolling();
    }
  };

  // 启用自动选择
  const enableAutoPick = () => {
    autoPickEnabled.value = true;
    $local.setItem('autoPickEnabled', true);
    console.log('✅ 自动选择已启用');

    // 如果自动接受未开启，直接开始游戏阶段检查
    if (!isEnabled.value && !isGamePhasePolling.value) {
      startGamePhasePolling();
    }
  };

  // 禁用自动选择
  const disableAutoPick = () => {
    autoPickEnabled.value = false;
    $local.setItem('autoPickEnabled', false);
    console.log('❌ 自动选择已禁用');

    // 如果自动ban也被禁用且自动接受也被禁用，停止游戏阶段检查
    if (!autoBanEnabled.value && !isEnabled.value) {
      stopGamePhasePolling();
    }
  };

  // 设置事件监听器
  const setupEventListeners = () => {
    eventBus.on('auto-accept:enable', enable);
    eventBus.on('auto-accept:disable', disable);
    eventBus.on('auto-ban:enable', enableAutoBan);
    eventBus.on('auto-ban:disable', disableAutoBan);
    eventBus.on('auto-pick:enable', enableAutoPick);
    eventBus.on('auto-pick:disable', disableAutoPick);
  };

  // 移除事件监听器
  const removeEventListeners = () => {
    eventBus.off('auto-accept:enable', enable);
    eventBus.off('auto-accept:disable', disable);
    eventBus.off('auto-ban:enable', enableAutoBan);
    eventBus.off('auto-ban:disable', disableAutoBan);
    eventBus.off('auto-pick:enable', enableAutoPick);
    eventBus.off('auto-pick:disable', disableAutoPick);
  };

  // 初始化
  const initialize = () => {
    // 检查本地存储中的设置
    const savedAutoAccept = $local.getItem('autoAcceptGame');
    const savedAutoBan = $local.getItem('autoBanEnabled');
    const savedAutoPick = $local.getItem('autoPickEnabled');

    if (savedAutoAccept) {
      enable();
    }

    autoBanEnabled.value = savedAutoBan || false;
    autoPickEnabled.value = savedAutoPick || false;

    // 如果自动接受未开启，但自动ban/pick开启了，直接开始游戏阶段检查
    if (!savedAutoAccept && (savedAutoBan || savedAutoPick)) {
      startGamePhasePolling();
    }
  };

  onMounted(() => {
    setupEventListeners();
    initialize();
  });

  onUnmounted(() => {
    removeEventListeners();
    stopPolling();
    stopGamePhasePolling();
  });

  return {
    isEnabled,
    isPolling,
    isGamePhasePolling,
    autoBanEnabled,
    autoPickEnabled,
    enable,
    disable,
    enableAutoBan,
    disableAutoBan,
    enableAutoPick,
    disableAutoPick,
    startPolling,
    stopPolling,
    startGamePhasePolling,
    stopGamePhasePolling,
    checkAndAcceptGame,
    checkAndExecuteAutoBan,
    checkAndExecuteAutoPick,
  };
}
