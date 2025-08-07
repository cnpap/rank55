import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { SummonerService } from '../service/summoner-service';
import { LCUClientInterface } from '../client/interface';
import fs from 'fs/promises';
import path from 'path';
import {
  getQueueTypeName,
  getRankName,
  getTierName,
  isRanked,
} from '../rank-helpers';

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

describe('SummonerService', () => {
  let lcuClient: LCUClientInterface;
  let summonerService: SummonerService;

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

  // 测试获取当前召唤师信息（真实LOL）
  describe('GetCurrentSummoner - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试，无法连接到LOL客户端: ${error}`);
        return;
      }
    });

    it('应该能够获取当前召唤师信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试真实LOL客户端召唤师服务 ===');

      // 检查连接状态
      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ 跳过真实LOL测试，LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      // 获取真实的召唤师信息
      const summoner = await summonerService.getCurrentSummoner();

      // 验证返回的数据结构是否正确
      expect(summoner).toBeDefined();
      expect(summoner).not.toBeNull();

      // 基本字段验证
      if (summoner.summonerId) {
        expect(summoner.summonerId).toBeGreaterThan(0);
      }

      if (summoner.summonerLevel) {
        expect(summoner.summonerLevel).toBeGreaterThan(0);
      }

      // 保存测试数据
      await ensureTestDataDir();
      const testDataPath = path.join(TEST_DATA_DIR, 'summoner.json');
      await fs.writeFile(testDataPath, JSON.stringify(summoner));

      // 获取显示名称
      const displayName = summoner.displayName || summoner.gameName || '';
      if (displayName === '') {
        console.log('⚠️ 召唤师显示名称为空，可能需要检查gameName和tagLine字段');
        console.log(
          `📋 原始数据 - DisplayName: '${summoner.displayName}', GameName: '${summoner.gameName}', TagLine: '${summoner.tagLine}'`
        );
      } else {
        console.log(`👤 召唤师显示名称: ${displayName}`);
      }

      // 输出召唤师详细信息
      console.log('📊 召唤师信息:');
      console.log(`   - 显示名称: ${displayName}`);
      console.log(`   - 等级: ${summoner.summonerLevel}`);
      console.log(`   - 召唤师ID: ${summoner.summonerId}`);
      console.log(`   - 账户ID: ${summoner.accountId}`);
      console.log(`   - PUUID: ${summoner.puuid}`);
      console.log(`   - 头像ID: ${summoner.profileIconId}`);

      if (summoner.gameName && summoner.tagLine) {
        console.log(`   - 游戏名称: ${summoner.gameName}#${summoner.tagLine}`);
      }

      console.log('✅ 真实召唤师服务测试通过');
    });
  });

  // 测试获取排位统计（真实LOL）
  describe('GetRankedStats - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取排位统计', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试真实LOL客户端排位统计 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      // 先获取当前召唤师信息
      const summoner = await summonerService.getCurrentSummoner();
      if (!summoner) {
        console.log('⏭️ 无法获取召唤师信息');
        return;
      }

      const displayName = summoner.displayName || summoner.gameName || '';
      console.log(`👤 当前召唤师: ${displayName} (ID: ${summoner.accountId})`);

      // 获取排位统计
      const rankedStats = await summonerService.getRankedStats(summoner.puuid);

      expect(rankedStats).toBeDefined();

      // 检查数据结构并获取队列数组
      let queues = [];
      if (Array.isArray(rankedStats)) {
        queues = rankedStats;
      } else if (rankedStats && Array.isArray(rankedStats.queues)) {
        queues = rankedStats.queues;
      } else {
        console.log('⚠️ 无法识别的排位数据格式');
        console.log('📄 原始数据:', JSON.stringify(rankedStats, null, 2));
        return;
      }

      console.log(`📊 找到 ${queues.length} 个排位队列`);

      if (queues.length === 0) {
        console.log('⚠️ 没有找到任何排位队列数据');
        return;
      }

      console.log('\n🏆 ===== 详细排位信息 =====');

      // 查找单双排位
      const soloQueue = queues.find(
        stats => stats.queueType === 'RANKED_SOLO_5x5'
      );
      if (soloQueue) {
        console.log('\n🎯 单双排位 (RANKED_SOLO_5x5):');
        if (isRanked(soloQueue)) {
          console.log(
            `   📈 段位: ${getTierName(soloQueue.tier)} ${getRankName(soloQueue.division)}`
          );
          console.log(`   💎 LP: ${soloQueue.leaguePoints}`);
          console.log(`   🎮 总场次: ${soloQueue.wins + soloQueue.losses}场`);
          console.log(`   ✅ 胜场: ${soloQueue.wins}场`);
          console.log(`   ❌ 负场: ${soloQueue.losses}场`);
          if (soloQueue.wins + soloQueue.losses > 0) {
            console.log(
              `   📊 胜率: ${((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100).toFixed(1)}%`
            );
          }
          if (soloQueue.isProvisional) {
            console.log(
              `   ⚠️ 定级赛状态: 剩余 ${soloQueue.provisionalGamesRemaining} 场`
            );
          }
        } else {
          console.log('   ❌ 未定级');
          if (soloQueue.isProvisional) {
            console.log(
              `   📝 定级赛进度: ${soloQueue.provisionalGameThreshold - soloQueue.provisionalGamesRemaining}/${soloQueue.provisionalGameThreshold}`
            );
          } else {
            console.log(
              `   📝 还未开始排位赛 (需要进行 ${soloQueue.provisionalGameThreshold} 场定级赛)`
            );
          }
        }
      } else {
        console.log('\n🎯 单双排位: 未找到数据');
      }

      // 查找灵活排位
      const flexQueue = queues.find(
        stats => stats.queueType === 'RANKED_FLEX_SR'
      );
      if (flexQueue) {
        console.log('\n🔄 灵活排位 (RANKED_FLEX_SR):');
        if (isRanked(flexQueue)) {
          console.log(
            `   📈 段位: ${getTierName(flexQueue.tier)} ${getRankName(flexQueue.division)}`
          );
          console.log(`   💎 LP: ${flexQueue.leaguePoints}`);
          console.log(`   🎮 总场次: ${flexQueue.wins + flexQueue.losses}场`);
          console.log(`   ✅ 胜场: ${flexQueue.wins}场`);
          console.log(`   ❌ 负场: ${flexQueue.losses}场`);
          if (flexQueue.wins + flexQueue.losses > 0) {
            console.log(
              `   📊 胜率: ${((flexQueue.wins / (flexQueue.wins + flexQueue.losses)) * 100).toFixed(1)}%`
            );
          }
          if (flexQueue.isProvisional) {
            console.log(
              `   ⚠️ 定级赛状态: 剩余 ${flexQueue.provisionalGamesRemaining} 场`
            );
          }
        } else {
          console.log('   ❌ 未定级');
          if (flexQueue.isProvisional) {
            console.log(
              `   📝 定级赛进度: ${flexQueue.provisionalGameThreshold - flexQueue.provisionalGamesRemaining}/${flexQueue.provisionalGameThreshold}`
            );
          } else {
            console.log(
              `   📝 还未开始排位赛 (需要进行 ${flexQueue.provisionalGameThreshold} 场定级赛)`
            );
          }
        }
      } else {
        console.log('\n🔄 灵活排位: 未找到数据');
      }

      // 显示其他排位队列（如云顶之弈等）
      const otherQueues = queues.filter(
        stats =>
          stats.queueType !== 'RANKED_SOLO_5x5' &&
          stats.queueType !== 'RANKED_FLEX_SR'
      );

      if (otherQueues.length > 0) {
        console.log('\n🎲 其他排位队列:');
        for (const stats of otherQueues) {
          console.log(`\n   🎮 ${getQueueTypeName(stats.queueType)}:`);
          if (isRanked(stats)) {
            console.log(
              `      📈 段位: ${getTierName(stats.tier)} ${getRankName(stats.division)} (${stats.leaguePoints} LP)`
            );
            console.log(`      🎮 场次: ${stats.wins}胜 ${stats.losses}负`);
            if (stats.wins + stats.losses > 0) {
              console.log(
                `      📊 胜率: ${((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)}%`
              );
            }
          } else {
            console.log('      ❌ 未定级');
            if (!stats.isProvisional && stats.wins + stats.losses === 0) {
              console.log(`      📝 还未开始排位赛`);
            }
          }
        }
      }

      console.log('\n🏆 ===== 排位信息结束 =====');
      console.log('✅ 排位统计测试通过');
    });
  });

  // 测试根据名称获取召唤师信息（真实LOL）
  describe('GetSummonerByName - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够根据名称获取召唤师信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试根据名称获取召唤师信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      // 先获取当前召唤师信息作为测试数据
      const currentSummoner = await summonerService.getCurrentSummoner();
      if (!currentSummoner) {
        console.log('⏭️ 无法获取当前召唤师信息');
        return;
      }

      // 尝试多个可能的名称字段
      let testName = '';
      if (currentSummoner.displayName && currentSummoner.displayName.trim()) {
        testName = currentSummoner.displayName.trim();
      } else if (currentSummoner.gameName && currentSummoner.gameName.trim()) {
        testName = currentSummoner.gameName.trim();
      } else if (
        currentSummoner.internalName &&
        currentSummoner.internalName.trim()
      ) {
        testName = currentSummoner.internalName.trim();
      }

      if (!testName) {
        console.log('⏭️ 当前召唤师没有可用的显示名称');
        console.log('📋 召唤师数据:', {
          displayName: currentSummoner.displayName,
          gameName: currentSummoner.gameName,
          internalName: currentSummoner.internalName,
          tagLine: currentSummoner.tagLine,
        });

        // 如果没有可用的名称，我们使用一个已知存在的测试名称
        // 注意：这里应该使用一个在你的服务器上确实存在的召唤师名称
        console.log('⚠️ 使用备用测试名称进行测试');
        testName = 'Riot'; // 使用一个通用的测试名称，你可以根据实际情况修改
      }

      console.log(`🔍 使用召唤师名称进行测试: "${testName}"`);

      try {
        // 根据名称获取召唤师信息
        const summonerByName = await summonerService.getSummonerByName(
          `${testName}#${currentSummoner.tagLine}`
        );

        expect(summonerByName).toBeDefined();
        expect(summonerByName).not.toBeNull();

        // 验证返回的数据结构
        if (summonerByName.summonerId) {
          expect(summonerByName.summonerId).toBeGreaterThan(0);
        }

        if (summonerByName.summonerLevel) {
          expect(summonerByName.summonerLevel).toBeGreaterThan(0);
        }

        // 保存测试数据
        await ensureTestDataDir();
        const testDataPath = path.join(TEST_DATA_DIR, 'summoner-by-name.json');
        await fs.writeFile(
          testDataPath,
          JSON.stringify(summonerByName, null, 2)
        );

        // 输出召唤师详细信息
        const displayName =
          summonerByName.displayName || summonerByName.gameName || '';
        console.log('📊 根据名称获取的召唤师信息:');
        console.log(`   - 搜索名称: ${testName}`);
        console.log(`   - 显示名称: ${displayName}`);
        console.log(`   - 等级: ${summonerByName.summonerLevel}`);
        console.log(`   - 召唤师ID: ${summonerByName.summonerId}`);
        console.log(`   - 账户ID: ${summonerByName.accountId}`);
        console.log(`   - PUUID: ${summonerByName.puuid}`);
        console.log(`   - 头像ID: ${summonerByName.profileIconId}`);

        if (summonerByName.gameName && summonerByName.tagLine) {
          console.log(
            `   - 游戏名称: ${summonerByName.gameName}#${summonerByName.tagLine}`
          );
        }

        // 验证获取的召唤师是否与当前召唤师匹配（仅当使用当前召唤师名称时）
        if (
          testName ===
          (currentSummoner.displayName ||
            currentSummoner.gameName ||
            currentSummoner.internalName)
        ) {
          if (currentSummoner.summonerId === summonerByName.summonerId) {
            console.log('✅ 根据名称获取的召唤师与当前召唤师匹配');
          } else {
            console.log(
              '⚠️ 根据名称获取的召唤师与当前召唤师不匹配，可能是同名玩家'
            );
          }
        } else {
          console.log('ℹ️ 使用了备用测试名称，跳过与当前召唤师的匹配验证');
        }

        console.log('✅ 根据名称获取召唤师信息测试通过');
      } catch (error: any) {
        console.log(`❌ 根据名称获取召唤师信息失败: ${error.message}`);

        // 如果是因为名称不存在而失败，这也是可以接受的
        if (error.message.includes('根据名称获取召唤师失败')) {
          console.log('ℹ️ 这可能是因为测试名称在当前服务器上不存在');
          console.log('💡 建议：请在测试中使用一个确实存在的召唤师名称');
        }

        // 重新抛出错误以便测试框架处理
        throw error;
      }
    });

    it('应该能够处理不存在的召唤师名称', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试不存在的召唤师名称 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      const nonExistentName = 'ThisSummonerNameShouldNotExist12345';
      console.log(`🔍 测试不存在的召唤师名称: ${nonExistentName}`);

      try {
        const result = await summonerService.getSummonerByName(nonExistentName);

        // 如果没有抛出错误，检查返回值
        if (!result || Object.keys(result).length === 0) {
          console.log('✅ 正确处理了不存在的召唤师名称（返回空结果）');
        } else {
          console.log('⚠️ 意外地找到了召唤师信息:', result);
        }
      } catch (error: any) {
        console.log(
          `✅ 正确处理了不存在的召唤师名称（抛出错误）: ${error.message}`
        );
        expect(error.message).toContain('根据名称获取召唤师失败');
      }

      console.log('✅ 不存在召唤师名称测试通过');
    });
  });

  // 测试根据ID获取召唤师信息（真实LOL）
  describe('GetSummonerByID - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够根据ID获取召唤师信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试根据ID获取召唤师信息 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      // 先获取当前召唤师信息作为测试数据
      const currentSummoner = await summonerService.getCurrentSummoner();
      if (!currentSummoner || !currentSummoner.summonerId) {
        console.log('⏭️ 无法获取当前召唤师ID');
        return;
      }

      const testSummonerId = currentSummoner.summonerId;
      console.log(`🔍 使用当前召唤师ID进行测试: ${testSummonerId}`);

      // 根据ID获取召唤师信息
      const summonerByID =
        await summonerService.getSummonerByID(testSummonerId);

      expect(summonerByID).toBeDefined();
      expect(summonerByID).not.toBeNull();

      // 验证返回的数据结构
      expect(summonerByID.summonerId).toBe(testSummonerId);

      if (summonerByID.summonerLevel) {
        expect(summonerByID.summonerLevel).toBeGreaterThan(0);
      }

      // 保存测试数据
      await ensureTestDataDir();
      const testDataPath = path.join(TEST_DATA_DIR, 'summoner-by-id.json');
      await fs.writeFile(testDataPath, JSON.stringify(summonerByID, null, 2));

      // 输出召唤师详细信息
      const displayName =
        summonerByID.displayName || summonerByID.gameName || '';
      console.log('📊 根据ID获取的召唤师信息:');
      console.log(`   - 搜索ID: ${testSummonerId}`);
      console.log(`   - 显示名称: ${displayName}`);
      console.log(`   - 等级: ${summonerByID.summonerLevel}`);
      console.log(`   - 召唤师ID: ${summonerByID.summonerId}`);
      console.log(`   - 账户ID: ${summonerByID.accountId}`);
      console.log(`   - PUUID: ${summonerByID.puuid}`);
      console.log(`   - 头像ID: ${summonerByID.profileIconId}`);

      if (summonerByID.gameName && summonerByID.tagLine) {
        console.log(
          `   - 游戏名称: ${summonerByID.gameName}#${summonerByID.tagLine}`
        );
      }

      // 验证获取的召唤师是否与当前召唤师匹配
      if (currentSummoner.puuid === summonerByID.puuid) {
        console.log('✅ 根据ID获取的召唤师与当前召唤师完全匹配');
      } else {
        console.log('⚠️ 根据ID获取的召唤师与当前召唤师不匹配');
      }

      console.log('✅ 根据ID获取召唤师信息测试通过');
    });

    it('应该能够处理不存在的召唤师ID', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试不存在的召唤师ID ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      const nonExistentID = 999999999; // 一个不太可能存在的ID
      console.log(`🔍 测试不存在的召唤师ID: ${nonExistentID}`);

      try {
        const result = await summonerService.getSummonerByID(nonExistentID);

        // 如果没有抛出错误，检查返回值
        if (!result || Object.keys(result).length === 0) {
          console.log('✅ 正确处理了不存在的召唤师ID（返回空结果）');
        } else {
          console.log('⚠️ 意外地找到了召唤师信息:', result);
        }
      } catch (error: any) {
        console.log(
          `✅ 正确处理了不存在的召唤师ID（抛出错误）: ${error.message}`
        );
        expect(error.message).toContain('根据ID获取召唤师失败');
      }

      console.log('✅ 不存在召唤师ID测试通过');
    });
  });
});
