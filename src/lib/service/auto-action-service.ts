import {
  banPickService,
  chatNotificationService,
  gameflowService,
  gamePhaseManager,
} from './service-manager';
import { $local, type PositionSetting } from '@/storages/storage-use';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { AllAction } from '@/types/ban-phase-detail';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { toast } from 'vue-sonner';

export class AutoActionService {
  // 记录无法使用的英雄（未拥有或不在免费轮换中）
  private unavailableChampions: Set<number> = new Set();
  async executeReadyCheckAction(): Promise<boolean> {
    const autoAcceptEnabled = $local.getItem('autoAcceptGame');
    if (!autoAcceptEnabled) {
      return false;
    }

    const currentPhase = await gamePhaseManager.getCurrentPhase();
    if (currentPhase === GameflowPhaseEnum.ReadyCheck) {
      console.log('检测到待接受的对局，正在自动接受...');
      await gameflowService.acceptReadyCheck();
      toast.success('已自动接受对局');
      console.log('✅ 自动接受对局成功');
      return true;
    }

    return false;
  }

  async executePrePickAction(session: ChampSelectSession): Promise<void> {
    // 每次进入预选阶段时清空无法使用的英雄记录
    this.unavailableChampions.clear();
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

    // 循环尝试所有配置的英雄，直到找到一个可以成功预选的
    for (const champion of myPositionInfo.pickChampions) {
      try {
        await banPickService.hoverChampion(parseInt(champion));
        chatNotificationService.sendSystemMessage(
          `✅ 预选英雄成功: ${champion}`
        );
        return; // 成功预选后退出循环
      } catch (error: any) {
        console.log(`❌ 预选英雄 ${champion} 失败: ${error.message}`);
        // 检查是否是因为没有拥有该英雄
        if (
          error.message &&
          (error.message.includes('is not owned by account') ||
            error.message.includes('is not free to play'))
        ) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${champion} 无法预选（未拥有或不在免费轮换中），尝试下一个英雄`
          );
          // 记录无法使用的英雄
          this.unavailableChampions.add(parseInt(champion));
          continue; // 继续尝试下一个英雄
        } else {
          chatNotificationService.sendSystemMessage(`预选英雄失败: ${error}`);
          return; // 遇到其他错误时退出
        }
      }
    }

    // 如果所有英雄都无法预选
    chatNotificationService.sendSystemMessage(
      '所有预设英雄都无法预选（可能都未拥有或不在免费轮换中）'
    );
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

    const session = await banPickService.getChampSelectSession();
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
      try {
        await banPickService.banChampion(championIdNum);
        chatNotificationService.sendSystemMessage(
          `已自动禁用英雄: ${championId}`
        );
        return;
      } catch (error: any) {
        console.log(`❌ 禁用英雄 ${championIdNum} 失败: ${error.message}`);
        // 检查是否是因为没有拥有该英雄或其他权限问题
        if (
          error.message &&
          (error.message.includes('is not owned by account') ||
            error.message.includes('is not free to play'))
        ) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${championId} 无法禁用，尝试下一个英雄`
          );
          continue;
        }
        // 其他错误，重新抛出
        console.error(`禁用英雄时发生未知错误:`, error);
        throw error;
      }
    }

    chatNotificationService.sendSystemMessage('所有预设的禁用英雄都不可用');
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

    const session = await banPickService.getChampSelectSession();
    const banedChampions = flatActions
      .filter(a => a.type === 'ban' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    const pickedChampionsFromActions = flatActions
      .filter(a => a.type === 'pick' && a.completed && a.championId !== 0)
      .map(a => a.championId);

    // 获取真正已选择的英雄（排除自己的预选）
    const currentPlayer = session.myTeam.find(
      player => player.cellId === session.localPlayerCellId
    );

    const pickedChampionsFromTeams = [
      // 我方队伍：排除自己，只统计其他人已确定选择的英雄
      ...session.myTeam
        .filter(
          player =>
            player.cellId !== session.localPlayerCellId &&
            player.championId !== 0
        )
        .map(player => player.championId),
      // 敌方队伍：统计所有已确定选择的英雄
      ...session.theirTeam
        .filter(player => player.championId !== 0)
        .map(player => player.championId),
    ];

    const allPickedChampions = [
      ...new Set([...pickedChampionsFromActions, ...pickedChampionsFromTeams]),
    ];
    console.log('已选择的英雄:', allPickedChampions);
    console.log('当前玩家预选英雄:', currentPlayer?.championPickIntent || 0);

    // 优先选择已预选的英雄（如果可用）
    const prePickedChampionId = currentPlayer?.championPickIntent || 0;
    if (prePickedChampionId !== 0) {
      const prePickedChampionIdStr = prePickedChampionId.toString();
      // 检查预选的英雄是否在配置列表中且可用
      if (
        myPositionInfo.pickChampions.includes(prePickedChampionIdStr) &&
        !banedChampions.includes(prePickedChampionId) &&
        !allPickedChampions.includes(prePickedChampionId)
      ) {
        chatNotificationService.sendSystemMessage(
          `优先选择已预选的英雄: ${prePickedChampionId}`
        );
        try {
          await banPickService.pickChampion(prePickedChampionId);
          chatNotificationService.sendSystemMessage(
            `已自动选择预选英雄: ${prePickedChampionIdStr}`
          );
          return;
        } catch (error: any) {
          console.log(
            `❌ 选择预选英雄 ${prePickedChampionId} 失败: ${error.message}`
          );
          // 如果预选英雄选择失败，继续尝试其他英雄
        }
      }
    }

    // 如果没有预选英雄或预选英雄不可用，按配置顺序选择
    for (const championId of myPositionInfo.pickChampions) {
      const championIdNum = parseInt(championId);

      if (banedChampions.includes(championIdNum)) {
        chatNotificationService.sendSystemMessage(
          `英雄 ${championIdNum} 已被禁用，跳过`
        );
        continue;
      }

      if (allPickedChampions.includes(championIdNum)) {
        chatNotificationService.sendSystemMessage(
          `英雄 ${championIdNum} 已被选择，跳过`
        );
        continue;
      }

      // 检查是否是预选阶段已确认无法使用的英雄
      if (this.unavailableChampions.has(championIdNum)) {
        chatNotificationService.sendSystemMessage(
          `英雄 ${championIdNum} 无法使用（未拥有或不在免费轮换中），跳过`
        );
        continue;
      }

      chatNotificationService.sendSystemMessage(
        `正在选择英雄: ${championIdNum}`
      );
      try {
        await banPickService.pickChampion(championIdNum);
        chatNotificationService.sendSystemMessage(
          `已自动选择英雄: ${championId}`
        );
        return;
      } catch (error: any) {
        chatNotificationService.sendSystemMessage(
          `选择英雄 ${championIdNum} 失败，尝试下一个英雄`
        );
        // 检查是否是因为没有拥有该英雄
        if (
          error.message &&
          error.message.includes('is not owned by account')
        ) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${championIdNum} 未拥有，尝试下一个英雄`
          );
          continue;
        }
        // 检查是否是因为英雄不在免费轮换中
        if (error.message && error.message.includes('is not free to play')) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${championIdNum} 不在免费轮换中且未拥有，尝试下一个英雄`
          );
          continue;
        }
        // 其他错误，重新抛出
        chatNotificationService.sendSystemMessage(
          `选择英雄失败: ${error.message}`
        );
        throw error;
      }
    }

    chatNotificationService.sendSystemMessage('所有预设的选择英雄都不可用');
  }
}
