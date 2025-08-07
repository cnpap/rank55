import { Command } from 'commander';
import { resolve, join, relative, extname } from 'path';
import { readdir, readFile, stat, writeFile, access } from 'fs/promises';
import { Upload } from '@aws-sdk/lib-storage';
import { envConfig } from '@/env';
import { ucloudUs3Client } from '@/lib/cloud-storage';

interface UploadOptions {
  sourceDir?: string;
  bucket?: string;
  prefix?: string;
  dryRun?: boolean;
  concurrency?: number;
  resume?: boolean;
}

interface FolderProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: string[];
  lastCompletedIndex: number;
}

interface UploadProgress {
  folders: Record<string, FolderProgress>;
  globalStartTime: number;
  lastUpdateTime: number;
  totalFiles: number;
  totalCompletedFiles: number;
}

interface FileInfo {
  filePath: string;
  key: string;
  size: number;
  index: number;
  folder: string;
  folderIndex: number;
}

/**
 * 格式化文件大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取进度日志文件路径
 */
function getProgressLogPath(sourceDir: string): string {
  return join(sourceDir, '.upload-progress.json');
}

/**
 * 读取上传进度
 */
async function loadProgress(sourceDir: string): Promise<UploadProgress | null> {
  try {
    const progressPath = getProgressLogPath(sourceDir);
    await access(progressPath);
    const content = await readFile(progressPath, 'utf-8');
    const data = JSON.parse(content);

    // 兼容旧版本进度文件
    if (data.folders) {
      return data as UploadProgress;
    } else {
      // 转换旧格式到新格式
      return null; // 旧格式不兼容，重新开始
    }
  } catch {
    return null;
  }
}

/**
 * 保存上传进度
 */
