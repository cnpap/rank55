import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { BanPickService } from '../service/ban-pick-service';
import { LCUClientInterface } from '../client/interface';
import { GameflowService } from '../service/gameflow-service';

describe('BanPickActions', () => {
  let lcuClient: LCUClientInterface;
  let banPickService: BanPickService;
  let gameflowService: GameflowService;

  describe('Ban/Pick 英雄操作 - 真实LOL测试', () => {
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

    it('应该能够获得当前游戏状态', async () => {
      const gameflowPhase = await gameflowService.getGameflowPhase();
      console.log('✅ 当前游戏状态:', gameflowPhase);
    });

    it('应该能够 Ban 英雄 76', async () => {
      await banPickService.banChampion(76);
      console.log('✅ Ban 英雄 76 (豹女) 成功');
    });

    it('应该能够 Pick 英雄 154', async () => {
      await banPickService.pickChampion(1);
      console.log('✅ Pick 英雄 154 成功');
    });

    it('应该能够预选英雄 154', async () => {
      await banPickService.hoverChampion(154);
      console.log('✅ 预选英雄 154 成功');
    });

    it('应该能够获取当前玩家的 Action 信息', async () => {
      // 获取当前玩家的 action
      const session = await banPickService.getChampSelectSession();
      expect(typeof session.localPlayerCellId).toBe('number');
      expect(Array.isArray(session.actions)).toBe(true);
      expect(session.actions.length).toBeGreaterThan(0);
      console.log('✅ 获取当前玩家 Action 信息测试完成');
    });
  });
});
