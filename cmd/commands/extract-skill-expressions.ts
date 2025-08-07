import { Command } from 'commander';
import { resolve, join } from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists } from '../../src/utils/file-utils';
import type { ChampionCnData } from '@/types/champion-cn';
import {
  extractExpressions,
  SkillExpressionData,
} from './utils/expression-extractor';
import { getMajorVersion } from '@/utils/version';

/**
 * 从单个英雄数据中提取技能表达式
 */
function extractSkillExpressions(
  championData: ChampionCnData
): SkillExpressionData[] {
  const results: SkillExpressionData[] = [];

  if (!championData.spells || !Array.isArray(championData.spells)) {
    return results;
  }

  for (const spell of championData.spells) {
    if (spell.description && spell.description.trim()) {
      const expressions = extractExpressions(spell.description);

      // 只有当找到表达式时才添加到结果中
      if (expressions.length > 0) {
        results.push({
          fileName: championData.fileName,
          heroName: championData.hero.name,
          spellKey: spell.spellKey,
          spellName: spell.name,
          originalDescription: spell.description,
          expressions: expressions,
        });
      }
    }
  }

  return results;
}

/**
 * extract-skill-expressions 命令实现
 */
export const extractSkillExpressionsCommand = new Command(
  'extract-skill-expressions'
)
  .description('提取所有英雄技能中的计算表达式')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .option(
    '-o, --output <path>',
    '指定输出文件路径（可选，默认为 skill-expressions.json）'
  )
  .option('--pretty', '格式化输出JSON（便于阅读）')
  .action(async (options, command) => {
    try {
      console.log('开始提取英雄技能计算表达式...');

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

      // 构建目录路径
      const dataDir = join(baseDir, majorVersion);
      const championsDir = join(dataDir, 'champions-cn');
      const outputFileName = options.output || 'skill-expressions.json';
      const outputFilePath = resolve(join(dataDir, outputFileName));

      console.log(`英雄数据目录: ${championsDir}`);
      console.log(`输出文件: ${outputFilePath}`);

      // 检查英雄数据目录是否存在
      if (!(await fileExists(championsDir))) {
        throw new Error(`英雄数据目录不存在: ${championsDir}`);
      }

      // 读取所有英雄文件
      const files = await readdir(championsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      console.log(`找到 ${jsonFiles.length} 个英雄数据文件`);

      const allExpressionData: SkillExpressionData[] = [];
      let processedChampions = 0;
      let skippedFiles = 0;
      let totalExpressions = 0;

      for (const file of jsonFiles) {
        const filePath = join(championsDir, file);

        try {
          console.log(`处理文件: ${file}`);
          const fileContent = await readFile(filePath, 'utf-8');
          const championData: ChampionCnData = JSON.parse(fileContent);

          const expressionData = extractSkillExpressions(championData);
          allExpressionData.push(...expressionData);

          const expressionCount = expressionData.reduce(
            (sum, data) => sum + data.expressions.length,
            0
          );
          totalExpressions += expressionCount;

          processedChampions++;
          console.log(
            `  - 提取到 ${expressionData.length} 个技能，共 ${expressionCount} 个表达式`
          );
        } catch (error) {
          console.warn(`跳过文件 ${file}: ${error}`);
          skippedFiles++;
        }
      }

      // 保存结果
      const jsonContent = options.pretty
        ? JSON.stringify(allExpressionData, null, 2)
        : JSON.stringify(allExpressionData);

      await writeFile(outputFilePath, jsonContent, 'utf-8');

      console.log('\n提取完成!');
      console.log(`实际使用版本: ${majorVersion}`);
      console.log(`处理英雄数量: ${processedChampions}`);
      console.log(`跳过文件数量: ${skippedFiles}`);
      console.log(`提取技能数量: ${allExpressionData.length}`);
      console.log(`提取表达式总数: ${totalExpressions}`);
      console.log(`输出文件: ${outputFilePath}`);
    } catch (error) {
      console.error(
        '提取技能表达式失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
