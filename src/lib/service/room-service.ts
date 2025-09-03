import { GameConfig, Member, Room } from '@/types/room';
import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';
import { summonerService } from './service-manager';

export class RoomService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取当前房间信息
  async getCurrentLobby(): Promise<Room> {
    return this.makeRequest<Room>('GET', '/lol-lobby/v2/lobby');
  }

  // 获取房间成员列表
  async getLobbyMembers(): Promise<Member[]> {
    const lobby = await this.getCurrentLobby();
    return lobby.members;
  }

  // 获取详细的房间成员信息（包含召唤师详情）
  async getDetailedLobbyMembers(): Promise<Member[]> {
    const members = await this.getLobbyMembers();
    const detailedMembers = [];

    for (const member of members) {
      try {
        // 获取召唤师详细信息
        let summonerInfo = null;
        if (member.summonerId) {
          try {
            summonerInfo = await summonerService.getSummonerByID(
              member.summonerId
            );
          } catch (error) {
            console.warn(
              `无法获取召唤师 ${member.summonerId} 的详细信息:`,
              error
            );
          }
        }

        detailedMembers.push({
          ...member,
          summonerInfo,
        });
      } catch (error) {
        console.warn('处理成员信息时出错:', error);
        detailedMembers.push(member);
      }
    }

    return detailedMembers;
  }

  // 获取房间邀请列表
  async getLobbyInvitations(): Promise<any[]> {
    try {
      const data = await this.makeRequest<any[]>(
        'GET',
        '/lol-lobby/v2/lobby/invitations'
      );
      return data || [];
    } catch (error) {
      throw new Error(`获取房间邀请列表失败: ${error}`);
    }
  }

  // 检查是否在房间中
  async isInLobby(): Promise<boolean> {
    const lobby = await this.getCurrentLobby();
    return lobby && lobby.gameConfig && Boolean(lobby.gameConfig.gameMode);
  }

  // 获取房间游戏配置
  async getLobbyGameConfig(): Promise<GameConfig> {
    try {
      const lobby = await this.getCurrentLobby();
      return lobby.gameConfig || null;
    } catch (error) {
      throw new Error(`获取房间游戏配置失败: ${error}`);
    }
  }

  // 踢出房间成员
  async kickMember(summonerId: number): Promise<void> {
    try {
      const endpoint = `/lol-lobby/v2/lobby/members/${summonerId}/kick`;
      await this.makeRequest('POST', endpoint);
      console.log(`成功踢出召唤师 ${summonerId}`);
    } catch (error) {
      throw new Error(`踢出房间成员失败: ${error}`);
    }
  }

  // 检查当前用户是否为房主
  async isCurrentUserLeader(): Promise<boolean> {
    try {
      const members = await this.getLobbyMembers();

      // 获取当前召唤师信息
      const currentSummoner = await summonerService.getCurrentSummoner();

      // 查找当前用户在房间成员中的信息
      const currentMember = members.find(
        member => member.summonerId === currentSummoner.summonerId
      );

      return currentMember?.isLeader || false;
    } catch (error) {
      throw new Error(`检查房主权限失败: ${error}`);
    }
  }

  // 获取可踢出的成员列表（排除房主）
  async getKickableMembers(): Promise<Member[]> {
    try {
      const members = await this.getLobbyMembers();

      // 过滤掉房主
      const kickableMembers = members.filter(member => !member.isLeader);

      return kickableMembers;
    } catch (error) {
      throw new Error(`获取可踢出成员列表失败: ${error}`);
    }
  }
}
