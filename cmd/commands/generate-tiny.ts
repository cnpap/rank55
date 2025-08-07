import { Command } from 'commander';
import { resolve, join } from 'path';
import { readdir } from 'fs/promises';
import { generateItemTinyFromFileAndSave } from './utils/item-generator';
import { fileExists } from '@/utils/file-utils';
import { getMajorVersion } from '@/utils/version';

/**
 * 获取最新版本目录
 */
async function getLatestVersionFromLocal(baseDir: string): Promise<string> {
  try {
    const dynamicDir = resolve(baseDir);
    const entries = await readdir(dynamicDir, { withFileTypes: true });

    // 过滤出目录，并按版本号排序（支持中版本格式）
    const versionDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => /^\d+\.\d+(\.\d+)?$/.test(name)) // 匹配版本号格式，支持中版本
      .sort((a, b) => {
        const [aMajor, aMinor, aPatch = 0] = a.split('.').map(Number);
        const [bMajor, bMinor, bPatch = 0] = b.split('.').map(Number);

        if (aMajor !== bMajor) return bMajor - aMajor;
        if (aMinor !== bMinor) return bMinor - aMinor;
        return bPatch - aPatch;
      });

    if (versionDirs.length === 0) {
      throw new Error('未找到版本目录');
    }

    return versionDirs[0];
  } catch (error) {
    throw new Error(
      `获取版本信息失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * generate-tiny 命令实现
 */
export const generateTinyCommand = new Command('generate-tiny')
  .description('从现有 item.json 生成 item-tiny.json')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .option('-i, --input <path>', '指定输入文件路径（可选，默认为 item.json）')
  .option(
    '-o, --output <path>',
    '指定输出文件路径（可选，默认为 item-tiny.json）'
  )
  .action(async (options, command) => {
    try {
      console.log('开始从现有文件生成简化装备信息...');

      // 获取全局选项
      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 's3');

      console.log(`基础目录: ${baseDir}`);

      // 确定版本并转换为中版本
      let version: string;
      if (options.version) {
        version = getMajorVersion(options.version);
        console.log(`使用指定版本: ${version}`);
      } else {
        version = await getLatestVersionFromLocal(baseDir);
        console.log(`使用最新版本: ${version}`);
      }

      // 构建文件路径
      const versionDir = join(baseDir, version);
      const inputFileName = options.input || 'item.json';
      const outputFileName = options.output || 'item-tiny.json';

      const inputFilePath = resolve(join(versionDir, inputFileName));
      const outputFilePath = resolve(join(versionDir, outputFileName));

      console.log(`输入文件: ${inputFilePath}`);
      console.log(`输出文件: ${outputFilePath}`);

      // 检查输入文件是否存在
      if (!(await fileExists(inputFilePath))) {
        throw new Error(`输入文件不存在: ${inputFilePath}`);
      }

      // 生成简化文件
      const result = await generateItemTinyFromFileAndSave(
        inputFilePath,
        outputFilePath
      );

      console.log('\n生成完成!');
      console.log(`版本: ${result.version}`);
      console.log(`处理装备数量: ${Object.keys(result.data).length}`);
      console.log(`输出文件: ${outputFilePath}`);
    } catch (error) {
      console.error(
        '生成简化装备信息失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
