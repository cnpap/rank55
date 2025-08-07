#!/usr/bin/env node

import { Command } from 'commander';
import { generateTinyCommand } from './commands/generate-tiny';
import { archiveItemsCommand } from './commands/archive-items';
import { downloadItemImagesCommand } from './commands/download-item-images';
import { downloadChampionAvatarsCommand } from './commands/download-champion-avatars';
import { downloadRankIconsCommand } from './commands/download-rank-icons';
import { downloadProfileIconsCommand } from './commands/download-profile-icons';
import { archiveChampionsCommand } from './commands/archive-champions';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { archiveChampionCnDataCommand } from './commands/archive-champion-cn-data';
import { archiveChampionDetailsCommand } from './commands/archive-champion-details';
import { extractSkillDescriptionsCommand } from './commands/extract-skill-descriptions';
import { extractSkillExpressionsCommand } from './commands/extract-skill-expressions';
import { extractAllExpressionsCommand } from './commands/extract-all-expressions';
import { uploadReleaseCommand } from './commands/upload-release';
import { uploadImagesCommand } from './commands/upload-s3';
import { uploadHtmlCommand } from './commands/upload-html';
import { cancelUploadsCommand } from './commands/cancel-uploads';
import { uploadSingleFileCommand } from './commands/upload-single-file';

// 读取package.json获取版本信息
async function getVersion(): Promise<string> {
  try {
    const packagePath = resolve(process.cwd(), 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function main() {
  const version = await getVersion();

  const program = new Command();

  program
    .name('lol-frontend-cli')
    .description('LOL 前端数据处理 CLI 工具')
    .version(version);

  // 添加全局选项
  program.option('-d, --dir <directory>', '指定数据存储的基础目录');

  // 注册命令
  program.addCommand(generateTinyCommand);
  program.addCommand(archiveItemsCommand);
  program.addCommand(downloadItemImagesCommand);
  program.addCommand(downloadChampionAvatarsCommand);
  program.addCommand(downloadRankIconsCommand);
  program.addCommand(downloadProfileIconsCommand);
  program.addCommand(archiveChampionsCommand);
  program.addCommand(archiveChampionDetailsCommand);
  program.addCommand(archiveChampionCnDataCommand);
  program.addCommand(extractSkillDescriptionsCommand);
  program.addCommand(extractSkillExpressionsCommand);
  program.addCommand(extractAllExpressionsCommand);
  program.addCommand(uploadReleaseCommand);
  program.addCommand(uploadImagesCommand);
  program.addCommand(uploadHtmlCommand);
  program.addCommand(uploadSingleFileCommand);
  program.addCommand(cancelUploadsCommand);

  // 解析命令行参数
  await program.parseAsync(process.argv);
}

// 运行主函数
main().catch(error => {
  console.error('CLI 执行失败:', error.message);
  process.exit(1);
});
