import { BanPickService } from './ban-pick-service';
import { $local, type PositionSetting } from '@/storages/storage-use';
import { toast } from 'vue-sonner';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { AllAction } from '@/types/ban-phase-detail';
import { GamePhaseManager } from './game-phase-manager';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { GameflowService } from './gameflow-service';

export class AutoActionService {
  private banpickService: BanPickService;
  private gamePhaseManager: GamePhaseManager;
  private gameflowService: GameflowService;
  constructor() {
    this.banpickService = new BanPickService();
    this.gamePhaseManager = new GamePhaseManager();
    this.gameflowService = new GameflowService();
  }

  async executeReadyCheckAction(): Promise<boolean> {
    const autoAcceptEnabled = $local.getItem('autoAcceptGame');
    if (!autoAcceptEnabled) {
      return false;
    }

    const currentPhase = await this.gamePhaseManager.getCurrentPhase();
    if (currentPhase === GameflowPhaseEnum.ReadyCheck) {
      console.log('检测到待接受的对局，正在自动接受...');
      await this.gameflowService.acceptReadyCheck();
      toast.success('已自动接受对局');
      console.log('✅ 自动接受对局成功');
      return true;
    }

    return false;
  }

  async executePrePickAction(session: ChampSelectSession): Promise<void> {
    const { myTeam, localPlayerCellId } = session;
    const positionSettings = $local.getItem('positionSettings');

    if (!positionSettings) {
      console.log('未配置位置设置');
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
    if (!myPositionInfo?.pickChampions?.[0]) {
      console.log('未配置当前位置的英雄');
      return;
    }

    const myChampion = myPositionInfo.pickChampions[0];
    await this.banpickService.hoverChampion(parseInt(myChampion));
  }

  async executeBanAction(
    flatActions: AllAction[],
    myPositionInfo: PositionSetting
  ): Promise<void> {
    const autoBanEnabled = $local.getItem('autoBanEnabled');

    if (!autoBanEnabled || myPositionInfo.banChampions.length === 0) {
      console.log('未配置自动禁用英雄或开关未开启');
      return;
    }

    const session = await this.banpickService.getChampSelectSession();
    const banedChampions = flatActions
      .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    const prePickedChampions = [
      ...session.myTeam
        .filter(player => player.championPickIntent !== 0)
        .map(player => player.championPickIntent),
      ...session.theirTeam
        .filter(player => player.championPickIntent !== 0)
        .map(player => player.championPickIntent),
    ];

    for (const championId of myPositionInfo.banChampions) {
      const championIdNum = parseInt(championId);

      if (banedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被禁用，跳过`);
        continue;
      }

      if (prePickedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被预选，不能禁用，跳过`);
        continue;
      }

      console.log(`正在禁用英雄: ${championIdNum}`);
      await this.banpickService.banChampion(championIdNum);
      toast.success(`已自动禁用英雄: ${championId}`);
      console.log(`✅ 自动禁用英雄成功: ${championId}`);
      return;
    }

    console.log('⚠️ 所有预设的禁用英雄都已被禁用或被预选');
  }

  async executePickAction(
    flatActions: AllAction[],
    myPositionInfo: PositionSetting
  ): Promise<void> {
    const autoPickEnabled = $local.getItem('autoPickEnabled');

    if (!autoPickEnabled || myPositionInfo.pickChampions.length === 0) {
      console.log('未配置自动选择英雄或开关未开启');
      return;
    }

    const session = await this.banpickService.getChampSelectSession();
    const banedChampions = flatActions
      .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    const pickedChampionsFromActions = flatActions
      .filter(a => a.type === 'pick' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    const pickedChampionsFromTeams = [
      ...session.myTeam
        .filter(player => player.championId !== 0)
        .map(player => player.championId),
      ...session.theirTeam
        .filter(player => player.championId !== 0)
        .map(player => player.championId),
    ];

    const allPickedChampions = [
      ...new Set([...pickedChampionsFromActions, ...pickedChampionsFromTeams]),
    ];

    for (const championId of myPositionInfo.pickChampions) {
      const championIdNum = parseInt(championId);

      if (banedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被禁用，跳过`);
        continue;
      }

      if (allPickedChampions.includes(championIdNum)) {
        console.log(`英雄 ${championIdNum} 已被选择，跳过`);
        continue;
      }

      console.log(`正在选择英雄: ${championIdNum}`);
      await this.banpickService.pickChampion(championIdNum);
      toast.success('已自动选择英雄');
      console.log(`✅ 自动选择英雄成功: ${championId}`);
      return;
    }

    console.log('⚠️ 所有预设的选择英雄都不可用（已被禁用或选择）');
  }
}
