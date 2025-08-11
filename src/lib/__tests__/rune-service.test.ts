import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { RuneService } from '../service/rune-service';
import { LCUClientInterface } from '../client/interface';

describe('RuneService', () => {
  let lcuClient: LCUClientInterface;
  let runeService: RuneService;

  describe('天赋配置操作 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        runeService = new RuneService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取天赋页面列表', async () => {
      const pages = await runeService.getRunePages();
      console.log(`📋 天赋页面数量: ${pages.length}`);
      expect(Array.isArray(pages)).toBe(true);

      if (pages.length > 0) {
        console.log(`📄 第一个天赋页面: ${pages[1].name}`);
        expect(typeof pages[1].id).toBe('number');
        expect(typeof pages[1].name).toBe('string');
      }
    });

    it('应该能够获取当前天赋页面', async () => {
      const currentPage = await runeService.getCurrentRunePage();
      console.log(`🎯 当前天赋页面: ${currentPage.name}`);
      expect(typeof currentPage.id).toBe('number');
      expect(typeof currentPage.name).toBe('string');
      expect(typeof currentPage.primaryStyleId).toBe('number');
      expect(typeof currentPage.subStyleId).toBe('number');
      expect(Array.isArray(currentPage.selectedPerkIds)).toBe(true);
    });

    it('应该能够获取可用天赋数据', async () => {
      const perks = await runeService.getAvailableRunes();
      console.log(`⚡ 可用天赋数量: ${perks.length}`);
      expect(Array.isArray(perks)).toBe(true);
      expect(perks.length).toBeGreaterThan(0);

      if (perks.length > 0) {
        const firstPerk = perks[0];
        expect(typeof firstPerk.id).toBe('number');
        expect(typeof firstPerk.name).toBe('string');
        console.log(`🔮 第一个天赋: ${firstPerk.name} (ID: ${firstPerk.id})`);
      }
    });

    it('应该能够获取天赋系数据', async () => {
      const styles = await runeService.getRuneStyles();
      console.log(`🎨 天赋系数量: ${styles.length}`);
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);

      if (styles.length > 0) {
        const firstStyle = styles[0];
        expect(typeof firstStyle.id).toBe('number');
        expect(typeof firstStyle.name).toBe('string');
        console.log(
          `🌟 第一个天赋系: ${firstStyle.name} (ID: ${firstStyle.id})`
        );

        if (firstStyle.slots) {
          console.log(`📦 天赋槽位数量: ${firstStyle.slots.length}`);
        }
      }
    });

    it('应该能够创建新的天赋页面', async () => {
      // 先获取天赋系数据以构建有效的天赋页面
      const styles = await runeService.getRuneStyles();
      expect(styles.length).toBeGreaterThan(1);

      const primaryStyle = styles[0];
      const subStyle = styles[1];

      // 构建基础天赋配置
      const selectedPerkIds: number[] = [];

      // 主要天赋系选择
      if (primaryStyle.slots) {
        primaryStyle.slots.forEach((slot: any) => {
          if (slot.perks && slot.perks.length > 0) {
            selectedPerkIds.push(slot.perks[0].id);
          }
        });
      }

      // 次要天赋系选择
      if (subStyle.slots && subStyle.slots.length >= 2) {
        for (let i = 0; i < 2; i++) {
          if (subStyle.slots[i].perks && subStyle.slots[i].perks.length > 0) {
            selectedPerkIds.push(subStyle.slots[i].perks[0].id);
          }
        }
      }

      const testRunePage = {
        name: '测试天赋页面',
        primaryStyleId: primaryStyle.id,
        subStyleId: subStyle.id,
        selectedPerkIds,
        current: false,
      };

      const createdPage = await runeService.createRunePage(testRunePage);
      console.log(
        `✅ 创建天赋页面成功: ${createdPage.name} (ID: ${createdPage.id})`
      );

      expect(typeof createdPage.id).toBe('number');
      expect(createdPage.name).toBe(testRunePage.name);
      expect(createdPage.primaryStyleId).toBe(testRunePage.primaryStyleId);
      expect(createdPage.subStyleId).toBe(testRunePage.subStyleId);

      // 清理：删除测试页面
      try {
        await runeService.deleteRunePage(createdPage.id);
        console.log(`🗑️ 清理测试天赋页面成功`);
      } catch (error) {
        console.log(`⚠️ 清理测试天赋页面失败: ${error}`);
      }
    });

    it('应该能够快速设置天赋页面', async () => {
      // 获取天赋系数据
      const styles = await runeService.getRuneStyles();
      expect(styles.length).toBeGreaterThan(1);

      const primaryStyle = styles[0];
      const subStyle = styles[1];

      // 构建天赋选择
      const selectedPerkIds: number[] = [];

      if (primaryStyle.slots) {
        primaryStyle.slots.forEach((slot: any) => {
          if (slot.perks && slot.perks.length > 0) {
            selectedPerkIds.push(slot.perks[0].id);
          }
        });
      }

      if (subStyle.slots && subStyle.slots.length >= 2) {
        for (let i = 0; i < 2; i++) {
          if (subStyle.slots[i].perks && subStyle.slots[i].perks.length > 0) {
            selectedPerkIds.push(subStyle.slots[i].perks[0].id);
          }
        }
      }

      const result = await runeService.setRunePage(
        '快速设置测试',
        primaryStyle.id,
        subStyle.id,
        selectedPerkIds
      );

      console.log(`⚡ 快速设置天赋页面成功: ${result.name}`);
      expect(result.name).toBe('快速设置测试');
      expect(result.primaryStyleId).toBe(primaryStyle.id);
      expect(result.subStyleId).toBe(subStyle.id);
    });

    it('应该能够验证天赋页面配置', async () => {
      // 获取当前天赋页面作为验证对象
      const currentPage = await runeService.getCurrentRunePage();

      const validationResult = await runeService.validateRunePage({
        primaryStyleId: currentPage.primaryStyleId,
        subStyleId: currentPage.subStyleId,
        selectedPerkIds: currentPage.selectedPerkIds,
      });

      console.log(
        `✅ 天赋页面验证结果: ${validationResult.isValid ? '有效' : '无效'}`
      );

      if (!validationResult.isValid && validationResult.errors) {
        console.log(`❌ 验证错误: ${validationResult.errors.join(', ')}`);
      }
    });

    it('应该能够获取推荐天赋配置', async () => {
      // 使用一个常见的英雄ID进行测试（例如：1 = 安妮）
      const championId = 1;

      try {
        const recommendedRunes = await runeService.getRecommendedRunes(
          championId,
          'middle'
        );
        console.log(`🎯 获取英雄 ${championId} 的推荐天赋成功`);

        if (recommendedRunes && Object.keys(recommendedRunes).length > 0) {
          console.log(
            `📊 推荐天赋配置数量: ${Object.keys(recommendedRunes).length}`
          );
        }
      } catch (error) {
        console.log(`ℹ️ 获取推荐天赋失败（可能是API不可用）: ${error}`);
        // 这个测试可能会失败，因为推荐天赋API可能不总是可用
      }
    });

    it('应该能够复制天赋页面', async () => {
      // 获取第一个天赋页面进行复制
      const pages = await runeService.getRunePages();
      expect(pages.length).toBeGreaterThan(0);

      const originalPage = pages[0];
      const duplicatedPage = await runeService.duplicateRunePage(
        originalPage.id,
        '复制测试页面'
      );

      console.log(`📋 复制天赋页面成功: ${duplicatedPage.name}`);
      expect(duplicatedPage.name).toBe('复制测试页面');
      expect(duplicatedPage.primaryStyleId).toBe(originalPage.primaryStyleId);
      expect(duplicatedPage.subStyleId).toBe(originalPage.subStyleId);

      // 清理：删除复制的页面
      try {
        await runeService.deleteRunePage(duplicatedPage.id);
        console.log(`🗑️ 清理复制的天赋页面成功`);
      } catch (error) {
        console.log(`⚠️ 清理复制的天赋页面失败: ${error}`);
      }
    });
  });
});
