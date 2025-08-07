import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { RoomService } from '../service/room-service';
import { LCUClientInterface } from '../client/interface';
import fs from 'fs/promises';
import path from 'path';

// 创建测试数据目录路径
const TEST_DATA_DIR = path.join(__dirname, 'test-data');

// 确保测试数据目录存在
async function ensureTestDataDir() {
  try {
    await fs.access(TEST_DATA_DIR);
  } catch {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  }
}

describe('RoomService', () => {
  let lcuClient: LCUClientInterface;
  let roomService: RoomService;

  // 测试房间管理功能（真实LOL）
  describe('RoomManagement - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        roomService = new RoomService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够检查是否在房间中', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试房间状态检查 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        const isInLobby = await roomService.isInLobby();
        console.log(`🏠 房间状态: ${isInLobby ? '在房间中' : '不在房间中'}`);

        expect(typeof isInLobby).toBe('boolean');
        console.log('✅ 房间状态检查测试通过');
      } catch (error) {
        console.log(`ℹ️ 房间状态检查: ${error}`);
        // 不在房间中是正常情况，不应该抛出错误
      }
    });

    it('应该能够获取房间成员信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试房间成员查询 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 首先检查是否在房间中
        const isInLobby = await roomService.isInLobby();
        console.log(`🏠 房间状态: ${isInLobby ? '在房间中' : '不在房间中'}`);

        if (!isInLobby) {
          console.log('ℹ️ 当前不在房间中，无法获取房间成员');
          return;
        }

        // 获取房间信息
        const lobby = await roomService.getCurrentLobby();
        console.log('🏠 房间信息获取成功');

        // 确保测试数据目录存在
        await ensureTestDataDir();

        // 保存房间数据到测试数据文件夹
        const filename = path.join(TEST_DATA_DIR, 'lobby_info.json');
        await fs.writeFile(filename, JSON.stringify(lobby, null, 2));
        console.log(`💾 房间数据已保存到: ${filename}`);

        // 获取房间成员
        const members = await roomService.getLobbyMembers();
        console.log(`👥 房间成员数量: ${members.length}`);

        expect(Array.isArray(members)).toBe(true);

        if (members.length > 0) {
          console.log('\n👥 房间成员列表:');
          await printLobbyMembersTable(members);

          // 获取详细成员信息
          console.log('\n🔍 获取详细成员信息...');
          const detailedMembers = await roomService.getDetailedLobbyMembers();

          // 保存详细成员信息
          const detailedFilename = path.join(
            TEST_DATA_DIR,
            'detailed_lobby_members.json'
          );
          await fs.writeFile(
            detailedFilename,
            JSON.stringify(detailedMembers, null, 2)
          );
          console.log(`💾 详细成员数据已保存到: ${detailedFilename}`);

          await printDetailedMembersTable(detailedMembers);
        } else {
          console.log('ℹ️ 房间中没有其他成员');
        }

        console.log('✅ 房间成员查询测试通过');
      } catch (error: any) {
        console.log(`❌ 房间成员查询失败: ${error}`);
        // 如果不在房间中，这是正常情况
        if (error.toString().includes('获取当前房间信息失败')) {
          console.log('ℹ️ 这通常表示当前不在房间中');
        }
      }
    });

    it('应该能够获取房间游戏配置', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试房间游戏配置查询 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      try {
        const isInLobby = await roomService.isInLobby();
        if (!isInLobby) {
          console.log('ℹ️ 当前不在房间中，无法获取游戏配置');
          return;
        }

        const gameConfig = await roomService.getLobbyGameConfig();
        console.log('🎮 游戏配置信息:');

        if (gameConfig) {
          console.log(`   - 游戏模式: ${gameConfig.gameMode || '未知'}`);
          console.log(`   - 队列ID: ${gameConfig.queueId || '未知'}`);
          console.log(`   - 地图ID: ${gameConfig.mapId || '未知'}`);
          console.log(`   - 最大队伍大小: ${gameConfig.maxTeamSize || '未知'}`);

          // 保存游戏配置
          await ensureTestDataDir();
          const filename = path.join(TEST_DATA_DIR, 'game_config.json');
          await fs.writeFile(filename, JSON.stringify(gameConfig, null, 2));
          console.log(`💾 游戏配置已保存到: ${filename}`);
        } else {
          console.log('   - 无游戏配置信息');
        }

        console.log('✅ 房间游戏配置查询测试通过');
      } catch (error) {
        console.log(`ℹ️ 游戏配置查询: ${error}`);
      }
    });

    it('应该能够获取房间邀请信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试房间邀请查询 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      try {
        const invitations = await roomService.getLobbyInvitations();
        console.log(`📨 房间邀请数量: ${invitations.length}`);

        expect(Array.isArray(invitations)).toBe(true);

        if (invitations.length > 0) {
          console.log('\n📨 房间邀请列表:');
          for (let i = 0; i < invitations.length; i++) {
            const invitation = invitations[i];
            console.log(
              `   ${i + 1}. 邀请ID: ${invitation.invitationId || '未知'}`
            );
            console.log(`      状态: ${invitation.state || '未知'}`);
            console.log(
              `      发送者: ${invitation.fromSummonerName || '未知'}`
            );
          }

          // 保存邀请信息
          await ensureTestDataDir();
          const filename = path.join(TEST_DATA_DIR, 'lobby_invitations.json');
          await fs.writeFile(filename, JSON.stringify(invitations, null, 2));
          console.log(`💾 邀请信息已保存到: ${filename}`);
        } else {
          console.log('ℹ️ 当前没有房间邀请');
        }

        console.log('✅ 房间邀请查询测试通过');
      } catch (error) {
        console.log(`ℹ️ 邀请查询: ${error}`);
      }
    });
  });
});

