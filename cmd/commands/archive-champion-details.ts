import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists, downloadImage, getChampionList } from '@/utils/file-utils';
import type { Detail } from './types/champion-detail';
import { getMajorVersion } from '@/utils/version';

/**
 * 下载单个英雄的详细信息
 */
async function downloadChampionDetail(
  version: string,
  championId: string,
  savePath: string
): Promise<void> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion/${championId}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载英雄详情失败 ${championId}: HTTP ${response.status}`);
  }

  const data = await response.text();
  await writeFile(savePath, data, 'utf-8');
}

/**
 * 下载英雄的所有技能图标
 */
async function downloadChampionSkillIcons(
  version: string,
  championData: Detail,
  championKey: string,
  iconsDir: string,
  force: boolean = false
): Promise<{ success: number; skip: number; fail: number }> {
  const stats = { success: 0, skip: 0, fail: 0 };
  const championIconsDir = join(iconsDir, championKey);
  await mkdir(championIconsDir, { recursive: true });

  // 下载被动技能图标
  if (championData.passive?.image?.full) {
    const originalFileName = championData.passive.image.full;
    const fileExtension = originalFileName.split('.').pop() || 'png';
    const newFileName = `passive.${fileExtension}`;
    const savePath = join(championIconsDir, newFileName);

    if (!force && (await fileExists(savePath))) {
      stats.skip++;
    } else {
      try {
        const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${originalFileName}`;
        await downloadImage(url, savePath);
        stats.success++;
      } catch (error) {
        console.log(`下载被动技能图标失败 ${championKey}: ${error}`);
        stats.fail++;
      }
    }
  }

  // 下载主动技能图标 (Q, W, E, R)
  const skillNames = ['Q', 'W', 'E', 'R'];
  for (let i = 0; i < championData.spells?.length && i < 4; i++) {
    const spell = championData.spells[i];
    if (spell.image?.full) {
      const originalFileName = spell.image.full;
      const fileExtension = originalFileName.split('.').pop() || 'png';
      const newFileName = `${skillNames[i]}.${fileExtension}`;
      const savePath = join(championIconsDir, newFileName);

      if (!force && (await fileExists(savePath))) {
        stats.skip++;
      } else {
        try {
          const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${originalFileName}`;
          await downloadImage(url, savePath);
          stats.success++;
        } catch (error) {
          console.log(
            `下载技能图标失败 ${championKey}-${skillNames[i]}: ${error}`
          );
          stats.fail++;
        }
      }
    }
  }

  return stats;
}

/**
 * archive-champion-details 命令实现
 */
export const archiveChampionDetailsCommand = new Command(
  'archive-champion-details'
)
  .description('归档所有英雄的详细信息到本地文件')
  .option('-f, --force', '强制重新下载已存在的文件')
  .option('--icons', '同时下载技能图标')
  .action(async (options, command) => {
    try {
      console.log('开始归档英雄详细信息...');

      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 's3');
      const versionManager = new VersionManager(baseDir);

      await versionManager.cacheVersions();
      const fullVersion = await versionManager.getLatestVersionFromLocal();
      const majorVersion = getMajorVersion(fullVersion);

      console.log(`当前版本: ${fullVersion} -> 使用中版本: ${majorVersion}`);

      // 使用中版本创建保存目录
      const dataDir = join(baseDir, majorVersion);
      const championsDir = join(dataDir, 'champions');
      await mkdir(championsDir, { recursive: true });

      // 创建图标保存目录
      const iconsDir = join(dataDir, 'icons');
      if (options.icons) {
        await mkdir(iconsDir, { recursive: true });
      }

      // 获取英雄列表
      const champions = await getChampionList(fullVersion, dataDir);
      const championEntries = Object.entries(champions.data);
      console.log(`找到 ${championEntries.length} 个英雄`);

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;
      let iconStats = { success: 0, skip: 0, fail: 0 };

      for (const [championName, championData] of championEntries) {
        const championId = championData.id;
        const championKey = championData.key;
        const fileName = `${championKey}.json`;
        const savePath = join(championsDir, fileName);

        // 检查文件是否已存在
        if (!options.force && (await fileExists(savePath))) {
          console.log(`跳过已存在的英雄详情: ${championName} (${championKey})`);
          skipCount++;
        } else {
          console.log(`下载英雄详情: ${championName} (${championKey})`);
          try {
            await downloadChampionDetail(fullVersion, championId, savePath);
            successCount++;
          } catch (error) {
            console.log(`下载失败: ${championName} - ${error}`);
            failCount++;
            continue;
          }
        }

        // 如果启用了图标下载选项
        if (options.icons && (await fileExists(savePath))) {
          const jsonData = await readFile(savePath, 'utf-8');
          const championDetail = JSON.parse(jsonData);
          const detailData = Object.values(championDetail.data)[0] as Detail;

          console.log(`下载技能图标: ${championName} (${championKey})`);
          try {
            const stats = await downloadChampionSkillIcons(
              fullVersion,
              detailData,
              championKey,
              iconsDir,
              options.force
            );
            iconStats.success += stats.success;
            iconStats.skip += stats.skip;
            iconStats.fail += stats.fail;
          } catch (error) {
            console.log(`下载技能图标失败: ${championName} - ${error}`);
          }
        }

        // 添加小延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`\n归档完成!`);
      console.log(`英雄数据 - 成功下载: ${successCount} 个`);
      console.log(`英雄数据 - 跳过已存在: ${skipCount} 个`);
      console.log(`英雄数据 - 下载失败: ${failCount} 个`);

      if (options.icons) {
        console.log(`技能图标 - 成功下载: ${iconStats.success} 个`);
        console.log(`技能图标 - 跳过已存在: ${iconStats.skip} 个`);
        console.log(`技能图标 - 下载失败: ${iconStats.fail} 个`);
        console.log(`图标保存目录: ${iconsDir}`);
      }

      console.log(`保存目录: ${championsDir}`);
    } catch (error) {
      console.error('归档英雄详细信息失败:', error);
      process.exit(1);
    }
  });
