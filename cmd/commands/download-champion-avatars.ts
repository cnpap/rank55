import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import {
  fileExists,
  downloadImage,
  getChampionList,
} from '../../src/utils/file-utils';

/**
 * download-champion-avatars 命令实现
 */
export const downloadChampionAvatarsCommand = new Command(
  'download-champion-avatars'
)
  .description('下载所有英雄头像')
  .option('-f, --force', '强制重新下载已存在的文件')
  .action(async (options, command) => {
    try {
      console.log('开始下载英雄头像...');

      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 'public/dynamic');
      const versionManager = new VersionManager(baseDir);

      await versionManager.cacheVersions();
      const fullVersion = await versionManager.getLatestVersionFromLocal();
      console.log(`当前版本: ${fullVersion}`);

      // 获取英雄信息
      const champions = await getChampionList(
        fullVersion,
        join(baseDir, fullVersion)
      );
      console.log(`找到 ${Object.keys(champions.data).length} 个英雄`);

      // 创建保存目录 - 头像不依赖版本，直接保存在avatar目录
      const avatarDir = join(baseDir, 'avatar');
      await mkdir(avatarDir, { recursive: true });

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;
      const championEntries = Object.entries(champions.data);

      for (const [championName, championData] of championEntries) {
        const championKey = championData.key;
        const championID = championData.id;
        const fileName = `${championKey}.png`;
        const savePath = join(avatarDir, fileName);

        // 检查文件是否已存在
        if (!options.force && (await fileExists(savePath))) {
          console.log(`跳过已存在的头像: ${championName} (${championKey})`);
          skipCount++;
          continue;
        }

        console.log(`下载头像: ${championName} (${championKey})`);
        try {
          const url = `https://ddragon.leagueoflegends.com/cdn/${fullVersion}/img/champion/${championID}.png`;
          await downloadImage(url, savePath);
          successCount++;
        } catch (error) {
          console.log(`下载失败: ${championName} - ${error}`);
          failCount++;
        }
      }

      console.log(`\n下载完成!`);
      console.log(`成功下载: ${successCount} 个`);
      console.log(`跳过已存在: ${skipCount} 个`);
      console.log(`下载失败: ${failCount} 个`);
      console.log(`保存目录: ${avatarDir}`);
    } catch (error) {
      console.error('下载英雄头像失败:', error);
      process.exit(1);
    }
  });
