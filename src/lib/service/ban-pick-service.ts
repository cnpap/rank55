import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';
import { GameflowService } from './gameflow-service';
import { GameflowPhaseEnum } from '@/types/gameflow-session';
import { ChampSelectSession } from '@/types/champ-select-session';
import { AssignedPosition } from '@/types/players-info';

export class BanPickService extends BaseService {
  private gameflowService: GameflowService;

  constructor(client?: LCUClientInterface) {
    super(client);
    this.gameflowService = new GameflowService(client);
  }

  // 检查是否在 ban/pick 阶段
  async isInChampSelect(): Promise<boolean> {
    const phase = await this.gameflowService.getGameflowPhase();
    return phase === GameflowPhaseEnum.ChampSelect;
  }

  // 获取英雄选择会话信息
  async getChampSelectSession(): Promise<ChampSelectSession> {
    const session = await this.makeRequest<ChampSelectSession>(
      'GET',
      '/lol-champ-select/v1/session'
    );
    const myTeam = session.myTeam;
    const positions: Array<AssignedPosition> = [];
    for (const { assignedPosition } of myTeam) {
      if (
        assignedPosition &&
        ['bottom', 'top', 'middle', 'jungle', 'support'].includes(
          assignedPosition
        )
      ) {
        positions.push(assignedPosition);
      }
    }
    if (positions.length < 5) {
      // 通过排除法计算，少了的位置是什么
      const missingPositions: AssignedPosition = (
        ['bottom', 'jungle', 'middle', 'top', 'support'] as AssignedPosition[]
      ).filter((pos: AssignedPosition) => !positions.includes(pos))[0];
      // 回写到对象中
      for (const item of myTeam) {
        if (
          !['bottom', 'jungle', 'middle', 'top', 'support'].includes(
            item.assignedPosition
          )
        ) {
          item.assignedPosition = missingPositions;
        }
      }
    }
    return session;
  }

  // 检查当前是否是禁用阶段（改进版本）
  async isBanPhase(): Promise<boolean> {
    const session = await this.getChampSelectSession();
    return session.actions.flat().some(a => a.isInProgress && a.type === 'ban');
  }

  // 检查当前是否是选择阶段（改进版本）
  async isPickPhase(): Promise<boolean> {
    const session = await this.getChampSelectSession();
    return session.actions
      .flat()
      .some(a => a.isInProgress && a.type === 'pick');
  }

  // 检查当前是否是预选阶段
  async isPrePickPhase(): Promise<boolean> {
    const session = await this.getChampSelectSession();
    return session.actions.flat().every(a => !a.isInProgress);
  }

  async pickAction(
    championId: number,
    completed: boolean,
    type: 'ban' | 'pick' = 'pick'
  ) {
    const session = await this.getChampSelectSession();
    const myself = session.myTeam.find(
      t => t.cellId === session.localPlayerCellId
    );
    const id = session.actions
      .flat()
      .find(a => a.actorCellId === myself?.cellId && a.type === type)?.id;
    const endpoint = `/lol-champ-select/v1/session/actions/${id}`;
    const body = { championId: championId, completed, type };
    await this.makeRequest('PATCH', endpoint, body);
  }

  // Ban 英雄
  async banChampion(championId: number): Promise<void> {
    await this.pickAction(championId, true, 'ban');
  }

  // Pick 英雄
  async pickChampion(championId: number): Promise<void> {
    await this.pickAction(championId, true);
  }

  // 预 pick 英雄
  async hoverChampion(championId: number): Promise<void> {
    await this.pickAction(championId, false);
  }

  // 预 ban 英雄
  async preBanChampion(championId: number): Promise<void> {
    await this.pickAction(championId, false, 'ban');
  }
}
