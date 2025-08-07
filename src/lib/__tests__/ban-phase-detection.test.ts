import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { BanPickService } from '../service/ban-pick-service';
import { LCUClientInterface } from '../client/interface';
import fs from 'fs/promises';
import path from 'path';
import { BanAction } from '@/types/ban-phase-detail';

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

describe('BanPhaseDetection', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;

  describe('Ban阶段检测 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        banPickService = new BanPickService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够准确检测是否在ban阶段', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试ban阶段检测 ===');

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
          console.log('ℹ️ 当前不在英雄选择阶段，无法测试ban阶段检测');
          return;
        }

        // 获取详细的ban阶段信息
        const banPhaseDetails = await banPickService.getBanPhaseDetails();
        console.log('\n📊 Ban阶段详细信息:');
        console.log(
          `   - 是否在ban阶段: ${banPhaseDetails.isBanPhase ? '是' : '否'}`
        );
        console.log(`   - Timer阶段: ${banPhaseDetails.timerPhase}`);
        console.log(
          `   - 本地玩家Cell ID: ${banPhaseDetails.localPlayerCellId}`
        );

        if (
          banPhaseDetails.banActions &&
          banPhaseDetails.banActions.length > 0
        ) {
          console.log('\n🚫 Ban相关的Actions:');
          banPhaseDetails.banActions.forEach(
            (action: BanAction, index: number) => {
              const status = action.completed
                ? '✅已完成'
                : action.isInProgress
                  ? '🔄进行中'
                  : '⏳等待中';
              const isPlayer = action.isLocalPlayer ? '(我)' : '';
              console.log(
                `   ${index + 1}. Cell ${action.actorCellId}${isPlayer}: ${status} - 英雄ID: ${action.championId || '未选择'}`
              );
            }
          );
        }

        // 保存详细信息到文件
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'ban_phase_details.json');
        await fs.writeFile(filename, JSON.stringify(banPhaseDetails, null, 2));
        console.log(`💾 Ban阶段详细信息已保存到: ${filename}`);

        expect(typeof banPhaseDetails.isBanPhase).toBe('boolean');
        console.log('✅ Ban阶段检测测试完成');
      } catch (error) {
        console.log(`❌ Ban阶段检测测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取当前阶段的详细信息和倒计时', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试当前阶段详细信息和倒计时获取 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      try {
        const isInChampSelect = await banPickService.isInChampSelect();
        if (!isInChampSelect) {
          console.log('ℹ️ 当前不在英雄选择阶段');
          return;
        }

        // 获取当前阶段信息
        const phaseInfo = await banPickService.getCurrentPhaseInfo();
        console.log('\n📋 当前阶段信息:');
        console.log(`   - 阶段: ${phaseInfo?.phase || '未知'}`);
        console.log(
          `   - 是否进行中: ${phaseInfo?.isInProgress ? '是' : '否'}`
        );
        console.log(
          `   - 本地玩家Cell ID: ${phaseInfo?.localPlayerCellId || '未知'}`
        );

        if (phaseInfo?.timer) {
          console.log('\n⏰ 计时器信息:');
          console.log(`   - 阶段: ${phaseInfo.timer.phase || '未知'}`);

          // 验证倒计时数据的获取
          if (phaseInfo.timer.adjustedTimeLeftInPhase !== undefined) {
            const remainingTimeMs = phaseInfo.timer.adjustedTimeLeftInPhase;
            const remainingTimeSeconds = Math.ceil(remainingTimeMs / 1000);

            console.log(`   - 剩余时间: ${remainingTimeSeconds} 秒`);
            console.log(
              `   - 总时间: ${Math.ceil((phaseInfo.timer.totalTimeInPhase || 0) / 1000)} 秒`
            );

            // 验证倒计时数据的有效性
            expect(typeof remainingTimeMs).toBe('number');
            expect(remainingTimeMs).toBeGreaterThanOrEqual(0);
            console.log('✅ 倒计时数据获取成功');
          } else {
            console.log('   - 剩余时间: 无倒计时数据');
          }
        }

        if (phaseInfo?.actions) {
          console.log('\n🎯 所有Actions:');
          phaseInfo.actions.forEach((actionGroup, groupIndex) => {
            console.log(`   阶段 ${groupIndex + 1}:`);
            actionGroup.forEach((action: BanAction, actionIndex: number) => {
              const status = action.completed
                ? '✅已完成'
                : action.isInProgress
                  ? '🔄进行中'
                  : '⏳等待中';
              const isPlayer =
                action.actorCellId === phaseInfo.localPlayerCellId
                  ? '(我)'
                  : '';
              console.log(
                `     ${actionIndex + 1}. Cell ${action.actorCellId}${isPlayer}: ${action.type} ${status}`
              );
            });
          });
        }

        // 保存阶段信息
        await ensureTestDataDir();
        const filename = path.join(TEST_DATA_DIR, 'current_phase_info.json');
        await fs.writeFile(filename, JSON.stringify(phaseInfo, null, 2));
        console.log(`💾 当前阶段信息已保存到: ${filename}`);

        expect(phaseInfo).toBeTruthy();
        console.log('✅ 当前阶段详细信息获取测试完成');
      } catch (error) {
        console.log(`❌ 当前阶段详细信息获取测试失败: ${error}`);
        throw error;
      }
    });
  });
});
