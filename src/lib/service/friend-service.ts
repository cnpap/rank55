import { BaseService } from './base-service';
import { LCUClientInterface } from '../client/interface';

// 好友在线状态类型
export type AvailabilityType =
  | 'chat'
  | 'mobile'
  | 'dnd'
  | 'away'
  | 'offline'
  | 'online'
  | 'spectating';

// 好友信息接口
export interface Friend {
  availability: string;
  displayGroupId: number;
  displayGroupName: string;
  gameName: string;
  gameTag: string;
  groupId: number;
  groupName: string;
  icon: number;
  id: string;
  isP2PConversationMuted: boolean;
  lastSeenOnlineTimestamp?: any;
  lol: FriendLol;
  name: string;
  note: string;
  patchline: string;
  pid: string;
  platformId: string;
  product: string;
  productName: string;
  puuid: string;
  statusMessage: string;
  summary: string;
  summonerId: number;
  time: number;
}

// 好友LOL信息接口
interface FriendLol {
  bannerIdSelected: string;
  challengeCrystalLevel: string;
  challengePoints: string;
  challengeTokensSelected: string;
  championId: string;
  companionId: string;
  damageSkinId: string;
  gameId: string;
  gameMode: string;
  gameQueueType: string;
  gameStatus: string;
  iconOverride: string;
  initSummoner: string;
  isObservable: string;
  mapId: string;
  mapSkinId: string;
  profileIcon: string;
  queueId: string;
  regalia: string;
  skinVariant: string;
  skinname: string;
  timeStamp: string;
}

// 好友分组接口
export interface FriendGroup {
  collapsed: boolean;
  id: number;
  isLocalized: boolean;
  isMetaGroup: boolean;
  name: string;
  priority: number;
}

// 聊天人员信息接口
export interface ChatPerson {
  availability: string;
  gameName: string;
  gameTag: string;
  icon: number;
  id: string;
  lastSeenOnlineTimestamp?: any;
  lol: ChatLol;
  name: string;
  obfuscatedSummonerId: number;
  patchline: string;
  pid: string;
  platformId: string;
  product: string;
  productName: string;
  puuid: string;
  statusMessage: string;
  summary: string;
  summonerId: number;
  time: number;
}

// 聊天LOL信息接口
interface ChatLol {
  bannerIdSelected: string;
  challengeCrystalLevel: string;
  challengeTitleSelected: string;
  challengeTokensSelected: string;
  championId: string;
  companionId: string;
  damageSkinId: string;
  gameId: string;
  gameMode: string;
  gameQueueType: string;
  gameStatus: string;
  iconOverride: string;
  initRankStat: string;
  initSummoner: string;
  isObservable: string;
  mapId: string;
  mapSkinId: string;
  pty: string;
  queueId: string;
  regalia: string;
  skinVariant: string;
  skinname: string;
  timeStamp: string;
}