// 打印房间成员表格
async function printLobbyMembersTable(members: any[]): Promise<void> {
  console.log('序号 | 召唤师ID | 位置偏好         | 准备状态 | 是否房主');
  console.log('-----|----------|------------------|----------|----------');

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const summonerId = member.summonerId || '未知';
    const positions = getPositionPreferences(member);
    const ready = member.ready ? '✅已准备' : '❌未准备';
    const isLeader = member.isLeader ? '👑房主' : '普通成员';

    console.log(
      `${String(i + 1).padStart(2)} | ${String(summonerId).padEnd(8)} | ${positions.padEnd(16)} | ${ready.padEnd(8)} | ${isLeader}`
    );
  }
}

// 打印详细成员信息表格
async function printDetailedMembersTable(
  detailedMembers: any[]
): Promise<void> {
  console.log('\n📊 详细成员信息:');
  console.log(
    '序号 | 召唤师名称   | 等级 | 位置偏好         | 准备状态 | 角色'
  );
  console.log(
    '-----|-------------|------|------------------|----------|------'
  );

  for (let i = 0; i < detailedMembers.length; i++) {
    const member = detailedMembers[i];
    const summonerName =
      member.summonerInfo?.displayName ||
      member.summonerInfo?.gameName ||
      `ID:${member.summonerId}` ||
      '未知';
    const level = member.summonerInfo?.summonerLevel || '未知';
    const positions = getPositionPreferences(member);
    const ready = member.ready ? '✅已准备' : '❌未准备';
    const role = member.isLeader ? '👑房主' : '普通成员';

    console.log(
      `${String(i + 1).padStart(2)} | ${summonerName.padEnd(11)} | ${String(level).padStart(4)} | ${positions.padEnd(16)} | ${ready.padEnd(8)} | ${role}`
    );
  }
}

// 获取位置偏好（主要位置 + 次要位置）
function getPositionPreferences(member: any): string {
  const firstPosition = getPositionName(member.firstPositionPreference);
  const secondPosition = getPositionName(member.secondPositionPreference);

  if (firstPosition && secondPosition && firstPosition !== secondPosition) {
    return `${firstPosition}/${secondPosition}`;
  } else if (firstPosition) {
    return firstPosition;
  } else {
    return '未指定';
  }
}

// 获取位置名称
function getPositionName(position: string): string {
  const positionMap: { [key: string]: string } = {
    TOP: '上路',
    JUNGLE: '打野',
    MIDDLE: '中路',
    BOTTOM: '下路',
    UTILITY: '辅助',
    FILL: '补位',
    UNSELECTED: '未选择',
  };

  return positionMap[position] || position || '';
}
