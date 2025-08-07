import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import type { ItemRaw } from '../../src/types/item-raw';
import type { TagData } from '../../src/types/item';
import { VersionManager } from './utils/version-manager';
import { generateItemTinyFromFileAndSave } from './utils/item-generator';
import { fileExists } from '@/utils/file-utils';
import { getMajorVersion } from '@/utils/version';

/**
 * 获取装备数据
 */
async function fetchItemData(version: string): Promise<ItemRaw> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/item.json`;
  console.log(`下载链接: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取装备信息失败: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 生成装备属性统计信息
 */
function generateItemStats(version: string) {
  return {
    version,
    stats: {
      ad: { key: 'ad', displayName: '攻击力', suffix: '', category: '攻击' },
      ap: { key: 'ap', displayName: '法术强度', suffix: '', category: '法术' },
      hp: { key: 'hp', displayName: '生命值', suffix: '', category: '防御' },
      armor: {
        key: 'armor',
        displayName: '护甲',
        suffix: '',
        category: '防御',
      },
      mr: { key: 'mr', displayName: '魔法抗性', suffix: '', category: '防御' },
      as: { key: 'as', displayName: '攻击速度', suffix: '%', category: '攻击' },
      crit: {
        key: 'crit',
        displayName: '暴击几率',
        suffix: '%',
        category: '攻击',
      },
      mana: {
        key: 'mana',
        displayName: '法力值',
        suffix: '',
        category: '法术',
      },
      ms: { key: 'ms', displayName: '移动速度', suffix: '', category: '移动' },
      lethality: {
        key: 'lethality',
        displayName: '穿甲',
        suffix: '',
        category: '穿透',
      },
      armorPenPercent: {
        key: 'armorPenPercent',
        displayName: '护甲穿透',
        suffix: '%',
        category: '穿透',
      },
      magicPen: {
        key: 'magicPen',
        displayName: '法术穿透',
        suffix: '',
        category: '穿透',
      },
      cdr: {
        key: 'cdr',
        displayName: '技能急速',
        suffix: '',
        category: '法术',
      },
      lifesteal: {
        key: 'lifesteal',
        displayName: '生命偷取',
        suffix: '%',
        category: '恢复',
      },
      spellvamp: {
        key: 'spellvamp',
        displayName: '法术吸血',
        suffix: '%',
        category: '恢复',
      },
      hpregen: {
        key: 'hpregen',
        displayName: '基础生命回复',
        suffix: '%',
        category: '恢复',
      },
      manaregen: {
        key: 'manaregen',
        displayName: '基础法力回复',
        suffix: '%',
        category: '恢复',
      },
      healShieldPower: {
        key: 'healShieldPower',
        displayName: '治疗和护盾强度',
        suffix: '%',
        category: '辅助',
      },
    },
  };
}

/**
 * 获取标签中文名称
 */
function getTagChineseName(tag: string): string {
  const tagTranslations: Record<string, string> = {
    AttackSpeed: '攻击速度',
    CriticalStrike: '暴击',
    Damage: '物理伤害',
    ArmorPenetration: '护甲穿透',
    LifeSteal: '生命偷取',
    Armor: '护甲',
    SpellDamage: '法术伤害',
    MagicPenetration: '法术穿透',
    SpellVamp: '法术吸血',
    SpellBlock: '魔法抗性',
    MagicResist: '魔法抗性',
    AbilityHaste: '技能急速',
    Health: '生命值',
    HealthRegen: '生命回复',
    Mana: '法力值',
    ManaRegen: '法力回复',
    CooldownReduction: '冷却缩减',
    Lane: '出门装',
    Jungle: '打野出门装',
    Boots: '鞋子',
    Active: '主动效果',
    Aura: '光环效果',
    Consumable: '消耗品',
    GoldPer: '金币收入',
    NonbootsMovement: '非鞋子移速',
    OnHit: '攻击特效',
    Slow: '减速',
    Stealth: '隐身',
    Tenacity: '韧性',
    Vision: '视野',
  };

  return tagTranslations[tag] || tag;
}

