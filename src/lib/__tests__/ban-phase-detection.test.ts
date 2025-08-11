import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { BanPickService } from '../service/ban-pick-service';
import { LCUClientInterface } from '../client/interface';
import { AllAction, BanAction } from '@/types/ban-phase-detail';

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
      const session = await banPickService.getChampSelectSession();
      const type = session.actions[session.actions.length - 1][0].type;
      console.log(`   - 当前阶段: ${session.timer.phase}`);
      console.log(`   - 是否为Ban阶段: ${type === 'ban' ? '是' : '否'}`);
      console.log(`   - 是否为Pick阶段: ${type === 'pick' ? '是' : '否'}`);
      console.log(`   - 本地玩家Cell ID: ${session.localPlayerCellId}`);

      // 显示当前阶段的相关Actions
      if (session.actions && session.actions.length > 0) {
        console.log('\n🎯 当前阶段的Actions:');
        session.actions.forEach((actionGroup, groupIndex) => {
          console.log(`   阶段组 ${groupIndex + 1}:`);
          actionGroup.forEach((action: AllAction, actionIndex: number) => {
            const status = action.completed
              ? '✅已完成'
              : action.isInProgress
                ? '🔄进行中'
                : '⏳等待中';
            const isPlayer =
              action.actorCellId === session.localPlayerCellId ? '(我)' : '';
            const actionType = action.type === 'ban' ? '🚫Ban' : '✨Pick';
            console.log(
              `     ${actionIndex + 1}. Cell ${action.actorCellId}${isPlayer}: ${actionType} ${status} - 英雄ID: ${action.championId || '未选择'}`
            );
          });
        });
      }
      console.log('✅ Ban/Pick阶段检测测试完成');
    });

    it('应该能够获取当前阶段的时间信息', async () => {
      const session = await banPickService.getChampSelectSession();
      console.log('\n📋 当前阶段信息:');
      console.log(`   - 阶段: ${session.timer.phase || '未知'}`);
      console.log(
        `   - 是否进行中: ${session.timer?.isInfinite === false ? '是' : '否'}`
      );
      console.log(
        `   - 本地玩家Cell ID: ${session.localPlayerCellId || '未知'}`
      );

      if (session.timer) {
        console.log('\n⏰ 时间信息:');
        console.log(`   - 阶段: ${session.timer.phase || '未知'}`);

        // 获取剩余时间（实际上是阶段总时间）
        if (session.timer.adjustedTimeLeftInPhase !== undefined) {
          const timeMs = session.timer.adjustedTimeLeftInPhase;
          const timeSeconds = Math.ceil(timeMs / 1000);

          console.log(`   - 阶段时间: ${timeSeconds} 秒 (${timeMs}ms)`);
          console.log(
            `   - 是否无限时间: ${session.timer.isInfinite ? '是' : '否'}`
          );

          // 验证时间数据的有效性
          expect(typeof timeMs).toBe('number');
          expect(timeMs).toBeGreaterThanOrEqual(0);
          console.log('✅ 时间数据获取成功');
        } else {
          console.log('   - 时间信息: 无时间数据');
        }
      }

      if (session.actions) {
        console.log('\n🎯 所有Actions:');
        session.actions.forEach((actionGroup, groupIndex) => {
          console.log(`   阶段组 ${groupIndex + 1}:`);
          actionGroup.forEach((action: AllAction, actionIndex: number) => {
            const status = action.completed
              ? '✅已完成'
              : action.isInProgress
                ? '🔄进行中'
                : '⏳等待中';
            const isPlayer =
              action.actorCellId === session.localPlayerCellId ? '(我)' : '';
            const actionType = action.type === 'ban' ? '🚫Ban' : '✨Pick';
            console.log(
              `     ${actionIndex + 1}. Cell ${action.actorCellId}${isPlayer}: ${actionType} ${status}`
            );
          });
        });
      }

      expect(session).toBeTruthy();
      console.log('✅ 当前阶段时间信息获取测试完成');
    });
  });
});
