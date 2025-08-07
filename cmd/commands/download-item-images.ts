import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir } from 'fs/promises';
import type { ItemRaw } from '../../src/types/item-raw';
import { VersionManager } from './utils/version-manager';
import { fileExists, downloadImage } from '@/utils/file-utils';
import { getMajorVersion } from '@/utils/version';

/**
 * 获取装备数据
 */
async function fetchItemData(version: string): Promise<ItemRaw> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/item.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取装备信息失败: ${response.statusText}`);
  }
  return response.json();
}

/**
 * download-item-images 命令实现
 */
export const downloadItemImagesCommand = new Command('download-item-images')
  .description('下载所有装备图片到本地目录')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .action(async (options, command) => {
    try {
      console.log('开始下载装备图片...');

      // 获取全局选项
      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 'public/dynamic');

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

      // 获取装备信息
      const items = await fetchItemData(version);
      console.log(`找到 ${Object.keys(items.data).length} 个装备`);

      // 创建保存目录 - 图片不放在版本文件夹下，统一存储
      const itemImageDir = join(baseDir, 'item');
      await mkdir(itemImageDir, { recursive: true });

      // 下载每个装备的图片
      let successCount = 0;
      let skipCount = 0;

      for (const [itemID, itemData] of Object.entries(items.data)) {
        const itemName = itemData.name;
        const fileName = `${itemID}.png`;
        const savePath = join(itemImageDir, fileName);

        // 检查文件是否已存在
        if (await fileExists(savePath)) {
          console.log(`跳过已存在的装备图片: ${itemName} (${itemID})`);
          skipCount++;
          continue;
        }

        console.log(`下载装备图片: ${itemName} (${itemID})`);
        try {
          const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemID}.png`;
          await downloadImage(url, savePath);
          successCount++;
        } catch (error) {
          console.log(
            `下载失败: ${itemName} - ${error instanceof Error ? error.message : '未知错误'}`
          );
        }
      }

      console.log(
        `\n下载完成! 成功下载 ${successCount} 个装备图片，跳过 ${skipCount} 个已存在文件`
      );
      console.log(`保存目录: ${itemImageDir}`);
    } catch (error) {
      console.error(
        '下载装备图片失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
