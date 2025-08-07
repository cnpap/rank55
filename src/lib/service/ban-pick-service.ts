import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

export class BanPickService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取当前游戏阶段信息
  async getGamePhase(): Promise<string> {
    try {
      const data = await this.makeRequest(
        'GET',
        '/lol-gameflow/v1/gameflow-phase'
      );
      return data;
    } catch (error) {
      throw new Error(`获取游戏阶段失败: ${error}`);
    }
  }

  // 检查是否在 ban/pick 阶段
  async isInChampSelect(): Promise<boolean> {
    try {
      const phase = await this.getGamePhase();
      return phase === 'ChampSelect';
    } catch (error) {
      console.warn('检查 ban/pick 阶段失败:', error);
      return false;
    }
  }

  // 获取英雄选择会话信息
  async getChampSelectSession(): Promise<any> {
    try {
      const data = await this.makeRequest(
        'GET',
        '/lol-champ-select/v1/session'
      );
      return data;
    } catch (error) {
      throw new Error(`获取英雄选择会话信息失败: ${error}`);
    }
  }

  // 获取当前阶段信息（更准确的方式）
  async getCurrentPhaseInfo(): Promise<{
    phase: string;
    isInProgress: boolean;
    actions: any[];
    localPlayerCellId: number;
    timer: any;
  } | null> {
    try {
      const session = await this.getChampSelectSession();

      if (!session) {
        return null;
      }

      return {
        phase: session.timer?.phase || 'unknown',
        isInProgress: session.timer?.isInfinite === false,
        actions: session.actions || [],
        localPlayerCellId: session.localPlayerCellId,
        timer: session.timer,
      };
    } catch (error) {
      console.warn('获取当前阶段信息失败:', error);
      return null;
    }
  }

  // 检查当前是否是禁用阶段（改进版本）
  async isBanPhase(): Promise<boolean> {
    try {
      const phaseInfo = await this.getCurrentPhaseInfo();

      if (!phaseInfo) {
        return false;
      }

      // 方法1: 检查 timer.phase 是否包含 ban
      const timerPhase = phaseInfo.phase?.toLowerCase() || '';
      const isTimerBanPhase = timerPhase.includes('ban');

      // 方法2: 检查当前进行中的 actions 是否有 ban 类型
      let hasActiveBanAction = false;
      for (const actionGroup of phaseInfo.actions) {
        for (const action of actionGroup) {
          if (
            action.type === 'ban' &&
            action.isInProgress &&
            !action.completed
          ) {
            hasActiveBanAction = true;
            break;
          }
        }
        if (hasActiveBanAction) break;
      }

      // 方法3: 检查当前玩家是否有进行中的 ban action
      let playerHasBanAction = false;
      for (const actionGroup of phaseInfo.actions) {
        for (const action of actionGroup) {
          if (
            action.type === 'ban' &&
            action.actorCellId === phaseInfo.localPlayerCellId &&
            action.isInProgress &&
            !action.completed
          ) {
            playerHasBanAction = true;
            break;
          }
        }
        if (playerHasBanAction) break;
      }

      // 综合判断：任何一个方法返回 true 就认为是 ban 阶段
      const result =
        isTimerBanPhase || hasActiveBanAction || playerHasBanAction;

      console.log(`Ban阶段判断详情:`, {
        timerPhase,
        isTimerBanPhase,
        hasActiveBanAction,
        playerHasBanAction,
        finalResult: result,
      });

      return result;
    } catch (error) {
      console.warn('检查是否是禁用阶段失败:', error);
      return false;
    }
  }

  // 获取详细的 ban 阶段信息（用于调试）
  async getBanPhaseDetails(): Promise<any> {
    try {
      const session = await this.getChampSelectSession();
      const phaseInfo = await this.getCurrentPhaseInfo();
      const isBan = await this.isBanPhase();

      if (!session || !phaseInfo) {
        return {
          isInChampSelect: false,
          isBanPhase: false,
          error: '无法获取会话信息',
        };
      }

      // 分析所有 ban 相关的 actions
      const banActions = [];
      for (
        let groupIndex = 0;
        groupIndex < phaseInfo.actions.length;
        groupIndex++
      ) {
        const actionGroup = phaseInfo.actions[groupIndex];
        for (
          let actionIndex = 0;
          actionIndex < actionGroup.length;
          actionIndex++
        ) {
          const action = actionGroup[actionIndex];
          if (action.type === 'ban') {
            banActions.push({
              groupIndex,
              actionIndex,
              ...action,
              isLocalPlayer: action.actorCellId === phaseInfo.localPlayerCellId,
            });
          }
        }
      }

      return {
        isInChampSelect: true,
        isBanPhase: isBan,
        timerPhase: phaseInfo.phase,
        localPlayerCellId: phaseInfo.localPlayerCellId,
        timer: phaseInfo.timer,
        banActions,
        allActions: phaseInfo.actions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isInChampSelect: false,
        isBanPhase: false,
        error: String(error),
      };
    }
  }

  // 获取当前玩家可执行的 action
  async getCurrentPlayerAction(): Promise<{
    actionId: number;
    type: 'ban' | 'pick';
    isInProgress: boolean;
    completed: boolean;
  } | null> {
    try {
      const phaseInfo = await this.getCurrentPhaseInfo();
      if (!phaseInfo) {
        return null;
      }

      // 查找当前玩家正在进行的 action
      for (const actionGroup of phaseInfo.actions) {
        for (const action of actionGroup) {
          if (
            action.actorCellId === phaseInfo.localPlayerCellId &&
            action.isInProgress &&
            !action.completed
          ) {
            return {
              actionId: action.id,
              type: action.type,
              isInProgress: action.isInProgress,
              completed: action.completed,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('获取当前玩家 action 失败:', error);
      return null;
    }
  }

  // Ban 英雄
  async banChampion(championId: number): Promise<{
    success: boolean;
    message: string;
    actionId?: number;
  }> {
    try {
      const currentAction = await this.getCurrentPlayerAction();

      if (!currentAction) {
        return {
          success: false,
          message: '当前没有可执行的 action',
        };
      }

      if (currentAction.type !== 'ban') {
        return {
          success: false,
          message: `当前 action 类型是 ${currentAction.type}，不是 ban`,
        };
      }

      if (!currentAction.isInProgress || currentAction.completed) {
        return {
          success: false,
          message: 'Ban action 不在进行中或已完成',
        };
      }

      // 执行 ban 操作
      const endpoint = `/lol-champ-select/v1/session/actions/${currentAction.actionId}`;
      const body = {
        championId: championId,
        completed: true,
        type: 'ban',
      };

      await this.makeRequest('PATCH', endpoint, body);

      return {
        success: true,
        message: `成功 ban 英雄 ${championId}`,
        actionId: currentAction.actionId,
      };
    } catch (error) {
      return {
        success: false,
        message: `Ban 英雄失败: ${error}`,
      };
    }
  }

  // Pick 英雄
  async pickChampion(championId: number): Promise<{
    success: boolean;
    message: string;
    actionId?: number;
  }> {
    try {
      const currentAction = await this.getCurrentPlayerAction();

      if (!currentAction) {
        return {
          success: false,
          message: '当前没有可执行的 action',
        };
      }

      if (currentAction.type !== 'pick') {
        return {
          success: false,
          message: `当前 action 类型是 ${currentAction.type}，不是 pick`,
        };
      }

      if (!currentAction.isInProgress || currentAction.completed) {
        return {
          success: false,
          message: 'Pick action 不在进行中或已完成',
        };
      }

      // 执行 pick 操作
      const endpoint = `/lol-champ-select/v1/session/actions/${currentAction.actionId}`;
      const body = {
        championId: championId,
        completed: true,
        type: 'pick',
      };

      await this.makeRequest('PATCH', endpoint, body);

      return {
        success: true,
        message: `成功 pick 英雄 ${championId}`,
        actionId: currentAction.actionId,
      };
    } catch (error) {
      return {
        success: false,
        message: `Pick 英雄失败: ${error}`,
      };
    }
  }

  // 预选英雄（hover，不完成 action）
  async hoverChampion(championId: number): Promise<{
    success: boolean;
    message: string;
    actionId?: number;
  }> {
    try {
      const currentAction = await this.getCurrentPlayerAction();

      if (!currentAction) {
        return {
          success: false,
          message: '当前没有可执行的 action',
        };
      }

      if (currentAction.type !== 'pick') {
        return {
          success: false,
          message: `当前 action 类型是 ${currentAction.type}，不是 pick`,
        };
      }

      if (!currentAction.isInProgress || currentAction.completed) {
        return {
          success: false,
          message: 'Pick action 不在进行中或已完成',
        };
      }

      // 执行 hover 操作（不完成 action）
      const endpoint = `/lol-champ-select/v1/session/actions/${currentAction.actionId}`;
      const body = {
        championId: championId,
        completed: false,
        type: 'pick',
      };

      await this.makeRequest('PATCH', endpoint, body);

      return {
        success: true,
        message: `成功预选英雄 ${championId}`,
        actionId: currentAction.actionId,
      };
    } catch (error) {
      return {
        success: false,
        message: `预选英雄失败: ${error}`,
      };
    }
  }

  // 获取所有可用的英雄（未被 ban 的）
  async getAvailableChampions(): Promise<number[]> {
    try {
      const session = await this.getChampSelectSession();
      if (!session) {
        return [];
      }

      const bannedChampions = new Set<number>();

      // 收集所有已 ban 的英雄
      for (const actionGroup of session.actions || []) {
        for (const action of actionGroup) {
          if (action.type === 'ban' && action.completed && action.championId) {
            bannedChampions.add(action.championId);
          }
        }
      }

      // 获取所有英雄 ID（这里简化处理，实际应该从游戏数据获取）
      // 返回未被 ban 的英雄 ID 列表
      const allChampions = Array.from({ length: 200 }, (_, i) => i + 1);
      return allChampions.filter(id => !bannedChampions.has(id));
    } catch (error) {
      console.warn('获取可用英雄失败:', error);
      return [];
    }
  }

  // 获取对局中的玩家信息
  async getMatchPlayersInfo(): Promise<any> {
    try {
      const session = await this.getChampSelectSession();
      if (!session) {
        throw new Error('无法获取英雄选择会话信息');
      }

      return {
        myTeam: session.myTeam || [],
        theirTeam: session.theirTeam || [],
        localPlayerCellId: session.localPlayerCellId,
        chatDetails: session.chatDetails || {},
      };
    } catch (error) {
      throw new Error(`获取对局玩家信息失败: ${error}`);
    }
  }

  // 获取当前召唤师信息
  async getCurrentSummoner(): Promise<any> {
    try {
      const data = await this.makeRequest(
        'GET',
        '/lol-summoner/v1/current-summoner'
      );
      return data;
    } catch (error) {
      throw new Error(`获取当前召唤师信息失败: ${error}`);
    }
  }

  // 根据召唤师ID获取排位信息
  async getRankedStats(summonerId: string): Promise<any> {
    try {
      const data = await this.makeRequest(
        'GET',
        `/lol-ranked/v1/ranked-stats/${summonerId}`
      );
      return data;
    } catch (error) {
      console.warn(`获取召唤师 ${summonerId} 排位信息失败:`, error);
      return null;
    }
  }

  // 获取详细的玩家信息（包括段位）
  async getDetailedPlayersInfo(): Promise<any> {
    try {
      const matchInfo = await this.getMatchPlayersInfo();
      const currentSummoner = await this.getCurrentSummoner();

      // 处理我方队伍信息
      const myTeamDetailed = [];
      for (const player of matchInfo.myTeam) {
        let rankedInfo = null;
        if (player.summonerId) {
          rankedInfo = await this.getRankedStats(player.summonerId);
        }

        myTeamDetailed.push({
          ...player,
          rankedInfo,
          isLocalPlayer: player.cellId === matchInfo.localPlayerCellId,
        });
      }

      // 处理敌方队伍信息
      const theirTeamDetailed = [];
      for (const player of matchInfo.theirTeam) {
        let rankedInfo = null;
        if (player.summonerId) {
          rankedInfo = await this.getRankedStats(player.summonerId);
        }

        theirTeamDetailed.push({
          ...player,
          rankedInfo,
          isLocalPlayer: false,
        });
      }

      return {
        currentSummoner,
        myTeam: myTeamDetailed,
        theirTeam: theirTeamDetailed,
        localPlayerCellId: matchInfo.localPlayerCellId,
        chatDetails: matchInfo.chatDetails,
      };
    } catch (error) {
      throw new Error(`获取详细玩家信息失败: ${error}`);
    }
  }

  // 获取游戏流程状态（更详细的游戏阶段信息）
  async getGameflowSession(): Promise<any> {
    try {
      const data = await this.makeRequest('GET', '/lol-gameflow/v1/session');
      return data;
    } catch (error) {
      throw new Error(`获取游戏流程会话失败: ${error}`);
    }
  }
}
