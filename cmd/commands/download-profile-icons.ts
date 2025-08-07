import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists, downloadImage } from '@/utils/file-utils';
import { getMajorVersion } from '@/utils/version';

/**
 * 玩家头像数据接口
 */
interface ProfileIconData {
  type: string;
  version: string;
  data: {
    [key: string]: {
      id: number;
      image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
      };
    };
  };
}

/**
 * 获取玩家头像数据
 */
async function fetchProfileIconData(version: string): Promise<ProfileIconData> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/profileicon.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取玩家头像信息失败: ${response.statusText}`);
  }
  return response.json();
}

/**
 * download-profile-icons 命令实现
 */
export const downloadProfileIconsCommand = new Command('download-profile-icons')
  .description('下载所有玩家头像到本地目录')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .option('-f, --force', '强制重新下载已存在的文件')
  .action(async (options, command) => {
    try {
      console.log('开始下载玩家头像...');

      // 获取全局选项
      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 's3');

      console.log(`基础目录: ${baseDir}`);

      // 创建版本管理器
      const versionManager = new VersionManager(baseDir);

      // 确定版本并转换为中版本
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

      // 获取玩家头像信息
      const profileIcons = await fetchProfileIconData(version);
      console.log(`找到 ${Object.keys(profileIcons.data).length} 个玩家头像`);

      // 创建保存目录 - 头像不放在版本文件夹下，统一存储
      const profileIconDir = join(baseDir, 'profileicon');
      await mkdir(profileIconDir, { recursive: true });

      // 下载每个玩家头像
      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;

      for (const [iconKey, iconData] of Object.entries(profileIcons.data)) {
        const iconId = iconData.id;
        const fileName = `${iconId}.png`;
        const savePath = join(profileIconDir, fileName);

        // 检查文件是否已存在
        if (!options.force && (await fileExists(savePath))) {
          console.log(`跳过已存在的玩家头像: ${iconId}`);
          skipCount++;
          continue;
        }

        console.log(`下载玩家头像: ${iconId}`);
        try {
          const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
          await downloadImage(url, savePath);
          successCount++;
        } catch (error) {
          console.log(
            `下载失败: ${iconId} - ${error instanceof Error ? error.message : '未知错误'}`
          );
          failCount++;
        }
      }

      console.log(`\n下载完成!`);
      console.log(`成功下载: ${successCount} 个玩家头像`);
      console.log(`跳过已存在: ${skipCount} 个文件`);
      console.log(`下载失败: ${failCount} 个文件`);
      console.log(`保存目录: ${profileIconDir}`);
    } catch (error) {
      console.error(
        '下载玩家头像失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
