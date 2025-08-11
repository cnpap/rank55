import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowService } from '@/lib/service/gameflow-service';
import { $local } from '@/storages/storage-use';
import { toast } from 'vue-sonner';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { BanPickService } from '@/lib/service/ban-pick-service';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const lastGamePhase = ref<GameflowPhaseEnum | null>(null);

  const banpickService = new BanPickService();
  const gameflowService = new GameflowService();

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
        return;
      }
      console.log(`当前位置已开始选择，正在执行操作...`);
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
      const type = action.type;
      if (type === 'ban') {
        const autoBanPickEnabled = $local.getItem('autoBanEnabled');
        if (!autoBanPickEnabled || myPositionInfo.banChampions.length === 0) {
          console.log('未配置自动禁用英雄');
          return;
        }
        // 修正：获取所有已禁用的英雄
        const banedChampions = flatActions
          .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
          .map(a => a.championId);
        console.log(`已禁用的英雄: ${banedChampions}`);

        for (const championId of myPositionInfo.banChampions) {
          if (banedChampions.includes(parseInt(championId))) {
            continue;
          }
          await banpickService.banChampion(parseInt(championId));
          return;
        }
        return;
      } else if (type === 'pick') {
        const autoPickEnabled = $local.getItem('autoPickEnabled');
        if (!autoPickEnabled || myPositionInfo.pickChampions.length === 0) {
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

        for (const championId of myPositionInfo.pickChampions) {
          const championIdNum = parseInt(championId);
          // 跳过已被禁用或已被选择的英雄
          if (
            banedChampions.includes(championIdNum) ||
            pickedChampions.includes(championIdNum)
          ) {
            continue;
          }
          await banpickService.pickChampion(championIdNum);
          toast.success('已自动选择英雄');
          console.log(`✅ 自动选择英雄成功: ${championId}`);
          return;
        }

        // 如果所有预设英雄都不可用，记录日志
        console.log('⚠️ 所有预设的选择英雄都不可用（已被禁用或选择）');
        return;
      }
    }

    // 如果阶段发生变化，记录日志
    if (lastGamePhase.value !== phase) {
      console.log(`游戏阶段变化: ${lastGamePhase.value} -> ${phase}`);
      lastGamePhase.value = phase;
    }
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
    }, 2000);
  };

  // 停止游戏阶段轮询
  const stopGamePhasePolling = () => {
    if (gamePhaseTimer.value) {
      clearInterval(gamePhaseTimer.value);
      gamePhaseTimer.value = null;
    }
    lastGamePhase.value = null;
    console.log('🛑 停止游戏阶段轮询');
  };

  onMounted(() => {
    startGamePhasePolling();
  });

  onUnmounted(() => {
    stopGamePhasePolling();
  });
}
