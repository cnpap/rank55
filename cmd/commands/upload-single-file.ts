import { Command } from 'commander';
import { resolve, basename, extname } from 'path';
import { readFile, stat } from 'fs/promises';
import { Upload } from '@aws-sdk/lib-storage';
import { envConfig } from '@/env';
import { ucloudUs3Client } from '@/lib/cloud-storage';

interface SingleFileUploadOptions {
  file: string;
  key?: string;
  bucket?: string;
  dryRun?: boolean;
  maxRetries?: number;
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
 * 上传单个文件到S3
 */
async function uploadSingleFileToS3(
  filePath: string,
  s3Key: string,
  bucketName: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileContent = await readFile(filePath);
      const fileSize = fileContent.length;

      if (attempt === 1) {
        console.log(`开始上传: ${s3Key} (${formatBytes(fileSize)})`);
      } else {
        console.log(`重试上传 (${attempt}/${maxRetries}): ${s3Key}`);
      }

      const upload = new Upload({
        client: ucloudUs3Client,
        params: {
          Bucket: bucketName,
          Key: s3Key,
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
            `\r📤 上传进度: ${percentage}% (${loaded}/${total})`
          );
        }
      });

      await upload.done();

      // 上传完成后换行并显示成功消息
      console.log(`\n✅ 上传成功: ${s3Key}`);
      return; // 成功上传，退出重试循环
    } catch (error) {
      console.log(''); // 确保错误信息在新行显示
      lastError = error instanceof Error ? error : new Error('未知错误');

      if (attempt < maxRetries) {
        console.log(
          `❌ 上传失败 (${attempt}/${maxRetries}): ${s3Key} - ${lastError.message}`
        );
        console.log(`⏳ 等待 ${attempt * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      } else {
        console.log(`❌ 上传最终失败: ${s3Key} - ${lastError.message}`);
      }
    }
  }

  // 所有重试都失败了
  throw new Error(`上传文件失败 ${s3Key}: ${lastError?.message || '未知错误'}`);
}

/**
 * upload-single-file 命令实现
 */
export const uploadSingleFileCommand = new Command('upload-single-file')
  .description('上传单个文件到S3存储')
  .requiredOption('-f, --file <path>', '指定要上传的文件路径')
  .option('-k, --key <path>', '指定S3中的文件路径（可选，默认使用文件名）')
  .option('-b, --bucket <name>', '指定S3存储桶名称（可选，默认使用环境变量）')
  .option('--dry-run', '预览模式，只显示将要上传的信息，不实际上传')
  .option('--max-retries <number>', '最大重试次数', '3')
  .action(async (options: SingleFileUploadOptions) => {
    try {
      console.log('开始上传单个文件到S3...');

      // 解析文件路径
      const filePath = resolve(options.file);
      console.log(`文件路径: ${filePath}`);

      // 检查文件是否存在
      let fileStat;
      try {
        fileStat = await stat(filePath);
        if (!fileStat.isFile()) {
          throw new Error('指定的路径不是一个文件');
        }
      } catch (error) {
        throw new Error(`文件不存在或无法访问: ${filePath}`);
      }

      // 确定S3 Key
      const s3Key = options.key || basename(filePath);
      console.log(`S3 Key: ${s3Key}`);

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

      // 显示文件信息
      const fileSize = fileStat.size;
      const fileExt = extname(filePath).toLowerCase();

      console.log(`文件大小: ${formatBytes(fileSize)}`);
      console.log(`文件类型: ${fileExt || '无扩展名'}`);

      // 预览模式
      if (options.dryRun) {
        console.log('\n📋 预览模式 - 上传信息:');
        console.log(`  源文件: ${filePath}`);
        console.log(`  目标路径: ${s3Key}`);
        console.log(`  存储桶: ${bucketName}`);
        console.log(`  文件大小: ${formatBytes(fileSize)}`);

        const baseUrl = `https://${envConfig.endpoint()}`;
        console.log(`  访问地址: ${baseUrl}/${s3Key}`);
        console.log('\n使用不带 --dry-run 参数开始实际上传');
        return;
      }

      // 确认上传信息
      console.log('\n准备开始上传...');
      const maxRetries = Number(options.maxRetries || '3');
      console.log(`最大重试次数: ${maxRetries}`);
      console.log(''); // 空行分隔

      // 开始上传
      const startTime = Date.now();

      await uploadSingleFileToS3(filePath, s3Key, bucketName, maxRetries);

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const baseUrl = `https://${envConfig.endpoint()}`;

      console.log('\n🎉 上传完成!');
      console.log(`文件: ${basename(filePath)}`);
      console.log(`大小: ${formatBytes(fileSize)}`);
      console.log(`耗时: ${duration.toFixed(2)} 秒`);
      console.log(`平均速度: ${formatBytes(fileSize / duration)}/s`);
      console.log(`访问地址: ${baseUrl}/${s3Key}`);
    } catch (error) {
      console.error(
        '\n❌ 上传文件失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
