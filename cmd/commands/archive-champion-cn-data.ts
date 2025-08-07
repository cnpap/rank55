import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import {
  fileExists,
  downloadImage,
  getChampionList,
} from '../../src/utils/file-utils';
import type { ChampionCnData } from '@/types/champion-cn';
import { getMajorVersion } from '@/utils/version';

/**
 * 下载单个英雄的国区数据
 */
async function downloadChampionCnData(
  championKey: string,
  savePath: string
): Promise<ChampionCnData | null> {
  const timestamp = Date.now();
  const url = `https://game.gtimg.cn/images/lol/act/img/js/hero/${championKey}.js?ts=${timestamp}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // 404表示该key没有对应的英雄，这是正常的
      }
      throw new Error(
        `下载英雄数据失败 ${championKey}: HTTP ${response.status}`
      );
    }

    const text = await response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`无法解析英雄数据 ${championKey}: 格式不正确`);
    }

    const championData: ChampionCnData = JSON.parse(jsonMatch[0]);
    championData.version = championData.version || 'unknown';
    championData.fileName = `${championKey}.js`;
    championData.fileTime = new Date().toLocaleString('zh-CN');

    await writeFile(savePath, JSON.stringify(championData, null, 2), 'utf-8');
    return championData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * 下载英雄的技能图标
 */
async function downloadChampionSpellIcons(
  championData: ChampionCnData,
  championId: number,
  iconsDir: string,
  force: boolean = false
): Promise<{ success: number; skip: number; fail: number }> {
  const stats = { success: 0, skip: 0, fail: 0 };
  const championIconsDir = join(iconsDir, championId.toString());
  await mkdir(championIconsDir, { recursive: true });

  for (const spell of championData.spells) {
    if (spell.abilityIconPath) {
      const fileName = `${spell.spellKey}.png`;
      const savePath = join(championIconsDir, fileName);

      if (!force && (await fileExists(savePath))) {
        stats.skip++;
      } else {
        try {
          await downloadImage(spell.abilityIconPath, savePath);
          stats.success++;
        } catch (error) {
          console.log(
            `下载技能图标失败 ${championId}-${spell.spellKey}: ${error}`
          );
          stats.fail++;
        }
      }
    }
  }

  return stats;
}

/**
 * archive-champion-cn-data 命令实现
 */
export const archiveChampionCnDataCommand = new Command(
  'archive-champion-cn-data'
)
  .description('归档所有英雄的国区数据到本地文件')
  .option('-f, --force', '强制重新下载已存在的文件')
  .option('--icons', '同时下载技能图标')
  .action(async (options, command) => {
    try {
      console.log('开始归档国区英雄数据...');

      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 's3');
      const versionManager = new VersionManager(baseDir);

      await versionManager.cacheVersions();
      const fullVersion = await versionManager.getLatestVersionFromLocal();
      const majorVersion = getMajorVersion(fullVersion);

      console.log(`当前版本: ${fullVersion} -> 使用中版本: ${majorVersion}`);

      // 获取英雄列表
      const dataDir = join(baseDir, majorVersion);
      const champions = await getChampionList(fullVersion, dataDir);
      const championEntries = Object.entries(champions.data);
      console.log(`找到 ${championEntries.length} 个英雄`);

      // 创建保存目录
      const championsDir = join(dataDir, 'champions-cn');
      const iconsDir = join(baseDir, 'icons-cn');
      await mkdir(championsDir, { recursive: true });
      if (options.icons) {
        await mkdir(iconsDir, { recursive: true });
      }

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;
      let notFoundCount = 0;
      let iconStats = { success: 0, skip: 0, fail: 0 };

      for (const [championName, championData] of championEntries) {
        const championKey = championData.key;
        const fileName = `${championKey}.json`;
        const savePath = join(championsDir, fileName);

        // 检查文件是否已存在
        if (!options.force && (await fileExists(savePath))) {
          console.log(`跳过已存在的英雄数据: ${championName} (${championKey})`);
          skipCount++;

          // 如果文件存在且需要下载图标，读取数据用于下载图标
          if (options.icons) {
            try {
              const existingData = JSON.parse(
                await readFile(savePath, 'utf-8')
              );
              const stats = await downloadChampionSpellIcons(
                existingData,
                parseInt(championKey),
                iconsDir,
                false
              );
              iconStats.success += stats.success;
              iconStats.skip += stats.skip;
              iconStats.fail += stats.fail;
            } catch (error) {
              console.log(`读取已存在文件失败 ${championKey}: ${error}`);
            }
          }
          continue;
        }

        console.log(`下载英雄数据: ${championName} (${championKey})`);
        try {
          const championCnData = await downloadChampionCnData(
            championKey,
            savePath
          );

          if (championCnData === null) {
            console.log(`英雄数据不存在: ${championName} (${championKey})`);
            notFoundCount++;
            continue;
          }

          successCount++;
          console.log(
            `成功下载: ${championCnData.hero.name} (${championCnData.hero.alias})`
          );

          // 下载技能图标
          if (options.icons) {
            console.log(`下载技能图标: ${championKey}`);
            try {
              const stats = await downloadChampionSpellIcons(
                championCnData,
                parseInt(championKey),
                iconsDir,
                false
              );
              iconStats.success += stats.success;
              iconStats.skip += stats.skip;
              iconStats.fail += stats.fail;
            } catch (error) {
              console.log(`下载技能图标失败: ${championKey} - ${error}`);
            }
          }
        } catch (error) {
          console.log(`下载失败: ${championName} (${championKey}) - ${error}`);
          failCount++;
        }

        // 添加小延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`\n归档完成!`);
      console.log(`实际使用版本: ${majorVersion}`);
      console.log(`英雄数据 - 成功下载: ${successCount} 个`);
      console.log(`英雄数据 - 跳过已存在: ${skipCount} 个`);
      console.log(`英雄数据 - 下载失败: ${failCount} 个`);
      console.log(`英雄数据 - 不存在: ${notFoundCount} 个`);

      if (options.icons) {
        console.log(`技能图标 - 成功下载: ${iconStats.success} 个`);
        console.log(`技能图标 - 跳过已存在: ${iconStats.skip} 个`);
        console.log(`技能图标 - 下载失败: ${iconStats.fail} 个`);
        console.log(`图标保存目录: ${iconsDir}`);
      }

      console.log(`英雄数据保存目录: ${championsDir}`);
    } catch (error) {
      console.error('归档国区英雄数据失败:', error);
      process.exit(1);
    }
  });
