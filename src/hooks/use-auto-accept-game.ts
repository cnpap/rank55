import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowService } from '@/lib/service/gameflow-service';
import { $local, PositionSetting } from '@/storages/storage-use';
import { toast } from 'vue-sonner';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { BanPickService } from '@/lib/service/ban-pick-service';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const lastGamePhase = ref<GameflowPhaseEnum | null>(null);

  // 新增：跟踪操作开始时间和状态
  const actionStartTime = ref<number | null>(null);
  const currentActionType = ref<'ban' | 'pick' | null>(null);
  const actionExecuted = ref<boolean>(false);

  const banpickService = new BanPickService();
  const gameflowService = new GameflowService();

  // 重置操作状态
  const resetActionState = () => {
    actionStartTime.value = null;
    currentActionType.value = null;
    actionExecuted.value = false;
  };

  // 检查游戏阶段并执行相应操作
  const checkGamePhaseAndExecute = async (): Promise<void> => {
    // 获取当前游戏阶段
    const phase = await gameflowService.getGameflowPhase();
    console.log(`当前游戏阶段: ${phase}`);

    // 场景 1
    if (phase === GameflowPhaseEnum.ReadyCheck) {
      console.log('当前游戏阶段: 准备检查');
      // 检查本地存储中是否开启了自动接受对局
      const autoAcceptEnabled = $local.getItem('autoAcceptGame');
      if (!autoAcceptEnabled) {
        return;
      }
      // 检查是否有待接受的对局
      const hasReadyCheck = await gameflowService.hasReadyCheck();
      if (hasReadyCheck) {
        console.log('检测到待接受的对局，正在自动接受...');
        await gameflowService.acceptReadyCheck();

        toast.success('已自动接受对局');
        console.log('✅ 自动接受对局成功');
        return;
      }
    }

    // 场景 2
    if (phase === GameflowPhaseEnum.ChampSelect) {
      const session = await banpickService.getChampSelectSession();
      const flatActions = session.actions.flat();
      const action = flatActions.find(
        a => a.isInProgress && a.actorCellId === session.localPlayerCellId
      );

      if (
        !action ||
        action.isInProgress !== true ||
        action.actorCellId !== session.localPlayerCellId
      ) {
        console.log(`当前位置未开始选择，等待中...`);
        // 如果没有进行中的操作，重置状态
        resetActionState();
        return;
      }

      const myPosition = session.myTeam.filter(
        item => item.cellId === session.localPlayerCellId
      )[0].assignedPosition;

      const positionSettings = $local.getItem('positionSettings');
      if (!positionSettings) {
        console.log('未配置位置设置');
        return;
      }

      console.log(`当前位置: ${myPosition}`);
      const myPositionInfo = positionSettings[myPosition];
      if (!myPositionInfo) {
        console.log(`未配置当前位置的设置`);
        return;
      }

      console.log(`当前位置设置: ${JSON.stringify(myPositionInfo)}`);
      const type = action.type as 'ban' | 'pick';

      // 检查是否是新的操作阶段
      if (currentActionType.value !== type || actionExecuted.value) {
        // 新的操作阶段，重置状态并记录开始时间
        actionStartTime.value = Date.now();
        currentActionType.value = type;
        actionExecuted.value = false;
        console.log(`🕐 开始 ${type} 阶段倒计时`);
      }

      // 获取对应的倒计时设置
      const countdownKey =
        type === 'ban' ? 'autoBanCountdown' : 'autoPickCountdown';
      const countdown = $local.getItem(countdownKey) || 5;

      // 检查是否已经过了倒计时时间
      const elapsed = Date.now() - (actionStartTime.value || 0);
      const remainingTime = Math.max(0, countdown * 1000 - elapsed);

      if (remainingTime > 0) {
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        console.log(`⏳ ${type} 操作倒计时中，还剩 ${remainingSeconds} 秒`);
        return;
      }

      // 倒计时结束，执行操作
      if (!actionExecuted.value) {
        console.log(`⏰ ${type} 倒计时结束，开始执行操作`);
        actionExecuted.value = true;

        if (type === 'ban') {
          await executeBanAction(flatActions, myPositionInfo);
        } else if (type === 'pick') {
          await executePickAction(flatActions, myPositionInfo);
        }
      }
    } else {
      // 如果不在 ChampSelect 阶段，重置操作状态
      resetActionState();
    }

    // 如果阶段发生变化，记录日志
    if (lastGamePhase.value !== phase) {
      console.log(`游戏阶段变化: ${lastGamePhase.value} -> ${phase}`);
      lastGamePhase.value = phase;
    }
  };

  // 执行禁用操作
  const executeBanAction = async (
    flatActions: any[],
    myPositionInfo: PositionSetting
  ) => {
    const autoBanEnabled = $local.getItem('autoBanEnabled');
    console.log(`自动禁用开关状态: ${autoBanEnabled}`);
    console.log(
      `当前位置禁用英雄列表: ${JSON.stringify(myPositionInfo.banChampions)}`
    );

    if (!autoBanEnabled || myPositionInfo.banChampions.length === 0) {
      console.log('未配置自动禁用英雄或开关未开启');
      return;
    }

    // 获取所有已禁用的英雄
    const banedChampions = flatActions
      .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
      .map(a => a.championId);
    console.log(`已禁用的英雄: ${banedChampions}`);

    for (const championId of myPositionInfo.banChampions) {
      console.log(`当前禁用英雄: ${championId}`);
      const championIdNum = parseInt(championId);
      console.log(`尝试禁用英雄: ${championIdNum}`);

      if (banedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被禁用，跳过`);
        continue;
      }

      console.log(`正在禁用英雄: ${championIdNum}`);
      await banpickService.banChampion(championIdNum);
      toast.success(`已自动禁用英雄: ${championId}`);
      console.log(`✅ 自动禁用英雄成功: ${championId}`);
      return;
    }
    console.log('⚠️ 所有预设的禁用英雄都已被禁用');
  };

  // 执行选择操作
  const executePickAction = async (flatActions: any[], myPositionInfo: any) => {
    const autoPickEnabled = $local.getItem('autoPickEnabled');
    console.log(`自动选择开关状态: ${autoPickEnabled}`);
    console.log(
      `当前位置选择英雄列表: ${JSON.stringify(myPositionInfo.pickChampions)}`
    );

    if (!autoPickEnabled || myPositionInfo.pickChampions.length === 0) {
      console.log('未配置自动选择英雄或开关未开启');
      return;
    }

    // 获取所有已禁用的英雄
    const banedChampions = flatActions
      .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    // 获取所有已选择的英雄
    const pickedChampions = flatActions
      .filter(a => a.type === 'pick' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    console.log(`已禁用的英雄: ${banedChampions}`);
    console.log(`已选择的英雄: ${pickedChampions}`);

    for (const championId of myPositionInfo.pickChampions) {
      console.log(`当前选择英雄: ${championId}`);
      const championIdNum = parseInt(championId);
      console.log(`尝试选择英雄: ${championIdNum}`);

      // 跳过已被禁用或已被选择的英雄
      if (banedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被禁用，跳过`);
        continue;
      }

      if (pickedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被选择，跳过`);
        continue;
      }

      console.log(`正在选择英雄: ${championIdNum}`);
      await banpickService.pickChampion(championIdNum);
      toast.success('已自动选择英雄');
      console.log(`✅ 自动选择英雄成功: ${championId}`);
      return;
    }

    // 如果所有预设英雄都不可用，记录日志
    console.log('⚠️ 所有预设的选择英雄都不可用（已被禁用或选择）');
  };

  // 开始游戏阶段轮询
  const startGamePhasePolling = () => {
    console.log('🎮 开始游戏阶段轮询');
    // 设置定时器，每1秒检查一次游戏阶段
    gamePhaseTimer.value = setInterval(async () => {
      try {
        await checkGamePhaseAndExecute();
      } catch (error) {
        console.error('游戏阶段轮询出错:', error);
      }
    }, 1000); // 改为1秒检查一次，以便更精确的倒计时
  };

  // 停止游戏阶段轮询
  const stopGamePhasePolling = () => {
    if (gamePhaseTimer.value) {
      clearInterval(gamePhaseTimer.value);
      gamePhaseTimer.value = null;
    }
    lastGamePhase.value = null;
    resetActionState();
    console.log('🛑 停止游戏阶段轮询');
  };

  onMounted(() => {
    startGamePhasePolling();
  });

  onUnmounted(() => {
    stopGamePhasePolling();
  });
}
