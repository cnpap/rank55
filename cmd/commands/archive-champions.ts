import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists } from '../../src/utils/file-utils';
import { getMajorVersion } from '@/utils/version';
import { pinyin } from 'pinyin-pro';

/**
 * 生成拼音和简写拼音
 */
function generatePinyin(text: string): { full: string; short: string } {
  // 获取完整拼音（不带音调）
  const fullPinyin = pinyin(text, { toneType: 'none', type: 'array' }).join('');

  // 获取简写拼音（首字母）
  const shortPinyin = pinyin(text, { pattern: 'first', toneType: 'none' });

  return {
    full: fullPinyin.toLowerCase().replace(/\s+/g, ''), // 去除所有空格
    short: shortPinyin.toLowerCase().replace(/\s+/g, ''), // 去除所有空格
  };
}

/**
 * 预处理英雄数据，删除不需要的字段并添加 query 字段
 */
function preprocessChampionData(data: any) {
  const processedData = { ...data };

  // 遍历所有英雄数据
  if (processedData.data) {
    for (const championKey in processedData.data) {
      const champion = processedData.data[championKey];

      // 生成 name 的拼音
      const namePinyin = generatePinyin(champion.name);

      // 生成 title 的拼音
      const titlePinyin = generatePinyin(champion.title);

      // 创建 query 字段，包含 id、key、name、title 以及拼音
      const queryParts = [
        champion.id,
        champion.key,
        champion.name,
        champion.title,
        namePinyin.short,
        namePinyin.full,
        titlePinyin.short,
        titlePinyin.full,
      ];

      champion.query = queryParts.join(',');

      // 删除指定字段
      delete champion.blurb;
      delete champion.info;
      delete champion.version;
      delete champion.image;
    }
  }

  return processedData;
}

/**
 * archive-champions 命令实现
 */
export const archiveChampionsCommand = new Command('archive-champions')
  .description('归档英雄信息到本地文件')
  .option('-f, --force', '强制重新下载已存在的文件')
  .action(async (options, command) => {
    try {
      console.log('开始归档英雄信息...');

      const globalOptions = command.parent?.opts() || {};
      console.log('全局选项:', globalOptions);
      const baseDir = resolve(globalOptions.dir || 's3');
      const versionManager = new VersionManager(baseDir);

      await versionManager.cacheVersions();
      const fullVersion = await versionManager.getLatestVersionFromLocal();
      const majorVersion = getMajorVersion(fullVersion);

      console.log(`当前版本: ${fullVersion} -> 使用中版本: ${majorVersion}`);

      // 使用中版本创建保存目录
      const dataDir = join(baseDir, majorVersion);
      await mkdir(dataDir, { recursive: true });

      const filePath = join(dataDir, 'champion.json');

      // 检查文件是否已存在
      if (!options.force && (await fileExists(filePath))) {
        console.log(`文件已存在，跳过下载: ${filePath}`);
        return;
      }

      // 构建API URL（仍使用完整版本号）
      const url = `https://ddragon.leagueoflegends.com/cdn/${fullVersion}/data/zh_CN/champion.json`;
      console.log(`下载链接: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下载英雄信息失败: HTTP ${response.status}`);
      }

      const rawData = await response.text();
      const jsonData = JSON.parse(rawData);

      // 预处理数据，删除不需要的字段并添加 query 字段
      const processedData = preprocessChampionData(jsonData);
      console.log('已删除英雄数据中的 blurb、info、version、image 字段');
      console.log('已为每个英雄添加 query 字段（包含拼音搜索）');

      // 保存处理后的数据
      const processedDataString = JSON.stringify(processedData, null, 2);
      await writeFile(filePath, processedDataString, 'utf-8');

      const sizeKB = (processedDataString.length / 1024).toFixed(2);
      console.log(`\n归档完成! 英雄信息已保存到: ${filePath} (${sizeKB} KB)`);
    } catch (error) {
      console.error('归档英雄信息失败:', error);
      process.exit(1);
    }
  });
