import { Command } from 'commander';
import { resolve, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists } from '../../src/utils/file-utils';
import { SkillExpressionData } from './utils/expression-extractor';
import { getMajorVersion } from '@/utils/version';

/**
 * extract-all-expressions 命令实现
 */
export const extractAllExpressionsCommand = new Command(
  'extract-all-expressions'
)
  .description('从技能表达式文件中提取所有表达式并保存到独立文件')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .option(
    '-i, --input <path>',
    '指定输入文件路径（可选，默认为 skill-expressions.json）'
  )
  .option(
    '-o, --output <path>',
    '指定输出文件路径（可选，默认为 all-expressions.json）'
  )
  .option('--unique', '去除重复的表达式')
  .option('--pretty', '格式化输出JSON（便于阅读）')
  .action(async (options, command) => {
    try {
      console.log('开始提取所有技能表达式...');

      // 获取全局选项
      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 'public/dynamic');
      const versionManager = new VersionManager(baseDir);

      console.log(`基础目录: ${baseDir}`);

      // 确定版本
      let fullVersion: string;
      let majorVersion: string;

      if (options.version) {
        fullVersion = options.version;
        majorVersion = getMajorVersion(options.version);
        console.log(`使用指定版本: ${fullVersion} -> ${majorVersion}`);
      } else {
        await versionManager.cacheVersions();
        fullVersion = await versionManager.getLatestVersionFromLocal();
        majorVersion = getMajorVersion(fullVersion);
        console.log(`当前版本: ${fullVersion} -> 使用中版本: ${majorVersion}`);
      }

      // 构建文件路径
      const dataDir = join(baseDir, majorVersion);
      const inputFileName = options.input || 'skill-expressions.json';
      const outputFileName = options.output || 'all-expressions.json';
      const inputFilePath = resolve(join(dataDir, inputFileName));
      const outputFilePath = resolve(join(dataDir, outputFileName));

      console.log(`输入文件: ${inputFilePath}`);
      console.log(`输出文件: ${outputFilePath}`);

      // 检查输入文件是否存在
      if (!(await fileExists(inputFilePath))) {
        throw new Error(`输入文件不存在: ${inputFilePath}`);
      }

      // 读取技能表达式文件
      console.log('读取技能表达式文件...');
      const fileContent = await readFile(inputFilePath, 'utf-8');
      const skillExpressionData: SkillExpressionData[] =
        JSON.parse(fileContent);

      console.log(`找到 ${skillExpressionData.length} 个技能数据`);

      // 提取所有表达式
      const allExpressions: string[] = [];
      let totalExpressions = 0;

      for (const skillData of skillExpressionData) {
        if (skillData.expressions && Array.isArray(skillData.expressions)) {
          allExpressions.push(...skillData.expressions);
          totalExpressions += skillData.expressions.length;
        }
      }

      console.log(`提取到 ${totalExpressions} 个表达式`);

      // 去重（如果需要）
      let finalExpressions: string[];
      if (options.unique) {
        finalExpressions = [...new Set(allExpressions)];
        console.log(`去重后剩余 ${finalExpressions.length} 个唯一表达式`);
      } else {
        finalExpressions = allExpressions;
      }

      // 按字母顺序排序
      finalExpressions.sort();

      // 保存结果
      const jsonContent = options.pretty
        ? JSON.stringify(finalExpressions, null, 2)
        : JSON.stringify(finalExpressions);

      await writeFile(outputFilePath, jsonContent, 'utf-8');

      console.log('\n提取完成!');
      console.log(`实际使用版本: ${majorVersion}`);
      console.log(`处理技能数量: ${skillExpressionData.length}`);
      console.log(`提取表达式总数: ${totalExpressions}`);
      if (options.unique) {
        console.log(`唯一表达式数量: ${finalExpressions.length}`);
      }
      console.log(`输出文件: ${outputFilePath}`);
    } catch (error) {
      console.error(
        '提取所有表达式失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