/**
 * 收集标签统计信息
 */
function collectTagStats(items: ItemRaw, version: string): TagData {
  const tagStats: TagData = {
    tags: {},
  };

  // 遍历所有装备，收集 tag 信息
  for (const [itemID, itemData] of Object.entries(items.data)) {
    for (const tag of itemData.tags) {
      if (tagStats.tags[tag]) {
        tagStats.tags[tag].count++;
      } else {
        tagStats.tags[tag] = {
          count: 1,
          chineseName: getTagChineseName(tag),
        };
      }
    }
  }

  return tagStats;
}

/**
 * archive-items 命令实现
 */
export const archiveItemsCommand = new Command('archive-items')
  .description('归档装备信息到本地文件')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .action(async (options, command) => {
    try {
      console.log('开始归档装备信息...');

      // 获取全局选项
      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 's3');

      console.log(`基础目录: ${baseDir}`);

      // 创建版本管理器
      const versionManager = new VersionManager(baseDir);

      // 确定版本
      let version: string;
      if (options.version) {
        version = options.version;
        console.log(`使用指定版本: ${version}`);
      } else {
        await versionManager.cacheVersions();
        version = await versionManager.getLatestVersionFromLocal();
        console.log(`当前最新版本: ${version}`);
      }

      // 转换为中版本用于存储
      const majorVersion = getMajorVersion(version);
      console.log(`使用中版本进行存储: ${majorVersion}`);

      // 创建版本目录
      const versionDir = join(baseDir, majorVersion);
      await mkdir(versionDir, { recursive: true });

      // 获取装备信息
      const items = await fetchItemData(version);

      // 保存完整装备信息
      const fullFilePath = join(versionDir, 'item.json');
      if (await fileExists(fullFilePath)) {
        console.log(`文件已存在，将覆盖: ${fullFilePath}`);
      }
      await writeFile(fullFilePath, JSON.stringify(items, null, 2), 'utf-8');

      // 生成并保存标签统计信息
      const tagStats = collectTagStats(items, majorVersion);
      const tagStatsFilePath = join(versionDir, 'item-tags.json');
      await writeFile(
        tagStatsFilePath,
        JSON.stringify(tagStats, null, 2),
        'utf-8'
      );

      // 生成并保存属性统计信息
      const itemStats = generateItemStats(majorVersion);
      const itemStatsFilePath = join(versionDir, 'item-stats.json');
      await writeFile(
        itemStatsFilePath,
        JSON.stringify(itemStats, null, 2),
        'utf-8'
      );

      console.log('\n归档完成!');
      console.log(
        `完整装备信息已保存到: ${fullFilePath} (包含 ${Object.keys(items.data).length} 个装备)`
      );
      console.log(
        `装备标签统计信息已保存到: ${tagStatsFilePath} (包含 ${Object.keys(tagStats.tags).length} 个标签)`
      );
      console.log(
        `装备属性统计信息已保存到: ${itemStatsFilePath} (包含 ${Object.keys(itemStats.stats).length} 个属性)`
      );

      // 自动生成 tiny 文件
      console.log('\n开始生成简化装备信息...');
      try {
        const tinyFilePath = join(versionDir, 'item-tiny.json');
        const result = await generateItemTinyFromFileAndSave(
          fullFilePath,
          tinyFilePath
        );

        console.log('简化装备信息生成完成!');
        console.log(`处理装备数量: ${Object.keys(result.data).length}`);
        console.log(`简化装备信息已保存到: ${tinyFilePath}`);
      } catch (tinyError) {
        console.warn(
          '生成简化装备信息失败:',
          tinyError instanceof Error ? tinyError.message : '未知错误'
        );
        console.warn('归档操作已完成，但简化文件生成失败');
      }
    } catch (error) {
      console.error(
        '归档装备信息失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
