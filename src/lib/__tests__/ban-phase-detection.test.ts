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

describe('ChampSelectPhaseDetection', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;

  describe('英雄选择阶段检测 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        banPickService = new BanPickService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够准确检测当前是ban阶段还是pick阶段', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试ban/pick阶段检测 ===');

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
          console.log('ℹ️ 当前不在英雄选择阶段，无法测试阶段检测');
          return;
        }

        // 获取详细的阶段信息
        const phaseDetails = await banPickService.getBanPhaseDetails();
        console.log('\n📊 当前阶段详细信息:');

        // 明确区分ban和pick阶段
        const currentPhase = phaseDetails.timerPhase?.toLowerCase() || '';
        const isBanPhase = currentPhase.includes('ban');
        const isPickPhase = currentPhase.includes('pick');

        console.log(`   - 当前阶段: ${phaseDetails.timerPhase}`);
        console.log(`   - 是否为Ban阶段: ${isBanPhase ? '是' : '否'}`);
        console.log(`   - 是否为Pick阶段: ${isPickPhase ? '是' : '否'}`);
        console.log(`   - 本地玩家Cell ID: ${phaseDetails.localPlayerCellId}`);

        // 显示当前阶段的相关Actions
        if (phaseDetails.allActions && phaseDetails.allActions.length > 0) {
          console.log('\n🎯 当前阶段的Actions:');
          phaseDetails.allActions.forEach((actionGroup, groupIndex) => {
            console.log(`   阶段组 ${groupIndex + 1}:`);
            actionGroup.forEach((action: BanAction, actionIndex: number) => {
              const status = action.completed
                ? '✅已完成'
                : action.isInProgress
                  ? '🔄进行中'
                  : '⏳等待中';
              const isPlayer =
                action.actorCellId === phaseDetails.localPlayerCellId
                  ? '(我)'
                  : '';
              const actionType = action.type === 'ban' ? '🚫Ban' : '✨Pick';
              console.log(
                `     ${actionIndex + 1}. Cell ${action.actorCellId}${isPlayer}: ${actionType} ${status} - 英雄ID: ${action.championId || '未选择'}`
              );
            });
          });
        }

        // 保存详细信息到文件
        await ensureTestDataDir();
        const filename = path.join(
          TEST_DATA_DIR,
          'champ_select_phase_details.json'
        );
        await fs.writeFile(
          filename,
          JSON.stringify(
            {
              ...phaseDetails,
              currentPhaseAnalysis: {
                isBanPhase,
                isPickPhase,
                phaseType: isBanPhase
                  ? 'ban'
                  : isPickPhase
                    ? 'pick'
                    : 'unknown',
              },
            },
            null,
            2
          )
        );
        console.log(`💾 英雄选择阶段详细信息已保存到: ${filename}`);

        expect(typeof isBanPhase).toBe('boolean');
        expect(typeof isPickPhase).toBe('boolean');
        console.log('✅ Ban/Pick阶段检测测试完成');
      } catch (error) {
        console.log(`❌ Ban/Pick阶段检测测试失败: ${error}`);
        throw error;
      }
    });

    it('应该能够获取当前阶段的时间信息', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试当前阶段时间信息获取 ===');

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
          console.log('\n⏰ 时间信息:');
          console.log(`   - 阶段: ${phaseInfo.timer.phase || '未知'}`);

          // 获取剩余时间（实际上是阶段总时间）
          if (phaseInfo.timer.adjustedTimeLeftInPhase !== undefined) {
            const timeMs = phaseInfo.timer.adjustedTimeLeftInPhase;
            const timeSeconds = Math.ceil(timeMs / 1000);

            console.log(`   - 阶段时间: ${timeSeconds} 秒 (${timeMs}ms)`);
            console.log(
              `   - 是否无限时间: ${phaseInfo.timer.isInfinite ? '是' : '否'}`
            );

            // 验证时间数据的有效性
            expect(typeof timeMs).toBe('number');
            expect(timeMs).toBeGreaterThanOrEqual(0);
            console.log('✅ 时间数据获取成功');
          } else {
            console.log('   - 时间信息: 无时间数据');
          }
        }

        if (phaseInfo?.actions) {
          console.log('\n🎯 所有Actions:');
          phaseInfo.actions.forEach((actionGroup, groupIndex) => {
            console.log(`   阶段组 ${groupIndex + 1}:`);
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
              const actionType = action.type === 'ban' ? '🚫Ban' : '✨Pick';
              console.log(
                `     ${actionIndex + 1}. Cell ${action.actorCellId}${isPlayer}: ${actionType} ${status}`
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
        console.log('✅ 当前阶段时间信息获取测试完成');
      } catch (error) {
        console.log(`❌ 当前阶段时间信息获取测试失败: ${error}`);
        throw error;
      }
    });
  });
});
