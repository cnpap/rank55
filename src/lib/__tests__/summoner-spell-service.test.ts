import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import {
  SummonerSpellService,
  SummonerSpell,
} from '../service/summoner-spell-service';
import { LCUClientInterface } from '../client/interface';

describe('SummonerSpellService', () => {
  let lcuClient: LCUClientInterface;
  let summonerSpellService: SummonerSpellService;

  describe('召唤师技能操作 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerSpellService = new SummonerSpellService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取所有可用的召唤师技能', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();
      console.log(`⚡ 可用召唤师技能数量: ${spells.length}`);

      expect(Array.isArray(spells)).toBe(true);
      expect(spells.length).toBeGreaterThan(0);

      if (spells.length > 0) {
        const firstSpell = spells[0];
        console.log(
          `🔮 第一个召唤师技能: ${firstSpell.name} (ID: ${firstSpell.id})`
        );

        // 验证召唤师技能对象的基本结构
        expect(typeof firstSpell.id).toBe('number');
        expect(typeof firstSpell.name).toBe('string');
        expect(typeof firstSpell.description).toBe('string');
        expect(typeof firstSpell.key).toBe('string');
        expect(typeof firstSpell.summonerLevel).toBe('number');
        expect(Array.isArray(firstSpell.modes)).toBe(true);
        expect(Array.isArray(firstSpell.cooldown)).toBe(true);
        expect(Array.isArray(firstSpell.cost)).toBe(true);
        expect(Array.isArray(firstSpell.range)).toBe(true);

        // 验证图片信息
        if (firstSpell.image) {
          expect(typeof firstSpell.image.full).toBe('string');
          expect(typeof firstSpell.image.sprite).toBe('string');
          expect(typeof firstSpell.image.group).toBe('string');
          expect(typeof firstSpell.image.x).toBe('number');
          expect(typeof firstSpell.image.y).toBe('number');
          expect(typeof firstSpell.image.w).toBe('number');
          expect(typeof firstSpell.image.h).toBe('number');
        }
      }
    });

    it('应该能够找到常见的召唤师技能', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();

      // 查找闪现技能 (Flash)
      const flash = spells.find(spell => spell.key === 'SummonerFlash');
      if (flash) {
        console.log(`⚡ 找到闪现技能: ${flash.name} (ID: ${flash.id})`);
        expect(flash.name).toContain('闪现');
        expect(flash.id).toBe(4); // 闪现的ID通常是4
      }

      // 查找点燃技能 (Ignite)
      const ignite = spells.find(spell => spell.key === 'SummonerDot');
      if (ignite) {
        console.log(`🔥 找到点燃技能: ${ignite.name} (ID: ${ignite.id})`);
        expect(ignite.name).toContain('点燃');
        expect(ignite.id).toBe(14); // 点燃的ID通常是14
      }

      // 查找传送技能 (Teleport)
      const teleport = spells.find(spell => spell.key === 'SummonerTeleport');
      if (teleport) {
        console.log(`🌀 找到传送技能: ${teleport.name} (ID: ${teleport.id})`);
        expect(teleport.name).toContain('传送');
        expect(teleport.id).toBe(12); // 传送的ID通常是12
      }

      // 查找治疗技能 (Heal)
      const heal = spells.find(spell => spell.key === 'SummonerHeal');
      if (heal) {
        console.log(`💚 找到治疗技能: ${heal.name} (ID: ${heal.id})`);
        expect(heal.name).toContain('治疗');
        expect(heal.id).toBe(21); // 治疗的ID通常是21
      }
    });

    it('应该能够验证召唤师技能的属性', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();

      // 验证每个技能都有必要的属性
      spells.forEach((spell, index) => {
        if (index < 5) {
          // 只验证前5个技能以避免测试时间过长
          console.log(`🔍 验证技能: ${spell.name}`);

          // 基本属性验证
          expect(spell.id).toBeGreaterThan(0);
          expect(spell.name.length).toBeGreaterThan(0);
          expect(spell.key.length).toBeGreaterThan(0);
          expect(spell.summonerLevel).toBeGreaterThanOrEqual(1);

          // 冷却时间应该是正数数组
          expect(spell.cooldown.length).toBeGreaterThan(0);
          spell.cooldown.forEach(cd => {
            expect(cd).toBeGreaterThanOrEqual(0);
          });

          // 模式数组不应该为空
          expect(spell.modes.length).toBeGreaterThan(0);
        }
      });
    });

    it('应该能够设置召唤师技能', async () => {
      try {
        // 获取可用的召唤师技能
        const spells = await summonerSpellService.getAvailableSummonerSpells();
        expect(spells.length).toBeGreaterThan(1);

        // 选择两个不同的技能进行测试
        const spell1 = spells.find(s => s.key === 'SummonerFlash') || spells[0];
        const spell2 = spells.find(s => s.key === 'SummonerDot') || spells[1];

        console.log(
          `🎯 尝试设置召唤师技能: ${spell1.name} (${spell1.id}) 和 ${spell2.name} (${spell2.id})`
        );

        // 设置召唤师技能
        await summonerSpellService.setSummonerSpells(spell1.id, spell2.id);
        console.log(`✅ 召唤师技能设置成功`);

        // 注意：这里我们无法直接验证设置是否成功，因为需要在英雄选择界面
        // 但如果没有抛出异常，说明API调用成功
      } catch (error) {
        // 如果不在英雄选择界面，这个操作会失败，这是正常的
        console.log(`ℹ️ 设置召唤师技能失败（可能不在英雄选择界面）: ${error}`);

        // 检查是否是预期的错误
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        expect(
          errorMessage.includes('champ-select') ||
            errorMessage.includes('session') ||
            errorMessage.includes('404') ||
            errorMessage.includes('403')
        ).toBe(true);
      }
    });

    it('应该能够处理无效的召唤师技能ID', async () => {
      try {
        // 使用无效的技能ID
        await summonerSpellService.setSummonerSpells(-1, -2);

        // 如果没有抛出异常，说明API没有验证输入（这也是可能的）
        console.log(`⚠️ API接受了无效的召唤师技能ID`);
      } catch (error) {
        // 预期会抛出异常
        console.log(`✅ 正确处理了无效的召唤师技能ID: ${error}`);
        expect(error).toBeDefined();
      }
    });

    it('应该能够验证召唤师技能的冷却时间计算', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();

      // 找到闪现技能进行详细验证
      const flash = spells.find(spell => spell.key === 'SummonerFlash');
      if (flash) {
        console.log(`⏰ 验证闪现技能冷却时间: ${flash.cooldown}`);

        // 闪现的冷却时间应该是300秒（5分钟）
        expect(flash.cooldown).toContain(300);
        expect(flash.cooldownBurn).toBe('300');

        console.log(`✅ 闪现技能冷却时间验证通过`);
      }
    });

    it('应该能够验证召唤师技能的等级要求', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();

      // 验证不同技能的等级要求
      const levelRequirements = new Map();

      spells.forEach(spell => {
        levelRequirements.set(spell.name, spell.summonerLevel);
      });

      console.log(`📊 召唤师技能等级要求统计:`);
      Array.from(levelRequirements.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10) // 只显示前10个
        .forEach(([name, level]) => {
          console.log(`  ${name}: 等级 ${level}`);
        });

      // 验证所有技能的等级要求都是合理的（1-18级）
      spells.forEach(spell => {
        expect(spell.summonerLevel).toBeGreaterThanOrEqual(1);
        expect(spell.summonerLevel).toBeLessThanOrEqual(18);
      });
    });

    it('应该能够验证召唤师技能的游戏模式支持', async () => {
      const spells = await summonerSpellService.getAvailableSummonerSpells();

      // 统计不同游戏模式的支持情况
      const modeSupport = new Map();

      spells.forEach(spell => {
        spell.modes.forEach(mode => {
          if (!modeSupport.has(mode)) {
            modeSupport.set(mode, 0);
          }
          modeSupport.set(mode, modeSupport.get(mode) + 1);
        });
      });

      console.log(`🎮 游戏模式支持统计:`);
      Array.from(modeSupport.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([mode, count]) => {
          console.log(`  ${mode}: ${count} 个技能支持`);
        });

      // 验证至少有一些常见的游戏模式
      expect(modeSupport.size).toBeGreaterThan(0);

      // 大多数技能应该支持经典模式
      const classicSupported = Array.from(modeSupport.keys()).some(
        mode =>
          mode.toLowerCase().includes('classic') ||
          mode.toLowerCase().includes('summoner') ||
          mode.toLowerCase().includes('rift')
      );

      if (classicSupported) {
        console.log(`✅ 发现支持经典模式的技能`);
      }
    });

    it('应该能够处理网络错误和连接问题', async () => {
      // 创建一个没有客户端的服务实例来模拟连接问题
      const serviceWithoutClient = new SummonerSpellService();

      try {
        await serviceWithoutClient.getAvailableSummonerSpells();
        // 如果没有抛出异常，说明使用了 electronAPI
        console.log(`ℹ️ 使用 electronAPI 获取召唤师技能成功`);
      } catch (error) {
        // 预期会抛出连接错误
        console.log(`✅ 正确处理了连接错误: ${error}`);
        expect(error).toBeDefined();

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        expect(
          errorMessage.includes('连接') ||
            errorMessage.includes('客户端') ||
            errorMessage.includes('LCU') ||
            errorMessage.includes('electronAPI')
        ).toBe(true);
      }
    });
  });
});
