import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { BanPickService } from '../service/ban-pick-service';
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

describe('GamePhaseAndPlayers', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;

  describe('游戏阶段和玩家信息测试 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        banPickService = new BanPickService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取游戏阶段信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试获取游戏阶段信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取基本游戏阶段
        const gamePhase = await banPickService.getGamePhase();
        console.log(`🎮 当前游戏阶段: ${gamePhase}`);

        // 获取详细的游戏流程信息
        const gameflowSession = await banPickService.getGameflowSession();
        console.log('🔄 游戏流程会话信息:', gameflowSession);

        // 检查是否在英雄选择阶段
        const isInChampSelect = await banPickService.isInChampSelect();
        console.log(`🎯 是否在英雄选择阶段: ${isInChampSelect ? '是' : '否'}`);

        // 如果在英雄选择阶段，获取更多信息
        let champSelectInfo = null;
        if (isInChampSelect) {
          champSelectInfo = await banPickService.getCurrentPhaseInfo();
          console.log('📋 英雄选择阶段详细信息:', champSelectInfo);
        }

        // 保存游戏阶段信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'game_phase_info.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              gamePhase,
              gameflowSession,
              isInChampSelect,
              champSelectInfo,
            },
            null,
            2
          )
        );
        console.log(`💾 游戏阶段信息已保存到: ${filename}`);

        // 验证结果
        expect(typeof gamePhase).toBe('string');
        expect(typeof isInChampSelect).toBe('boolean');

        if (gameflowSession) {
          expect(typeof gameflowSession).toBe('object');
        }

        console.log('✅ 获取游戏阶段信息测试完成');
      } catch (error) {
        console.log(`❌ 获取游戏阶段信息测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取对局玩家信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试获取对局玩家信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 检查是否在英雄选择阶段
        const isInChampSelect = await banPickService.isInChampSelect();
        console.log(`🎯 是否在英雄选择阶段: ${isInChampSelect ? '是' : '否'}`);

        if (!isInChampSelect) {
          console.log('ℹ️ 当前不在英雄选择阶段，跳过玩家信息测试');
          return;
        }

        // 获取基本玩家信息
        const playersInfo = await banPickService.getMatchPlayersInfo();
        console.log('👥 基本玩家信息:', playersInfo);
        console.log(`👥 我方队伍人数: ${playersInfo.myTeam?.length || 0}`);
        console.log(`👥 敌方队伍人数: ${playersInfo.theirTeam?.length || 0}`);

        // 获取当前召唤师信息
        const currentSummoner = await banPickService.getCurrentSummoner();
        console.log('🧙‍♂️ 当前召唤师信息:', currentSummoner);

        // 获取详细玩家信息（包括段位）
        console.log('🔍 正在获取详细玩家信息（包括段位）...');
        const detailedPlayersInfo =
          await banPickService.getDetailedPlayersInfo();
        console.log('👑 详细玩家信息:', detailedPlayersInfo);

        // 分析我方队伍
        console.log('\n=== 我方队伍分析 ===');
        detailedPlayersInfo.myTeam?.forEach((player: any, index: number) => {
          console.log(`玩家 ${index + 1}:`);
          console.log(`  - 召唤师名称: ${player.displayName || '未知'}`);
          console.log(`  - 召唤师ID: ${player.summonerId || '未知'}`);
          console.log(`  - Cell ID: ${player.cellId}`);
          console.log(`  - 是否是本人: ${player.isLocalPlayer ? '是' : '否'}`);
          console.log(`  - 选择的英雄ID: ${player.championId || '未选择'}`);
          console.log(`  - 段位信息:`, player.rankedInfo ? '有' : '无');
          if (player.rankedInfo) {
            console.log(`    - 排位数据:`, player.rankedInfo);
          }
          console.log('');
        });

        // 分析敌方队伍
        console.log('\n=== 敌方队伍分析 ===');
        detailedPlayersInfo.theirTeam?.forEach((player: any, index: number) => {
          console.log(`玩家 ${index + 1}:`);
          console.log(`  - 召唤师名称: ${player.displayName || '未知'}`);
          console.log(`  - 召唤师ID: ${player.summonerId || '未知'}`);
          console.log(`  - Cell ID: ${player.cellId}`);
          console.log(`  - 选择的英雄ID: ${player.championId || '未选择'}`);
          console.log(`  - 段位信息:`, player.rankedInfo ? '有' : '无');
          if (player.rankedInfo) {
            console.log(`    - 排位数据:`, player.rankedInfo);
          }
          console.log('');
        });

        // 保存玩家信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'players_info.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              currentSummoner,
              basicPlayersInfo: playersInfo,
              detailedPlayersInfo,
            },
            null,
            2
          )
        );
        console.log(`💾 玩家信息已保存到: ${filename}`);

        // 验证结果
        expect(typeof playersInfo).toBe('object');
        expect(Array.isArray(playersInfo.myTeam)).toBe(true);
        expect(Array.isArray(playersInfo.theirTeam)).toBe(true);
        expect(typeof currentSummoner).toBe('object');
        expect(typeof detailedPlayersInfo).toBe('object');

        console.log('✅ 获取对局玩家信息测试完成');
      } catch (error) {
        console.log(`❌ 获取对局玩家信息测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取玩家段位信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试获取玩家段位信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取当前召唤师信息
        const currentSummoner = await banPickService.getCurrentSummoner();
        console.log('🧙‍♂️ 当前召唤师信息:', currentSummoner);

        if (!currentSummoner || !currentSummoner.summonerId) {
          console.log('⚠️ 无法获取当前召唤师ID，跳过段位测试');
          return;
        }

        // 获取当前召唤师的段位信息
        const rankedStats = await banPickService.getRankedStats(
          currentSummoner.summonerId
        );
        console.log('🏆 当前召唤师段位信息:', rankedStats);

        // 保存段位信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'ranked_stats.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              summonerId: currentSummoner.summonerId,
              summonerName: currentSummoner.displayName,
              rankedStats,
            },
            null,
            2
          )
        );
        console.log(`💾 段位信息已保存到: ${filename}`);

        // 验证结果
        expect(typeof currentSummoner).toBe('object');
        expect(currentSummoner.summonerId).toBeDefined();

        if (rankedStats) {
          expect(typeof rankedStats).toBe('object');
        }

        console.log('✅ 获取玩家段位信息测试完成');
      } catch (error) {
        console.log(`❌ 获取玩家段位信息测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取完整的游戏状态和玩家信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试获取完整的游戏状态和玩家信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取游戏阶段
        const gamePhase = await banPickService.getGamePhase();
        console.log(`🎮 当前游戏阶段: ${gamePhase}`);

        // 获取游戏流程会话
        const gameflowSession = await banPickService.getGameflowSession();
        console.log('🔄 游戏流程会话:', gameflowSession);

        // 获取当前召唤师信息
        const currentSummoner = await banPickService.getCurrentSummoner();
        console.log('🧙‍♂️ 当前召唤师:', currentSummoner);

        let champSelectData = null;
        let playersData = null;

        // 如果在英雄选择阶段，获取相关信息
        if (gamePhase === 'ChampSelect') {
          console.log('📋 正在获取英雄选择阶段的详细信息...');

          // 获取英雄选择会话信息
          const champSelectSession =
            await banPickService.getChampSelectSession();
          console.log('🎯 英雄选择会话:', champSelectSession);

          // 获取当前阶段信息
          const currentPhaseInfo = await banPickService.getCurrentPhaseInfo();
          console.log('⏰ 当前阶段信息:', currentPhaseInfo);

          // 获取玩家信息
          const playersInfo = await banPickService.getMatchPlayersInfo();
          console.log('👥 玩家信息:', playersInfo);

          // 获取详细玩家信息（包括段位）
          const detailedPlayersInfo =
            await banPickService.getDetailedPlayersInfo();
          console.log('👑 详细玩家信息:', detailedPlayersInfo);

          champSelectData = {
            champSelectSession,
            currentPhaseInfo,
            playersInfo,
            detailedPlayersInfo,
          };

          playersData = detailedPlayersInfo;
        }

        // 保存完整信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'complete_game_state.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              gamePhase,
              gameflowSession,
              currentSummoner,
              champSelectData,
              summary: {
                isInChampSelect: gamePhase === 'ChampSelect',
                myTeamCount: playersData?.myTeam?.length || 0,
                theirTeamCount: playersData?.theirTeam?.length || 0,
                hasRankedData: playersData
                  ? playersData.myTeam?.some((p: any) => p.rankedInfo) ||
                    playersData.theirTeam?.some((p: any) => p.rankedInfo)
                  : false,
              },
            },
            null,
            2
          )
        );
        console.log(`💾 完整游戏状态已保存到: ${filename}`);

        // 验证结果
        expect(typeof gamePhase).toBe('string');
        expect(typeof currentSummoner).toBe('object');

        if (gameflowSession) {
          expect(typeof gameflowSession).toBe('object');
        }

        if (champSelectData) {
          expect(typeof champSelectData).toBe('object');
          expect(Array.isArray(champSelectData.playersInfo.myTeam)).toBe(true);
          expect(Array.isArray(champSelectData.playersInfo.theirTeam)).toBe(
            true
          );
        }

        console.log('✅ 获取完整的游戏状态和玩家信息测试完成');
      } catch (error) {
        console.log(`❌ 获取完整的游戏状态和玩家信息测试失败: ${error}`);
        throw error;
      }
    });
  });
});