async function saveProgress(
  sourceDir: string,
  progress: UploadProgress
): Promise<void> {
  try {
    const progressPath = getProgressLogPath(sourceDir);
    progress.lastUpdateTime = Date.now();
    await writeFile(progressPath, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.warn(
      '保存进度失败:',
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

/**
 * 递归获取目录下的所有文件
 */
async function getAllFiles(
  dirPath: string,
  baseDir: string
): Promise<string[]> {
  const files: string[] = [];
  const items = await readdir(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);
    const itemStat = await stat(fullPath);

    if (itemStat.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      // 只处理图片文件和 JSON 文件，跳过进度日志文件
      const ext = extname(item).toLowerCase();
      if (
        ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.json'].includes(
          ext
        ) &&
        item !== '.upload-progress.json'
      ) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * 带重试的上传单个文件到s3
 */
async function uploadFileToS3WithRetry(
  fileInfo: FileInfo,
  bucketName: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileContent = await readFile(fileInfo.filePath);
      const fileSize = fileContent.length;

      if (attempt === 1) {
        console.log(
          `[${fileInfo.folder}] 开始上传: ${fileInfo.key} (${formatBytes(fileSize)})`
        );
      } else {
        console.log(
          `[${fileInfo.folder}] 重试上传 (${attempt}/${maxRetries}): ${fileInfo.key}`
        );
      }

      const upload = new Upload({
        client: ucloudUs3Client,
        params: {
          Bucket: bucketName,
          Key: fileInfo.key,
          Body: fileContent,
          ACL: 'public-read',
        },
      });

      // 监听上传进度
      upload.on('httpUploadProgress', progress => {
        if (progress.loaded && progress.total) {
          const percentage = Math.round(
            (progress.loaded / progress.total) * 100
          );
          const loaded = formatBytes(progress.loaded);
          const total = formatBytes(progress.total);

          // 使用 \r 来覆盖当前行，实现进度条效果
          process.stdout.write(
            `\r  📤 [${fileInfo.folder}] ${fileInfo.key}: ${percentage}% (${loaded}/${total})`
          );
        }
      });

      await upload.done();

      // 上传完成后换行并显示成功消息
      console.log(`\n  ✓ [${fileInfo.folder}] 上传成功: ${fileInfo.key}`);
      return; // 成功上传，退出重试循环
    } catch (error) {
      console.log(''); // 确保错误信息在新行显示
      lastError = error instanceof Error ? error : new Error('未知错误');

      if (attempt < maxRetries) {
        console.log(
          `  ❌ [${fileInfo.folder}] 上传失败 (${attempt}/${maxRetries}): ${fileInfo.key} - ${lastError.message}`
        );
        console.log(`  ⏳ 等待 ${attempt * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      } else {
        console.log(
          `  ❌ [${fileInfo.folder}] 上传最终失败: ${fileInfo.key} - ${lastError.message}`
        );
      }
    }
  }

  // 所有重试都失败了
  throw new Error(
    `上传文件失败 ${fileInfo.key}: ${lastError?.message || '未知错误'}`
  );
}

/**
 * 并发上传文件（支持断点续传和按文件夹分离计数）
 */
async function uploadFilesWithConcurrency(
  files: FileInfo[],
  bucketName: string,
  sourceDir: string,
  concurrency: number,
  existingProgress?: UploadProgress
): Promise<void> {
  // 初始化进度
  const progress: UploadProgress = existingProgress || {
    folders: {},
    globalStartTime: Date.now(),
    lastUpdateTime: Date.now(),
    totalFiles: files.length,
    totalCompletedFiles: 0,
  };

  // 按文件夹分组文件
  const folderGroups: Record<string, FileInfo[]> = {};
  for (const file of files) {
    if (!folderGroups[file.folder]) {
      folderGroups[file.folder] = [];
    }
    folderGroups[file.folder].push(file);
  }

  // 初始化文件夹进度
  for (const [folder, folderFiles] of Object.entries(folderGroups)) {
    if (!progress.folders[folder]) {
      progress.folders[folder] = {
        totalFiles: folderFiles.length,
        completedFiles: 0,
        failedFiles: [],
        lastCompletedIndex: -1,
      };
    }
  }

  // 过滤出需要上传的文件（跳过已完成的）
  const pendingFiles: FileInfo[] = [];
  for (const file of files) {
    const folderProgress = progress.folders[file.folder];
    if (file.folderIndex > folderProgress.lastCompletedIndex) {
      pendingFiles.push(file);
    }
  }

  if (pendingFiles.length === 0) {
    console.log('\n✅ 所有文件已经上传完成！');
    return;
  }

  console.log(`\n开始并发上传 (并发数: ${concurrency})...`);
  console.log(`待上传文件: ${pendingFiles.length} 个`);

  // 显示各文件夹进度
  console.log('\n📊 各文件夹进度:');
  for (const [folder, folderProgress] of Object.entries(progress.folders)) {
    console.log(
      `  - ${folder}: ${folderProgress.completedFiles}/${folderProgress.totalFiles} 完成`
    );
  }
  console.log('');

  // 并发上传 - 使用更高效的并发控制
  let completedCount = 0;
  let lastSaveTime = Date.now();
  const semaphore = new Array(concurrency).fill(null);

  const uploadTasks = pendingFiles.map(async file => {
    // 等待获取并发槽位
    await new Promise<void>(resolve => {
      const tryAcquire = () => {
        const index = semaphore.findIndex(slot => slot === null);
        if (index !== -1) {
          semaphore[index] = file;
          resolve();
        } else {
          setTimeout(tryAcquire, 10);
        }
      };
      tryAcquire();
    });

    try {
      await uploadFileToS3WithRetry(file, bucketName);

      // 更新进度
      const folderProgress = progress.folders[file.folder];
      folderProgress.completedFiles++;
      folderProgress.lastCompletedIndex = file.folderIndex;
      progress.totalCompletedFiles++;
      completedCount++;

      // 显示进度
      console.log(
        `\n📈 [${file.folder}] 进度: ${folderProgress.completedFiles}/${folderProgress.totalFiles} | 总进度: ${progress.totalCompletedFiles}/${progress.totalFiles}`
      );

      // 定期保存进度
      const now = Date.now();
      if (now - lastSaveTime > 5000) {
        // 每5秒保存一次
        await saveProgress(sourceDir, progress);
        lastSaveTime = now;
      }
    } catch (error) {
      const folderProgress = progress.folders[file.folder];
      folderProgress.failedFiles.push(file.key);
      await saveProgress(sourceDir, progress);

      throw new Error(
        `[${file.folder}] 文件上传失败: ${file.key}\n错误: ${error instanceof Error ? error.message : '未知错误'}`
      );
    } finally {
      // 释放并发槽位
      const index = semaphore.findIndex(slot => slot === file);
      if (index !== -1) {
        semaphore[index] = null;
      }
    }
  });

  await Promise.all(uploadTasks);

  // 保存最终进度
  await saveProgress(sourceDir, progress);
}

/**
 * upload-images 命令实现
 */
export const uploadImagesCommand = new Command('upload-s3')
  .description('上传静态资源文件夹下的图片和数据文件到s3存储的指定目录')
  .option('-s, --source-dir <path>', '指定源文件目录', 's3')
  .option('-p, --prefix <path>', '指定上传前缀路径', 'static')
  .option(
    '-b, --bucket <n>',
    '指定S3存储桶名称（可选，默认使用环境变量）',
    'rank55'
  )
  .option('--dry-run', '预览模式，只显示将要上传的文件，不实际上传')
  .option('-c, --concurrency <number>', '并发上传数量', '10')
  .option('--resume', '从上次中断的位置继续上传')
  .action(async (options: UploadOptions) => {
    try {
      console.log('开始上传静态资源文件到S3...');

      // 构建源目录路径
      const sourceDir = resolve(options.sourceDir || 's3');
      console.log(`源目录: ${sourceDir}`);

      // 获取上传前缀
      const uploadPrefix = options.prefix || 'static';
      console.log(`上传前缀: ${uploadPrefix}`);

      // 检查源目录是否存在
      try {
        await stat(sourceDir);
      } catch {
        throw new Error(`源目录不存在: ${sourceDir}`);
      }

      // 获取存储桶名称
      let bucketName: string;
      try {
        bucketName = options.bucket || envConfig.ucloud.us3.bucket();
      } catch {
        throw new Error(
          '未配置存储桶名称，请在 .env 文件中设置 UCLOUD_US3_BUCKET 或使用 -b 参数指定'
        );
      }

      console.log(`存储桶: ${bucketName}`);

      // 检查是否有之前的上传进度
      const existingProgress = await loadProgress(sourceDir);
      if (existingProgress && options.resume) {
        console.log(`\n📋 发现之前的上传进度:`);
        console.log(`   总文件数: ${existingProgress.totalFiles}`);
        console.log(`   已完成: ${existingProgress.totalCompletedFiles}`);
        console.log(
          `   上次更新: ${new Date(existingProgress.lastUpdateTime).toLocaleString()}`
        );

        console.log('\n📊 各文件夹进度:');
        for (const [folder, folderProgress] of Object.entries(
          existingProgress.folders
        )) {
          const failedCount = folderProgress.failedFiles.length;
          console.log(
            `   - ${folder}: ${folderProgress.completedFiles}/${folderProgress.totalFiles} 完成${failedCount > 0 ? `, ${failedCount} 个失败` : ''}`
          );
        }
      } else if (existingProgress && !options.resume) {
        console.log(
          `\n⚠️  发现之前的上传进度，使用 --resume 参数可以从上次位置继续`
        );
      }

      // 递归获取所有文件
      console.log('扫描文件...');
      const allFiles = await getAllFiles(sourceDir, sourceDir);

      if (allFiles.length === 0) {
        console.log('没有找到可上传的文件');
        return;
      }

      // 计算总大小并创建文件信息（按文件夹分组）
      let totalSize = 0;
      const fileInfos: FileInfo[] = [];
      const folderGroups: Record<string, string[]> = {};

      // 先按文件夹分组
      for (const filePath of allFiles) {
        const relativePath = relative(sourceDir, filePath);
        const folder = relativePath.split(/[/\\]/)[0]; // 获取第一级文件夹名

        if (!folderGroups[folder]) {
          folderGroups[folder] = [];
        }
        folderGroups[folder].push(filePath);
      }

      // 为每个文件夹内的文件分配索引
      let globalIndex = 0;
      for (const [folder, folderFiles] of Object.entries(folderGroups)) {
        for (
          let folderIndex = 0;
          folderIndex < folderFiles.length;
          folderIndex++
        ) {
          const filePath = folderFiles[folderIndex];
          const fileStat = await stat(filePath);
          const relativePath = relative(sourceDir, filePath);
          const key = `${uploadPrefix}/${relativePath.replace(/\\/g, '/')}`;

          fileInfos.push({
            filePath,
            key,
            size: fileStat.size,
            index: globalIndex++,
            folder,
            folderIndex,
          });

          totalSize += fileStat.size;
        }
      }

      console.log(
        `\n找到 ${fileInfos.length} 个文件，总大小: ${formatBytes(totalSize)}`
      );

      // 按文件夹显示文件统计
      const dirStats: Record<string, { count: number; size: number }> = {};

      for (const { folder, size } of fileInfos) {
        if (!dirStats[folder]) {
          dirStats[folder] = { count: 0, size: 0 };
        }
        dirStats[folder].count++;
        dirStats[folder].size += size;
      }

      console.log('\n📁 文件夹分布:');
      for (const [folder, stats] of Object.entries(dirStats)) {
        console.log(
          `  - ${folder}: ${stats.count} 个文件 (${formatBytes(stats.size)})`
        );
      }

      // 预览模式
      if (options.dryRun) {
        console.log('\n预览模式 - 将要上传的文件:');
        for (const [folder, stats] of Object.entries(dirStats)) {
          console.log(`\n📁 ${folder}:`);
          const folderFiles = fileInfos
            .filter(f => f.folder === folder)
            .slice(0, 5);
          for (const { key, size } of folderFiles) {
            console.log(`    ${key} (${formatBytes(size)})`);
          }
          if (stats.count > 5) {
            console.log(`    ... 还有 ${stats.count - 5} 个文件`);
          }
        }
        console.log('\n使用不带 --dry-run 参数开始实际上传');
        return;
      }

      // 确认上传
      console.log('\n准备开始上传...');
      const concurrency = Number(options.concurrency || '10');
      console.log(`并发数: ${concurrency}`);
      console.log(''); // 空行分隔

      // 开始上传
      const startTime = Date.now();

      await uploadFilesWithConcurrency(
        fileInfos,
        bucketName,
        sourceDir,
        concurrency,
        options.resume ? existingProgress || undefined : undefined
      );

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const baseUrl = `https://${envConfig.endpoint()}`;

      console.log('\n🎉 上传完成!');
      console.log(`总文件数: ${fileInfos.length}`);
      console.log(`总大小: ${formatBytes(totalSize)}`);
      console.log(`耗时: ${duration.toFixed(2)} 秒`);
      console.log(`平均速度: ${formatBytes(totalSize / duration)}/s`);
      console.log(`访问地址: ${baseUrl}/${uploadPrefix}/`);

      // 显示各文件夹完成情况
      console.log('\n📊 各文件夹完成情况:');
      for (const [folder, stats] of Object.entries(dirStats)) {
        console.log(`  ✅ ${folder}: ${stats.count} 个文件`);
      }

      // 清理进度文件
      try {
        const progressPath = getProgressLogPath(sourceDir);
        await access(progressPath);
        console.log('\n🧹 清理进度文件...');
      } catch {
        // 进度文件不存在，无需清理
      }
    } catch (error) {
      console.error(
        '\n❌ 上传静态资源文件失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
