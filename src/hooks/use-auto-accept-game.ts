import { ref, onMounted, onUnmounted } from 'vue';
import { GameflowService } from '@/lib/service/gameflow-service';
import { $local } from '@/storages/storage-use';
import { toast } from 'vue-sonner';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { BanPickService } from '@/lib/service/ban-pick-service';
import { AssignedPosition } from '@/types/players-info';

export function useAutoAcceptGame() {
  const gamePhaseTimer = ref<NodeJS.Timeout | null>(null);
  const lastGamePhase = ref<GameflowPhaseEnum | null>(null);

  const banpickService = new BanPickService();
  const gameflowService = new GameflowService();

  // 检查游戏阶段并执行相应操作
  const checkGamePhaseAndExecute = async (): Promise<void> => {
    // 获取当前游戏阶段
    const phase = await gameflowService.getGameflowPhase();
    // 场景 1
    if (phase === GameflowPhaseEnum.ReadyCheck) {
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
      const action = session.actions[session.actions.length - 1][0];
      const type = action.type;
      if (type === 'ban') {
        // 检查本地存储中是否开启了自动ban/pick
        const autoBanPickEnabled = $local.getItem('autoBanEnabled');
        if (
          !autoBanPickEnabled ||
          action.isInProgress === false ||
          action.actorCellId === session.localPlayerCellId
        ) {
          return;
        }
      }
      const champSelectSession = await banpickService.getChampSelectSession();
      const myPosition = champSelectSession.myTeam.filter(
        item => item.cellId === session.localPlayerCellId
      )[0].assignedPosition;
      const positionSettings = $local.getItem('positionSettings');
      if (!positionSettings) {
        return;
      }
      const myPositionInfo = positionSettings[myPosition];
      if (!myPositionInfo) {
        return;
      }
    }

    // 如果阶段发生变化，记录日志
    if (lastGamePhase.value !== phase) {
      console.log(`游戏阶段变化: ${lastGamePhase.value} -> ${phase}`);
      lastGamePhase.value = phase;
    }

    // 检查是否退出了对局
    if (
      phase === GameflowPhaseEnum.None ||
      phase === GameflowPhaseEnum.Lobby ||
      phase === GameflowPhaseEnum.EndOfGame
    ) {
      console.log('检测到退出对局，停止游戏阶段检查');
      stopGamePhasePolling();
      return;
    }

    // 如果在英雄选择阶段，执行自动ban/pick
    // if (phase === GameflowPhaseEnum.ChampSelect) {
    // await checkAndExecuteAutoBan();
    // await checkAndExecuteAutoPick();
    // }
  };

  // 开始游戏阶段轮询
  const startGamePhasePolling = () => {
    console.log('🎮 开始游戏阶段轮询');
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
