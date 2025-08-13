import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { BanPickService } from '../service/ban-pick-service';
import { LCUClientInterface } from '../client/interface';
import { AllAction } from '@/types/ban-phase-detail';
import { GameflowService } from '../service/gameflow-service';

describe('ChampSelectPhaseDetection', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;
  let gameflowService: GameflowService;

  describe('英雄选择阶段检测 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        banPickService = new BanPickService(lcuClient);
        gameflowService = new GameflowService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够接受对局', async () => {
      await gameflowService.acceptReadyCheck();
      console.log('✅ 接受对局成功');
    });

    it('应该能够准确检测当前是ban阶段还是pick阶段', async () => {
      const session = await banPickService.getChampSelectSession();
      const type = session.actions.flat().find(a => a.isInProgress)?.type;
      console.log(`   - 当前阶段: ${session.timer.phase}`);
      console.log(`   - 是否为Ban阶段: ${type === 'ban' ? '是' : '否'}`);
      console.log(`   - 是否为Pick阶段: ${type === 'pick' ? '是' : '否'}`);
      console.log(
        `   - 是否为 ban pick 转换公示阶段: ${type === 'ten_bans_reveal' ? '是' : '否'}`
      );
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

    it('应该能够获取游戏流程会话信息', async () => {
      const gameflowSession = await gameflowService.getGameflowSession();

      console.log('\n🎮 游戏流程会话信息:');
      console.log(`   - 当前阶段: ${gameflowSession.phase}`);

      // 验证 GameflowSession 的基本结构
      expect(gameflowSession).toBeTruthy();
      expect(gameflowSession.phase).toBeDefined();
      expect(typeof gameflowSession.phase).toBe('string');

      // 验证 gameClient 信息
      if (gameflowSession.gameClient) {
        console.log('\n🖥️ 游戏客户端信息:');
        console.log(
          `   - 服务器IP: ${gameflowSession.gameClient.serverIp || '未知'}`
        );
        console.log(
          `   - 服务器端口: ${gameflowSession.gameClient.serverPort || '未知'}`
        );
        console.log(
          `   - 客户端运行状态: ${gameflowSession.gameClient.running ? '运行中' : '未运行'}`
        );
        console.log(
          `   - 客户端可见性: ${gameflowSession.gameClient.visible ? '可见' : '不可见'}`
        );

        expect(gameflowSession.gameClient).toHaveProperty('serverIp');
        expect(gameflowSession.gameClient).toHaveProperty('serverPort');
        expect(typeof gameflowSession.gameClient.running).toBe('boolean');
        expect(typeof gameflowSession.gameClient.visible).toBe('boolean');
      }

      // 验证 gameData 信息
      if (gameflowSession.gameData) {
        console.log('\n📊 游戏数据信息:');
        console.log(
          `   - 游戏ID: ${gameflowSession.gameData.gameId || '未知'}`
        );
        console.log(
          `   - 游戏名称: ${gameflowSession.gameData.gameName || '未知'}`
        );
        console.log(
          `   - 是否自定义游戏: ${gameflowSession.gameData.isCustomGame ? '是' : '否'}`
        );
        console.log(
          `   - 是否允许观战: ${gameflowSession.gameData.spectatorsAllowed ? '是' : '否'}`
        );

        expect(gameflowSession.gameData).toHaveProperty('gameId');
        expect(gameflowSession.gameData).toHaveProperty('gameName');
        expect(typeof gameflowSession.gameData.isCustomGame).toBe('boolean');
        expect(typeof gameflowSession.gameData.spectatorsAllowed).toBe(
          'boolean'
        );

        // 验证队伍信息
        if (
          gameflowSession.gameData.teamOne &&
          gameflowSession.gameData.teamTwo
        ) {
          console.log(
            `   - 队伍一人数: ${gameflowSession.gameData.teamOne.length}`
          );
          console.log(
            `   - 队伍二人数: ${gameflowSession.gameData.teamTwo.length}`
          );
          expect(Array.isArray(gameflowSession.gameData.teamOne)).toBe(true);
          expect(Array.isArray(gameflowSession.gameData.teamTwo)).toBe(true);
        }

        // 验证队列信息
        if (gameflowSession.gameData.queue) {
          console.log(`   - 队列ID: ${gameflowSession.gameData.queue.id}`);
          console.log(`   - 队列名称: ${gameflowSession.gameData.queue.name}`);
          console.log(
            `   - 游戏模式: ${gameflowSession.gameData.queue.gameMode}`
          );
          console.log(
            `   - 是否排位: ${gameflowSession.gameData.queue.isRanked ? '是' : '否'}`
          );

          expect(gameflowSession.gameData.queue).toHaveProperty('id');
          expect(gameflowSession.gameData.queue).toHaveProperty('name');
          expect(gameflowSession.gameData.queue).toHaveProperty('gameMode');
          expect(typeof gameflowSession.gameData.queue.isRanked).toBe(
            'boolean'
          );
        }
      }

      // 验证地图信息
      if (gameflowSession.map) {
        console.log('\n🗺️ 地图信息:');
        console.log(`   - 地图ID: ${gameflowSession.map.id}`);
        console.log(`   - 地图名称: ${gameflowSession.map.name}`);
        console.log(`   - 游戏模式: ${gameflowSession.map.gameMode}`);
        console.log(`   - 平台ID: ${gameflowSession.map.platformId}`);

        expect(gameflowSession.map).toHaveProperty('id');
        expect(gameflowSession.map).toHaveProperty('name');
        expect(gameflowSession.map).toHaveProperty('gameMode');
        expect(typeof gameflowSession.map.id).toBe('number');
      }

      // 验证游戏躲避信息
      if (gameflowSession.gameDodge) {
        console.log('\n🚪 游戏躲避信息:');
        console.log(`   - 躲避阶段: ${gameflowSession.gameDodge.phase}`);
        console.log(`   - 躲避状态: ${gameflowSession.gameDodge.state}`);
        console.log(
          `   - 躲避ID数量: ${gameflowSession.gameDodge.dodgeIds?.length || 0}`
        );

        expect(gameflowSession.gameDodge).toHaveProperty('phase');
        expect(gameflowSession.gameDodge).toHaveProperty('state');
        expect(Array.isArray(gameflowSession.gameDodge.dodgeIds)).toBe(true);
      }

      console.log('✅ 游戏流程会话信息获取测试完成');
    });
  });
});
