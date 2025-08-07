import { Command } from 'commander';
import { resolve, join } from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists } from '../../src/utils/file-utils';
import type { ChampionCnData } from '@/types/champion-cn';
import { getMajorVersion } from '@/utils/version';

/**
 * 从单个英雄数据中提取技能描述
 */
function extractSkillDescriptions(championData: ChampionCnData): string[] {
  const descriptions: string[] = [];

  if (!championData.spells || !Array.isArray(championData.spells)) {
    return descriptions;
  }

  for (const spell of championData.spells) {
    if (spell.description && spell.description.trim()) {
      descriptions.push(spell.description);
    }
  }

  return descriptions;
}

/**
 * extract-skill-descriptions 命令实现
 */
export const extractSkillDescriptionsCommand = new Command(
  'extract-skill-descriptions'
)
  .description('提取所有英雄的技能描述信息')
  .option('-v, --version <version>', '指定版本号（可选，默认使用最新版本）')
  .option(
    '-o, --output <path>',
    '指定输出文件路径（可选，默认为 skill-descriptions.json）'
  )
  .option('--pretty', '格式化输出JSON（便于阅读）')
  .action(async (options, command) => {
    try {
      console.log('开始提取英雄技能描述信息...');

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
      const outputFileName = options.output || 'skill-descriptions.json';
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

      const allSkillDescriptions: string[] = [];
      let processedChampions = 0;
      let skippedFiles = 0;

      for (const file of jsonFiles) {
        const filePath = join(championsDir, file);

        try {
          console.log(`处理文件: ${file}`);
          const fileContent = await readFile(filePath, 'utf-8');
          const championData: ChampionCnData = JSON.parse(fileContent);

          const skillDescriptions = extractSkillDescriptions(championData);
          allSkillDescriptions.push(...skillDescriptions);

          processedChampions++;
          console.log(`  - 提取到 ${skillDescriptions.length} 个技能描述`);
        } catch (error) {
          console.warn(`跳过文件 ${file}: ${error}`);
          skippedFiles++;
        }
      }

      // 保存结果 - 只输出技能描述字符串数组
      const jsonContent = options.pretty
        ? JSON.stringify(allSkillDescriptions, null, 2)
        : JSON.stringify(allSkillDescriptions);

      await writeFile(outputFilePath, jsonContent, 'utf-8');

      console.log('\n提取完成!');
      console.log(`实际使用版本: ${majorVersion}`);
      console.log(`处理英雄数量: ${processedChampions}`);
      console.log(`跳过文件数量: ${skippedFiles}`);
      console.log(`提取技能数量: ${allSkillDescriptions.length}`);
      console.log(`输出文件: ${outputFilePath}`);
    } catch (error) {
      console.error(
        '提取技能描述失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
