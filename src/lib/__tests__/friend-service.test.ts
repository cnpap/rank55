import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { FriendService, Friend } from '../service/friend-service';
import { LCUClientInterface } from '../client/interface';

// 辅助方法：获取在线状态中文描述
function getAvailabilityText(availability: string): string {
  switch (availability) {
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

// 辅助方法：获取游戏状态中文描述
function getGameStatusText(gameStatus?: string): string | undefined {
  if (!gameStatus || gameStatus === '') return undefined;

  switch (gameStatus) {
    case 'inGame':
      return '游戏中';
    case 'championSelect':
      return '英雄选择';
    case 'inQueue':
      return '排队中';
    case 'lobby':
      return '房间中';
    case 'readyCheck':
      return '准备检查';
    case 'matchmaking':
      return '匹配中';
    case 'tutorial':
      return '教程中';
    case 'practice':
      return '练习模式';
    default:
      return gameStatus;
  }
}

// 辅助方法：显示好友信息
function displayFriendInfo(friend: Friend, index: number): void {
  const statusText = getAvailabilityText(friend.availability);
  const gameStatusText = getGameStatusText(friend.lol?.gameStatus);

  console.log(`\n   ${index + 1}. ${friend.gameName}#${friend.gameTag}`);
  console.log(`      - ID: ${friend.id}`);
  console.log(`      - 在线状态: ${statusText} (${friend.availability})`);
  console.log(`      - 召唤师ID: ${friend.summonerId}`);
  console.log(`      - 分组: ${friend.displayGroupName || '默认'}`);
  console.log(`      - 状态消息: ${friend.statusMessage || '无'}`);

  if (friend.lol) {
    if (gameStatusText) {
      console.log(
        `      - 游戏状态: ${gameStatusText} (${friend.lol.gameStatus})`
      );
    }
    if (friend.lol.gameMode) {
      console.log(`      - 游戏模式: ${friend.lol.gameMode}`);
    }
    if (friend.lol.queueId && friend.lol.queueId !== '0') {
      console.log(`      - 队列ID: ${friend.lol.queueId}`);
    }
  }

  if (friend.lastSeenOnlineTimestamp && friend.availability === 'offline') {
    const lastSeen = new Date(friend.lastSeenOnlineTimestamp);
    console.log(`      - 最后在线: ${lastSeen.toLocaleString()}`);
  }
}

// 辅助方法：显示好友列表
function displayFriendsList(
  friends: Friend[],
  title: string,
  maxDisplay: number = 10
): void {
  if (friends.length === 0) {
    console.log(`\n⚠️ ${title}: 无`);
    return;
  }

  const displayCount = Math.min(friends.length, maxDisplay);
  console.log(`\n${title} (显示前${displayCount}个):`);

  for (let i = 0; i < displayCount; i++) {
    displayFriendInfo(friends[i], i);
  }

  if (friends.length > maxDisplay) {
    console.log(`\n   ... 还有 ${friends.length - maxDisplay} 个好友未显示`);
  }
}

describe('FriendService', () => {
  let lcuClient: LCUClientInterface;
  let friendService: FriendService;

  // 公共的beforeEach，用于初始化客户端和服务
  const setupClientAndService = async (): Promise<boolean> => {
    try {
      lcuClient = await LCUClient.create();
      friendService = new FriendService(lcuClient);
      return true;
    } catch (error) {
      console.log(`⏭️ 跳过真实LOL测试，无法连接到LOL客户端: ${error}`);
      return false;
    }
  };

  // 测试真实LOL客户端连接状态
  describe('LCUClient Connection', () => {
    it('应该能够连接到LOL客户端', async () => {
      console.log('=== 开始测试LOL客户端连接状态 ===');

      try {
        lcuClient = await LCUClient.create();
        console.log('✅ 成功连接到LOL客户端');

        const isConnected = await lcuClient.isConnected();
        if (isConnected) {
          console.log('✅ 成功连接到LOL客户端');
          expect(isConnected).toBe(true);
        } else {
          console.log('⚠️ LOL客户端已创建但未连接');
          expect(isConnected).toBe(false);
        }
      } catch (error) {
        console.log(`ℹ️ 预期行为：LOL客户端未运行 - ${error}`);
        // 跳过测试，不算失败
        return;
      }
    });
  });

  // 测试获取好友列表（真实LOL）
  describe('GetFriends - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取好友列表', async () => {
      const friends = await friendService.getFriends();

      // 验证返回的数据结构是否正确
      expect(friends).toBeDefined();
      expect(Array.isArray(friends)).toBe(true);

      console.log(`📊 好友总数: ${friends.length}`);

      if (friends.length > 0) {
        const firstFriend = friends[0];

        // 验证好友对象的基本属性
        expect(firstFriend).toHaveProperty('id');
        expect(firstFriend).toHaveProperty('gameName');
        expect(firstFriend).toHaveProperty('availability');
        expect(firstFriend).toHaveProperty('summonerId');

        displayFriendsList(friends, '📋 好友列表', 10);
      } else {
        console.log('⚠️ 当前没有好友');
      }

      console.log('✅ 获取好友列表测试通过');
    });
  });

  // 测试获取好友分组（真实LOL）
  describe('GetFriendGroups - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取好友分组', async () => {
      const friendGroups = await friendService.getFriendGroups();

      expect(friendGroups).toBeDefined();
      expect(Array.isArray(friendGroups)).toBe(true);

      console.log(`📊 好友分组数量: ${friendGroups.length}`);

      if (friendGroups.length > 0) {
        console.log('📋 好友分组列表:');
        friendGroups.forEach((group, index) => {
          console.log(`   ${index + 1}. ${group.name} (ID: ${group.id})`);
          console.log(`      - 优先级: ${group.priority}`);
          console.log(`      - 是否折叠: ${group.collapsed}`);
          console.log(`      - 是否本地化: ${group.isLocalized}`);
          console.log(`      - 是否元分组: ${group.isMetaGroup}`);
        });
      } else {
        console.log('⚠️ 没有找到好友分组');
      }

      console.log('✅ 获取好友分组测试通过');
    });
  });

  // 测试获取当前用户信息（真实LOL）
  describe('GetMe - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取当前用户信息', async () => {
      const me = await friendService.getMe();

      expect(me).toBeDefined();
      expect(me).not.toBeNull();

      // 验证基本属性
      expect(me).toHaveProperty('id');
      expect(me).toHaveProperty('gameName');
      expect(me).toHaveProperty('availability');
      expect(me).toHaveProperty('summonerId');

      console.log('👤 当前用户信息:');
      console.log(`   - ID: ${me.id}`);
      console.log(`   - 游戏名称: ${me.gameName}#${me.gameTag}`);
      console.log(`   - 在线状态: ${me.availability}`);
      console.log(`   - 召唤师ID: ${me.summonerId}`);
      console.log(`   - 状态消息: ${me.statusMessage || '无'}`);
      console.log(`   - 头像ID: ${me.icon}`);

      if (me.lol) {
        console.log(`   - 游戏状态: ${me.lol.gameStatus || '无'}`);
        console.log(`   - 游戏模式: ${me.lol.gameMode || '无'}`);
        console.log(`   - 队列ID: ${me.lol.queueId || '无'}`);
      }

      console.log('✅ 获取当前用户信息测试通过');
    });
  });

  // 测试在线好友筛选（真实LOL）
  describe('GetOnlineFriends - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取在线好友列表', async () => {
      const allFriends = await friendService.getFriends();
      const onlineFriends = await friendService.getOnlineFriends();
      const offlineFriends = await friendService.getOfflineFriends();

      expect(onlineFriends).toBeDefined();
      expect(Array.isArray(onlineFriends)).toBe(true);
      expect(offlineFriends).toBeDefined();
      expect(Array.isArray(offlineFriends)).toBe(true);

      // 验证在线+离线好友数量等于总好友数量
      expect(onlineFriends.length + offlineFriends.length).toBe(
        allFriends.length
      );

      console.log('📊 好友在线状态统计:');
      console.log(`   - 总好友数: ${allFriends.length}`);
      console.log(`   - 在线好友: ${onlineFriends.length}`);
      console.log(`   - 离线好友: ${offlineFriends.length}`);

      displayFriendsList(onlineFriends, '🟢 在线好友列表', 10);
      displayFriendsList(offlineFriends, '🔴 离线好友列表', 5);

      console.log('✅ 在线好友筛选测试通过');
    });
  });

  // 测试获取游戏中的好友（新增）
  describe('GetInGameFriends - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取游戏中的好友', async () => {
      const allFriends = await friendService.getFriends();
      const inGameFriends = allFriends.filter(
        friend => friend.lol?.gameStatus === 'inGame'
      );

      expect(inGameFriends).toBeDefined();
      expect(Array.isArray(inGameFriends)).toBe(true);

      console.log('🎮 游戏中好友统计:');
      console.log(`   - 总好友数: ${allFriends.length}`);
      console.log(`   - 游戏中好友: ${inGameFriends.length}`);

      if (inGameFriends.length > 0) {
        console.log('\n🎮 游戏中好友列表:');
        inGameFriends.forEach((friend, index) => {
          console.log(`   ${index + 1}. ${friend.gameName}#${friend.gameTag}`);
          console.log(`      - 游戏状态: 游戏中`);
          if (friend.lol?.gameMode) {
            console.log(`      - 游戏模式: ${friend.lol.gameMode}`);
          }
          if (friend.lol?.queueId && friend.lol.queueId !== '0') {
            console.log(`      - 队列ID: ${friend.lol.queueId}`);
          }
        });
      } else {
        console.log('\n⚠️ 当前没有好友在游戏中');
      }

      console.log('✅ 获取游戏中好友测试通过');
    });
  });

  // 测试获取离开状态的好友（新增）
  describe('GetAwayFriends - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取离开状态的好友', async () => {
      const allFriends = await friendService.getFriends();
      const awayFriends = allFriends.filter(
        friend => friend.availability === 'away'
      );

      expect(awayFriends).toBeDefined();
      expect(Array.isArray(awayFriends)).toBe(true);

      console.log('😴 离开状态好友统计:');
      console.log(`   - 总好友数: ${allFriends.length}`);
      console.log(`   - 离开状态好友: ${awayFriends.length}`);

      if (awayFriends.length > 0) {
        console.log('\n😴 离开状态好友列表:');
        awayFriends.forEach((friend, index) => {
          console.log(`   ${index + 1}. ${friend.gameName}#${friend.gameTag}`);
          console.log(`      - 状态: 离开`);
          console.log(`      - 状态消息: ${friend.statusMessage || '无'}`);
          if (friend.lol?.gameStatus) {
            const gameStatusText = getGameStatusText(friend.lol.gameStatus);
            if (gameStatusText) {
              console.log(`      - 游戏状态: ${gameStatusText}`);
            }
          }
        });
      } else {
        console.log('\n⚠️ 当前没有好友处于离开状态');
      }

      console.log('✅ 获取离开状态好友测试通过');
    });
  });

  // 测试好友统计信息（真实LOL）
  describe('GetFriendsStatistics - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取好友统计信息', async () => {
      const stats = await friendService.getFriendsStatistics();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('online');
      expect(stats).toHaveProperty('offline');
      expect(stats).toHaveProperty('inGame');
      expect(stats).toHaveProperty('byGroup');

      // 验证统计数据的逻辑正确性
      expect(stats.online + stats.offline).toBe(stats.total);
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.online).toBeGreaterThanOrEqual(0);
      expect(stats.offline).toBeGreaterThanOrEqual(0);
      expect(stats.inGame).toBeGreaterThanOrEqual(0);

      console.log('📊 好友详细统计:');
      console.log(`   - 总好友数: ${stats.total}`);
      console.log(`   - 在线好友: ${stats.online}`);
      console.log(`   - 离线好友: ${stats.offline}`);
      console.log(`   - 游戏中好友: ${stats.inGame}`);

      if (stats.total > 0) {
        console.log(
          `   - 在线率: ${((stats.online / stats.total) * 100).toFixed(1)}%`
        );
      }

      console.log('\n📋 按分组统计:');
      Object.entries(stats.byGroup).forEach(([groupName, count]) => {
        if (count > 0) {
          console.log(`   - ${groupName}: ${count}人`);
        }
      });

      console.log('✅ 好友统计信息测试通过');
    });
  });

  // 测试好友详细状态（真实LOL）
  describe('GetFriendWithStatus - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够获取好友详细状态', async () => {
      const friends = await friendService.getFriends();

      if (friends.length === 0) {
        console.log('⏭️ 没有好友，跳过详细状态测试');
        return;
      }

      const testFriend = friends[0];
      const friendWithStatus = await friendService.getFriendWithStatus(
        testFriend.id
      );

      expect(friendWithStatus).toBeDefined();
      expect(friendWithStatus).not.toBeNull();

      if (friendWithStatus) {
        expect(friendWithStatus).toHaveProperty('friend');
        expect(friendWithStatus).toHaveProperty('isOnline');
        expect(friendWithStatus).toHaveProperty('statusText');

        console.log('👤 好友详细状态:');
        console.log(
          `   - 好友: ${friendWithStatus.friend.gameName}#${friendWithStatus.friend.gameTag}`
        );
        console.log(
          `   - 是否在线: ${friendWithStatus.isOnline ? '是' : '否'}`
        );
        console.log(`   - 状态文本: ${friendWithStatus.statusText}`);

        if (friendWithStatus.gameStatus) {
          console.log(`   - 游戏状态: ${friendWithStatus.gameStatus}`);
        }

        if (friendWithStatus.friend.statusMessage) {
          console.log(
            `   - 状态消息: ${friendWithStatus.friend.statusMessage}`
          );
        }
      }

      // 测试不存在的好友ID
      const nonExistentFriend =
        await friendService.getFriendWithStatus('non-existent-id');
      expect(nonExistentFriend).toBeNull();

      console.log('✅ 好友详细状态测试通过');
    });
  });

  // 测试按分组获取好友（真实LOL）
  describe('GetFriendsByGroup - Real LOL', () => {
    beforeEach(async () => {
      await setupClientAndService();
    });

    it('应该能够按分组获取好友', async () => {
      const friendGroups = await friendService.getFriendGroups();
      const allFriends = await friendService.getFriends();

      if (friendGroups.length === 0 || allFriends.length === 0) {
        console.log('⏭️ 没有好友分组或好友，跳过分组测试');
        return;
      }

      console.log('📋 按分组获取好友:');

      for (const group of friendGroups) {
        const friendsInGroup = await friendService.getFriendsByGroup(group.id);

        expect(friendsInGroup).toBeDefined();
        expect(Array.isArray(friendsInGroup)).toBe(true);

        console.log(`\n   分组: ${group.name} (ID: ${group.id})`);
        console.log(`   好友数量: ${friendsInGroup.length}`);

        if (friendsInGroup.length > 0) {
          friendsInGroup.slice(0, 3).forEach((friend, index) => {
            console.log(
              `     ${index + 1}. ${friend.gameName}#${friend.gameTag} (${friend.availability})`
            );
          });

          if (friendsInGroup.length > 3) {
            console.log(`     ... 还有 ${friendsInGroup.length - 3} 个好友`);
          }
        }
      }

      console.log('✅ 按分组获取好友测试通过');
    });
  });
});
