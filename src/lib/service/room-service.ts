import { GameConfig, Member, Room } from '@/types/room';
import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';
import { SummonerService } from './summoner-service';

export class RoomService extends BaseService {
  private summonerService: SummonerService;

  constructor(client?: LCUClientInterface) {
    super(client);
    this.summonerService = new SummonerService(client);
  }

  // 获取当前房间信息
  async getCurrentLobby(): Promise<Room> {
    try {
      const data = await this.makeRequest('GET', '/lol-lobby/v2/lobby');
      return data;
    } catch (error) {
      throw new Error(`获取当前房间信息失败: ${error}`);
    }
  }

  // 获取房间成员列表
  async getLobbyMembers(): Promise<Member[]> {
    try {
      const lobby = await this.getCurrentLobby();

      if (!lobby || !lobby.members) {
        return [];
      }

      console.log('getLobbyMembers', lobby.members);
      return lobby.members;
    } catch (error) {
      throw new Error(`获取房间成员失败: ${error}`);
    }
  }

  // 获取详细的房间成员信息（包含召唤师详情）
  async getDetailedLobbyMembers(): Promise<Member[]> {
    try {
      const members = await this.getLobbyMembers();
      const detailedMembers = [];

      for (const member of members) {
        try {
          // 获取召唤师详细信息
          let summonerInfo = null;
          if (member.summonerId) {
            try {
              summonerInfo = await this.summonerService.getSummonerByID(
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
    } catch (error) {
      throw new Error(`获取详细房间成员信息失败: ${error}`);
    }
  }

  // 获取房间邀请列表
  async getLobbyInvitations(): Promise<any[]> {
    try {
      const data = await this.makeRequest(
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
    try {
      const lobby = await this.getCurrentLobby();
      return lobby && lobby.gameConfig && Boolean(lobby.gameConfig.gameMode);
    } catch (error) {
      // 如果获取房间信息失败，通常意味着不在房间中
      return false;
    }
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
      const currentSummoner = await this.summonerService.getCurrentSummoner();

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
