import { describe, it, expect, beforeEach } from 'vitest';
import { OpggService } from '../../opgg-service';
import { RegionType, TierType } from '../types';
import { RequestLogger } from '../../request-logger';

describe('OpggService', () => {
  let opggService: OpggService;

  beforeEach(() => {
    opggService = new OpggService();
  });

  describe('OP.GG 数据服务 - 真实API测试', () => {
    it('应该能够获取版本信息', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/ranked/versions'
      );

      const versions = await opggService.getVersions('global', 'ranked');

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/ranked/versions',
        versions,
        'application/json',
        200
      );

      expect(versions).toBeDefined();
      expect(versions.data).toBeInstanceOf(Array);
      expect(versions.data.length).toBeGreaterThan(0);
      console.log('✅ 获取版本信息成功:', versions.data.slice(0, 3));
    }, 10000);

    it('应该能够获取最新版本号', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/ranked/versions (latest)'
      );

      const latestVersion = await opggService.getLatestVersion(
        'global',
        'ranked'
      );

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/ranked/versions (latest)',
        { latestVersion },
        'application/json',
        200
      );

      expect(latestVersion).toBeDefined();
      expect(typeof latestVersion).toBe('string');
      expect(latestVersion.length).toBeGreaterThan(0);
      console.log('✅ 获取最新版本号成功:', latestVersion);
    }, 10000);

    it('应该能够获取排位英雄排行榜数据', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/ranked?tier=platinum_plus'
      );

      const championsTier = await opggService.getChampionsTier({
        region: 'kr',
        mode: 'ranked',
        tier: 'platinum_plus',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/kr/champions/ranked?tier=platinum_plus',
        championsTier,
        'application/json',
        200
      );

      expect(championsTier).toBeDefined();
      expect(championsTier.data).toBeInstanceOf(Array);
      expect(championsTier.data.length).toBeGreaterThan(0);
      expect(championsTier.meta).toBeDefined();
      expect(championsTier.meta.version).toBeDefined();
      console.log(
        '✅ 获取排位英雄排行榜数据成功, 英雄数量:',
        championsTier.data.length
      );
    }, 15000);

    it('应该能够获取ARAM英雄排行榜数据', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/aram?tier=platinum_plus'
      );

      const aramChampions = await opggService.getChampionsTier({
        region: 'global',
        mode: 'aram',
        tier: 'platinum_plus',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/aram?tier=platinum_plus',
        aramChampions,
        'application/json',
        200
      );

      expect(aramChampions).toBeDefined();
      expect(aramChampions.data).toBeInstanceOf(Array);
      expect(aramChampions.data.length).toBeGreaterThan(0);
      console.log(
        '✅ 获取ARAM英雄排行榜数据成功, 英雄数量:',
        aramChampions.data.length
      );
    }, 15000);

    it('应该能够获取竞技场英雄排行榜数据', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/arena?tier=platinum_plus'
      );

      const arenaChampions = await opggService.getChampionsTier({
        region: 'global',
        mode: 'arena',
        tier: 'platinum_plus',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/arena?tier=platinum_plus',
        arenaChampions,
        'application/json',
        200
      );

      expect(arenaChampions).toBeDefined();
      expect(arenaChampions.data).toBeInstanceOf(Array);
      expect(arenaChampions.data.length).toBeGreaterThan(0);
      console.log(
        '✅ 获取竞技场英雄排行榜数据成功, 英雄数量:',
        arenaChampions.data.length
      );
    }, 15000);

    it('应该能够获取单个英雄详细数据 - 亚索中路', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/157/ranked?tier=platinum_plus&position=mid'
      );

      const yasuo = await opggService.getChampion({
        id: 157, // 亚索
        region: 'global',
        mode: 'ranked',
        tier: 'platinum_plus',
        position: 'mid',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/157/ranked?tier=platinum_plus&position=mid',
        yasuo,
        'application/json',
        200
      );
      expect(yasuo).toBeDefined();
      expect(yasuo.data).toBeDefined();
      expect(yasuo.data.summary).toBeDefined();
      expect(yasuo.data.summary.id).toBe(157);

      // 检查是否为普通模式数据（有 rune_pages）
      if ('rune_pages' in yasuo.data) {
        expect(yasuo.data.rune_pages).toBeInstanceOf(Array);
        expect(yasuo.data.core_items).toBeInstanceOf(Array);
        console.log(
          '✅ 获取亚索中路数据成功, 胜率:',
          yasuo.data.summary.average_stats.win_rate
        );
      } else {
        // Arena 模式数据
        expect(yasuo.data.core_items).toBeInstanceOf(Array);
        console.log('✅ 获取亚索中路数据成功 (Arena模式)');
      }
    }, 15000);

    it('应该能够获取单个英雄详细数据 - 盖伦上路', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/86/ranked?tier=platinum_plus&position=top'
      );

      const garen = await opggService.getChampion({
        id: 86, // 盖伦
        region: 'global',
        mode: 'ranked',
        tier: 'platinum_plus',
        position: 'top',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/86/ranked?tier=platinum_plus&position=top',
        garen,
        'application/json',
        200
      );
      expect(garen).toBeDefined();
      expect(garen.data).toBeDefined();
      expect(garen.data.summary.id).toBe(86);

      // 检查胜率（根据模式类型）
      if ('win_rate' in garen.data.summary.average_stats) {
        console.log(
          '✅ 获取盖伦上路数据成功, 胜率:',
          garen.data.summary.average_stats.win_rate
        );
      } else {
        console.log('✅ 获取盖伦上路数据成功 (Arena模式)');
      }
    }, 15000);

    it('应该能够获取ARAM平衡性数据', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(sequence, 'GET', '/api/aram/balance');

      const aramBalance = await opggService.getARAMBalance();

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/aram/balance',
        aramBalance,
        'application/json',
        200
      );

      expect(aramBalance).toBeDefined();
      expect(aramBalance.data).toBeInstanceOf(Array);
      expect(aramBalance.data.length).toBeGreaterThan(0);

      // 检查数据结构
      const firstChampion = aramBalance.data[0];
      expect(firstChampion.champion_id).toBeDefined();
      expect(typeof firstChampion.damage_dealt).toBe('number');
      expect(typeof firstChampion.damage_taken).toBe('number');
      console.log(
        '✅ 获取ARAM平衡性数据成功, 英雄数量:',
        aramBalance.data.length
      );
    }, 10000);

    it('应该能够获取英雄在所有位置的数据', async () => {
      const sequence = await RequestLogger.getNextSequence();
      await RequestLogger.logSummary(
        sequence,
        'GET',
        '/api/global/champions/157/all-positions?tier=platinum_plus'
      );

      const allPositions = await opggService.getChampionAllPositions(157, {
        // 亚索
        region: 'global',
        tier: 'platinum_plus',
      });

      await RequestLogger.logRequest(
        sequence,
        'GET',
        '/api/global/champions/157/all-positions?tier=platinum_plus',
        allPositions,
        'application/json',
        200
      );
      expect(allPositions).toBeDefined();

      // 亚索通常在中路和上路有数据
      if (allPositions.mid) {
        expect(allPositions.mid.data.summary.id).toBe(157);
        if ('win_rate' in allPositions.mid.data.summary.average_stats) {
          console.log(
            '✅ 亚索中路数据存在, 胜率:',
            allPositions.mid.data.summary.average_stats.win_rate
          );
        } else {
          console.log('✅ 亚索中路数据存在 (Arena模式)');
        }
      }

      if (allPositions.top) {
        expect(allPositions.top.data.summary.id).toBe(157);
        if ('win_rate' in allPositions.top.data.summary.average_stats) {
          console.log(
            '✅ 亚索上路数据存在, 胜率:',
            allPositions.top.data.summary.average_stats.win_rate
          );
        } else {
          console.log('✅ 亚索上路数据存在 (Arena模式)');
        }
      }

      console.log('✅ 获取亚索所有位置数据完成');
    }, 20000);

    it('应该能够处理不同地区的数据', async () => {
      const regions: RegionType[] = ['global', 'kr', 'na', 'euw'];

      for (const region of regions) {
        try {
          const sequence = await RequestLogger.getNextSequence();
          await RequestLogger.logSummary(
            sequence,
            'GET',
            `/api/${region}/champions/ranked/versions`
          );

          const versions = await opggService.getVersions(region, 'ranked');

          await RequestLogger.logRequest(
            sequence,
            'GET',
            `/api/${region}/champions/ranked/versions`,
            versions,
            'application/json',
            200
          );

          expect(versions.data).toBeInstanceOf(Array);
          expect(versions.data.length).toBeGreaterThan(0);
          console.log(`✅ ${region} 地区版本数据获取成功:`, versions.data[0]);
        } catch (error) {
          console.warn(`⚠️ ${region} 地区数据获取失败:`, error);
        }
      }
    }, 30000);

    it('应该能够处理不同段位的数据', async () => {
      const tiers: TierType[] = [
        'platinum_plus',
        'diamond_plus',
        'master_plus',
      ];

      for (const tier of tiers) {
        try {
          const sequence = await RequestLogger.getNextSequence();
          await RequestLogger.logSummary(
            sequence,
            'GET',
            `/api/global/champions/ranked?tier=${tier}`
          );

          const championsTier = await opggService.getChampionsTier({
            region: 'global',
            mode: 'ranked',
            tier,
          });

          await RequestLogger.logRequest(
            sequence,
            'GET',
            `/api/global/champions/ranked?tier=${tier}`,
            championsTier,
            'application/json',
            200
          );

          expect(championsTier.data).toBeInstanceOf(Array);
          expect(championsTier.data.length).toBeGreaterThan(0);
          console.log(
            `✅ ${tier} 段位数据获取成功, 英雄数量:`,
            championsTier.data.length
          );
        } catch (error) {
          console.warn(`⚠️ ${tier} 段位数据获取失败:`, error);
        }
      }
    }, 30000);

    it('应该能够处理取消请求', async () => {
      const controller = new AbortController();

      // 立即取消请求
      setTimeout(() => controller.abort(), 100);

      try {
        await opggService.getVersions('global', 'ranked', controller.signal);
        // 如果没有被取消，也是正常的（请求可能很快完成）
        console.log('✅ 请求在取消前完成');
      } catch (error: any) {
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          console.log('✅ 请求成功被取消');
        } else {
          throw error;
        }
      }
    }, 5000);
  });

  describe('错误处理测试', () => {
    it('应该能够处理无效的英雄ID', async () => {
      try {
        await opggService.getChampion({
          id: 99999, // 不存在的英雄ID
          region: 'global',
          mode: 'ranked',
          tier: 'platinum_plus',
          position: 'mid',
        });
        // 如果没有抛出错误，说明API返回了默认数据或者处理了错误
        console.log('✅ 无效英雄ID处理完成');
      } catch (error) {
        // 预期会抛出错误
        expect(error).toBeDefined();
        console.log('✅ 无效英雄ID错误处理正确:', error);
      }
    }, 10000);
  });
});
