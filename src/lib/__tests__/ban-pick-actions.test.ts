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

describe('BanPickActions', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;

  describe('Ban/Pick 英雄操作 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        banPickService = new BanPickService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够 Ban 英雄 76', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试 Ban 英雄 76 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取当前玩家的 action 信息
        const currentAction = await banPickService.getCurrentPlayerAction();
        console.log('📋 当前玩家 Action 信息:', currentAction);

        if (!currentAction) {
          console.log('ℹ️ 当前没有可执行的 action，跳过测试');
          return;
        }

        if (currentAction.type !== 'ban') {
          console.log(
            `ℹ️ 当前 action 类型是 ${currentAction.type}，不是 ban，跳过测试`
          );
          return;
        }

        // 执行 ban 操作
        const banResult = await banPickService.banChampion(76);
        console.log('🚫 Ban 操作结果:', banResult);

        // 保存操作结果
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'ban_action_result.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              championId: 76,
              championName: '豹女',
              currentAction,
              banResult,
            },
            null,
            2
          )
        );
        console.log(`💾 Ban 操作结果已保存到: ${filename}`);

        // 验证结果
        expect(typeof banResult.success).toBe('boolean');
        expect(typeof banResult.message).toBe('string');

        if (banResult.success) {
          console.log('✅ Ban 英雄 76 (豹女) 成功');
          expect(banResult.actionId).toBeDefined();
        } else {
          console.log(`⚠️ Ban 英雄 76 (豹女) 失败: ${banResult.message}`);
        }

        console.log('✅ Ban 英雄测试完成');
      } catch (error) {
        console.log(`❌ Ban 英雄测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够 Pick 英雄 154', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试 Pick 英雄 154  ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取当前玩家的 action 信息
        const currentAction = await banPickService.getCurrentPlayerAction();
        console.log('📋 当前玩家 Action 信息:', currentAction);

        if (!currentAction) {
          console.log('ℹ️ 当前没有可执行的 action，跳过测试');
          return;
        }

        if (currentAction.type !== 'pick') {
          console.log(
            `ℹ️ 当前 action 类型是 ${currentAction.type}，不是 pick，跳过测试`
          );
          return;
        }

        // 执行 pick 操作
        const pickResult = await banPickService.pickChampion(154);
        console.log('⚔️ Pick 操作结果:', pickResult);

        // 保存操作结果
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'pick_action_result.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              championId: 154,
              championName: 'Yasuo',
              currentAction,
              pickResult,
            },
            null,
            2
          )
        );
        console.log(`💾 Pick 操作结果已保存到: ${filename}`);

        // 验证结果
        expect(typeof pickResult.success).toBe('boolean');
        expect(typeof pickResult.message).toBe('string');

        if (pickResult.success) {
          console.log('✅ Pick 英雄 154 成功');
          expect(pickResult.actionId).toBeDefined();
        } else {
          console.log(`⚠️ Pick 英雄 154 失败: ${pickResult.message}`);
        }

        console.log('✅ Pick 英雄测试完成');
      } catch (error) {
        console.log(`❌ Pick 英雄测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够预选英雄 154', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试预选英雄 154 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      try {
        // 获取当前玩家的 action 信息
        const currentAction = await banPickService.getCurrentPlayerAction();
        console.log('📋 当前玩家 Action 信息:', currentAction);

        if (!currentAction) {
          console.log('ℹ️ 当前没有可执行的 action，跳过测试');
          return;
        }

        if (currentAction.type !== 'pick') {
          console.log(
            `ℹ️ 当前 action 类型是 ${currentAction.type}，不是 pick，跳过测试`
          );
          return;
        }

        // 执行预选操作
        const hoverResult = await banPickService.hoverChampion(154);
        console.log('👁️ 预选操作结果:', hoverResult);

        // 保存操作结果
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'hover_action_result.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              championId: 154,
              championName: 'Yasuo',
              currentAction,
              hoverResult,
            },
            null,
            2
          )
        );
        console.log(`💾 预选操作结果已保存到: ${filename}`);

        // 验证结果
        expect(typeof hoverResult.success).toBe('boolean');
        expect(typeof hoverResult.message).toBe('string');

        if (hoverResult.success) {
          console.log('✅ 预选英雄 154 成功');
          expect(hoverResult.actionId).toBeDefined();
        } else {
          console.log(`⚠️ 预选英雄 154 失败: ${hoverResult.message}`);
        }

        console.log('✅ 预选英雄测试完成');
      } catch (error) {
        console.log(`❌ 预选英雄测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取当前玩家的 Action 信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试获取当前玩家 Action 信息 ===');

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
          console.log('ℹ️ 当前不在英雄选择阶段，跳过测试');
          return;
        }

        // 获取当前玩家的 action
        const currentAction = await banPickService.getCurrentPlayerAction();
        console.log('📋 当前玩家 Action 信息:', currentAction);

        // 获取可用英雄列表
        const availableChampions = await banPickService.getAvailableChampions();
        console.log(`🎭 可用英雄数量: ${availableChampions.length}`);
        console.log(
          `🎭 前10个可用英雄 ID: ${availableChampions.slice(0, 10).join(', ')}`
        );

        // 保存信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'current_action_info.json');
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              isInChampSelect,
              currentAction,
              availableChampionsCount: availableChampions.length,
              availableChampions: availableChampions.slice(0, 20), // 只保存前20个
            },
            null,
            2
          )
        );
        console.log(`💾 当前 Action 信息已保存到: ${filename}`);

        // 验证结果
        if (currentAction) {
          expect(typeof currentAction.actionId).toBe('number');
          expect(['ban', 'pick']).toContain(currentAction.type);
          expect(typeof currentAction.isInProgress).toBe('boolean');
          expect(typeof currentAction.completed).toBe('boolean');
          console.log('✅ 当前玩家有可执行的 Action');
        } else {
          console.log('ℹ️ 当前玩家没有可执行的 Action');
        }

        expect(Array.isArray(availableChampions)).toBe(true);
        console.log('✅ 获取当前玩家 Action 信息测试完成');
      } catch (error) {
        console.log(`❌ 获取当前玩家 Action 信息测试失败: ${error}`);
        throw error;
      }
    });
  });
});
