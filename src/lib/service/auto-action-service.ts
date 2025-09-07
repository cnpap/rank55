import {
  banPickService,
  chatNotificationService,
  gameflowService,
  gamePhaseManager,
} from './service-manager';
import { $local, type PositionSetting } from '@/storages/storage-use';
import type { ChampSelectSession } from '@/types/champ-select-session';
import type { AllAction } from '@/types/ban-phase-detail';
import { toast } from 'vue-sonner';
import { getChampionName } from '../db/game-data-db';

export class AutoActionService {
  // 记录无法使用的英雄（未拥有或不在免费轮换中）
  private unavailableChampions: Set<number> = new Set();

  // 检查英雄是否因为未拥有或不在免费轮换中而不可用
  private isChampionUnavailable(error: any): boolean {
    return (
      error.message &&
      (error.message.includes('is not owned by account') ||
        error.message.includes('is not free to play'))
    );
  }

  // 尝试选择/禁用英雄的通用方法
  private async tryChampionAction(
    championId: number,
    actionType: 'pick' | 'ban' | 'hover',
    skipConditions: (championId: number) => boolean = () => false
  ): Promise<boolean> {
    // 检查跳过条件
    if (skipConditions(championId)) {
      return false;
    }
    try {
      if (actionType === 'pick') {
        await banPickService.pickChampion(championId);
        chatNotificationService.sendSystemMessage(
          `已自动选择英雄: ${getChampionName(championId.toString())}`
        );
      } else if (actionType === 'ban') {
        await banPickService.banChampion(championId);
        chatNotificationService.sendSystemMessage(
          `已自动禁用英雄: ${getChampionName(championId.toString())}`
        );
      } else if (actionType === 'hover') {
        await banPickService.hoverChampion(championId);
        chatNotificationService.sendSystemMessage(
          `预选英雄成功: ${getChampionName(championId.toString())}`
        );
      }
      return true;
    } catch (error: any) {
      const actionText =
        actionType === 'pick' ? '选择' : actionType === 'ban' ? '禁用' : '预选';
      console.log(`❌ ${actionText}英雄 ${championId} 失败: ${error.message}`);

      if (this.isChampionUnavailable(error)) {
        chatNotificationService.sendSystemMessage(
          `英雄 ${getChampionName(championId.toString())} 无法 ${actionText}（未拥有或不在免费轮换中），尝试下一个英雄`
        );
        if (actionType === 'hover') {
          this.unavailableChampions.add(championId);
        }
        return false;
      } else if (actionType !== 'hover') {
        throw error;
      } else {
        // 预选操作遇到其他错误
        console.log(`❌ 预选英雄 ${championId} 失败: ${error}`);
        return false;
      }
    }
  }

  async executeReadyCheckAction(): Promise<boolean> {
    const autoAcceptEnabled = $local.getItem('autoAcceptGame');
    if (!autoAcceptEnabled) {
      return false;
    }
    await gameflowService.acceptReadyCheck();
    toast.success('已自动接受对局');
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
    for (const championId of myPositionInfo.pickChampions) {
      const success = await this.tryChampionAction(
        parseInt(championId),
        'hover'
      );
      if (success) {
        return; // 成功预选后退出循环
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
      // 定义跳过条件
      const skipConditions = (championIdNum: number) => {
        if (banedChampions.includes(championIdNum)) {
          console.log(
            `英雄 ${getChampionName(championIdNum.toString())} 已被禁用，跳过`
          );
          return true;
        }
        if (prePickedChampions.includes(championIdNum)) {
          console.log(
            `英雄 ${getChampionName(championIdNum.toString())} 已被预选，不能禁用，跳过`
          );
          return true;
        }
        console.log(
          `正在禁用英雄: ${getChampionName(championIdNum.toString())}`
        );
        return false;
      };

      const success = await this.tryChampionAction(
        parseInt(championId),
        'ban',
        skipConditions
      );
      if (success) {
        return;
      }
    }

    chatNotificationService.sendSystemMessage('所有预设的禁用英雄都不可用');
  }

  async executePickAction(
    flatActions: AllAction[],
    myPositionInfo: PositionSetting
  ): Promise<void> {
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
        // chatNotificationService.sendSystemMessage(
        //   `优先选择已预选的英雄: ${gameDataStore.champions[prePickedChampionId].name}`
        // );
        const success = await this.tryChampionAction(
          prePickedChampionId,
          'pick'
        );
        if (success) {
          return;
        }
      }
    }

    // 如果没有预选英雄或预选英雄不可用，按配置顺序选择
    for (const championId of myPositionInfo.pickChampions) {
      // 定义跳过条件
      const skipConditions = (championIdNum: number) => {
        if (banedChampions.includes(championIdNum)) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${getChampionName(championIdNum.toString())} 已被禁用，跳过`
          );
          return true;
        }

        if (allPickedChampions.includes(championIdNum)) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${getChampionName(championIdNum.toString())} 已被选择，跳过`
          );
          return true;
        }

        // 检查是否是预选阶段已确认无法使用的英雄
        if (this.unavailableChampions.has(championIdNum)) {
          chatNotificationService.sendSystemMessage(
            `英雄 ${getChampionName(championIdNum.toString())} 无法使用（未拥有或不在免费轮换中），跳过`
          );
          return true;
        }

        chatNotificationService.sendSystemMessage(
          `正在选择英雄: ${getChampionName(championIdNum.toString())}`
        );
        return false;
      };

      const success = await this.tryChampionAction(
        parseInt(championId),
        'pick',
        skipConditions
      );
      if (success) {
        return;
      }
    }

    chatNotificationService.sendSystemMessage('所有预设的选择英雄都不可用');
  }
}