export class FriendService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取好友列表
  async getFriends(): Promise<Friend[]> {
    const data = await this.makeRequest<Friend[]>(
      'GET',
      '/lol-chat/v1/friends'
    );
    return data;
  }

  // 删除好友
  async deleteFriend(id: string): Promise<void> {
    await this.makeRequest<void>('DELETE', `/lol-chat/v1/friends/${id}`);
  }

  // 获取好友分组
  async getFriendGroups(): Promise<FriendGroup[]> {
    const data = await this.makeRequest<FriendGroup[]>(
      'GET',
      '/lol-chat/v1/friend-groups'
    );
    return data;
  }

  // 获取当前用户信息
  async getMe(): Promise<ChatPerson> {
    const data = await this.makeRequest<ChatPerson>('GET', '/lol-chat/v1/me');
    return data;
  }

  // 更改在线状态
  async changeAvailability(availability: AvailabilityType): Promise<void> {
    await this.makeRequest<void>('PUT', '/lol-chat/v1/me', {
      body: { availability },
    });
  }

  // 发送好友请求
  async sendFriendRequest(gameName: string, tagLine: string): Promise<void> {
    await this.makeRequest<void>('POST', '/lol-chat/v2/friend-requests', {
      body: {
        gameName,
        tagLine,
        gameTag: tagLine,
      },
    });
  }

  // 设置状态消息
  async setChatStatusMessage(message: string): Promise<void> {
    await this.makeRequest<void>('PUT', '/lol-chat/v1/me', {
      body: { statusMessage: message },
    });
  }

  // 获取在线好友列表
  async getOnlineFriends(): Promise<Friend[]> {
    const friends = await this.getFriends();
    return friends.filter(friend => this.isFriendOnline(friend));
  }

  // 获取离线好友列表
  async getOfflineFriends(): Promise<Friend[]> {
    const friends = await this.getFriends();
    return friends.filter(friend => !this.isFriendOnline(friend));
  }

  // 根据分组获取好友
  async getFriendsByGroup(groupId: number): Promise<Friend[]> {
    const friends = await this.getFriends();
    return friends.filter(friend => friend.groupId === groupId);
  }

  // 获取好友详细信息（包含在线状态分析）
  async getFriendWithStatus(friendId: string): Promise<{
    friend: Friend;
    isOnline: boolean;
    statusText: string;
    gameStatus?: string;
  } | null> {
    try {
      const friends = await this.getFriends();
      const friend = friends.find(f => f.id === friendId);

      if (!friend) {
        return null;
      }

      const isOnline = this.isFriendOnline(friend);
      const statusText = this.getFriendStatusText(friend);
      const gameStatus = this.getFriendGameStatus(friend);

      return {
        friend,
        isOnline,
        statusText,
        gameStatus,
      };
    } catch (error) {
      throw new Error(`获取好友状态失败: ${error}`);
    }
  }

  // 辅助方法：判断好友是否在线
  private isFriendOnline(friend: Friend): boolean {
    const onlineStatuses: AvailabilityType[] = [
      'online',
      'chat',
      'mobile',
      'spectating',
      'dnd',
    ];
    return onlineStatuses.includes(friend.availability as AvailabilityType);
  }

  // 辅助方法：获取好友状态文本
  private getFriendStatusText(friend: Friend): string {
    switch (friend.availability) {
      case 'online':
        return '在线';
      case 'chat':
        return '聊天中';
      case 'mobile':
        return '手机在线';
      case 'dnd':
        return '请勿打扰';
      case 'away':
        return '离开';
      case 'offline':
        return '离线';
      case 'spectating':
        return '观战中';
      default:
        return '未知状态';
    }
  }

  // 辅助方法：获取好友游戏状态
  private getFriendGameStatus(friend: Friend): string | undefined {
    if (friend.lol?.gameStatus && friend.lol.gameStatus !== '') {
      switch (friend.lol.gameStatus) {
        case 'inGame':
          return '游戏中';
        case 'championSelect':
          return '英雄选择';
        case 'inQueue':
          return '排队中';
        case 'lobby':
          return '房间中';
        default:
          return friend.lol.gameStatus;
      }
    }
    return undefined;
  }

  // 辅助方法：获取好友游戏模式
  private getFriendGameMode(friend: Friend): string | undefined {
    if (friend.lol?.gameMode && friend.lol.gameMode !== '') {
      return friend.lol.gameMode;
    }
    return undefined;
  }

  // 获取好友统计信息
  async getFriendsStatistics(): Promise<{
    total: number;
    online: number;
    offline: number;
    inGame: number;
    byGroup: { [groupName: string]: number };
  }> {
    const friends = await this.getFriends();
    const groups = await this.getFriendGroups();

    const stats = {
      total: friends.length,
      online: 0,
      offline: 0,
      inGame: 0,
      byGroup: {} as { [groupName: string]: number },
    };

    // 初始化分组统计
    groups.forEach(group => {
      stats.byGroup[group.name] = 0;
    });

    // 统计好友状态
    friends.forEach(friend => {
      if (this.isFriendOnline(friend)) {
        stats.online++;
      } else {
        stats.offline++;
      }

      if (friend.lol?.gameStatus === 'inGame') {
        stats.inGame++;
      }

      // 按分组统计
      if (friend.displayGroupName) {
        if (stats.byGroup[friend.displayGroupName] !== undefined) {
          stats.byGroup[friend.displayGroupName]++;
        } else {
          stats.byGroup[friend.displayGroupName] = 1;
        }
      }
    });

    return stats;
  }
}
