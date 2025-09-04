import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { LCUClientInterface } from '../client/interface';
import { LOLStaticAssetsService } from '../service/lol-static-assets-service';

describe('LOL静态资源获取测试', () => {
  let lcuClient: LCUClientInterface;
  let staticAssetsService: LOLStaticAssetsService;

  describe('LOL静态资源 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        staticAssetsService = new LOLStaticAssetsService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取召唤师技能数据', async () => {
      const summonerSpells = await staticAssetsService.getSummonerSpells();
      console.log('✅ 召唤师技能数据:', summonerSpells);
      expect(summonerSpells).toBeDefined();
    });

    it('应该能够获取符文样式数据', async () => {
      const perkstyles = await staticAssetsService.getPerkstyles();
      console.log('✅ 符文样式数据:', perkstyles);
      expect(perkstyles).toBeDefined();
    });

    it('应该能够获取物品数据', async () => {
      const items = await staticAssetsService.getItems();
      console.log('✅ 物品数据:', items);
      expect(items).toBeDefined();
    });

    it('应该能够获取英雄概要数据', async () => {
      const championSummary = await staticAssetsService.getChampionSummary();
      console.log('✅ 英雄概要数据:', championSummary);
      expect(championSummary).toBeDefined();
    });

    it('应该能够获取地图数据', async () => {
      const maps = await staticAssetsService.getMaps();
      console.log('✅ 地图数据:', maps);
      expect(maps).toBeDefined();
    });

    it('应该能够获取符文数据', async () => {
      const perks = await staticAssetsService.getPerks();
      console.log('✅ 符文数据:', perks);
      expect(perks).toBeDefined();
    });

    it('应该能够获取队列数据', async () => {
      const queues = await staticAssetsService.getQueues();
      console.log('✅ 队列数据:', queues);
      expect(queues).toBeDefined();
    });

    it('应该能够获取地图资源数据', async () => {
      const mapAssets = await staticAssetsService.getMapAssets();
      console.log('✅ 地图资源数据:', mapAssets);
      expect(mapAssets).toBeDefined();
    });

    it('应该能够获取特定英雄详细数据 (英雄ID: 1)', async () => {
      const champDetails = await staticAssetsService.getChampDetails(1);
      console.log('✅ 英雄详细数据 (ID: 1):', champDetails);
      expect(champDetails).toBeDefined();
    });

    it('应该能够获取增强符文数据', async () => {
      const augments = await staticAssetsService.getAugments();
      console.log('✅ 增强符文数据:', augments);
      expect(augments).toBeDefined();
    });

    it('应该能够获取草莓中心数据', async () => {
      const strawberryHub = await staticAssetsService.getStrawberryHub();
      console.log('✅ 草莓中心数据:', strawberryHub);
      expect(strawberryHub).toBeDefined();
    });
  });
});
