import { Command } from 'commander';
import {
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
  ListMultipartUploadsCommandOutput,
} from '@aws-sdk/client-s3';
import { envConfig } from '@/env';
import { s3Client } from '@/lib/cloud-storage';

interface CancelOptions {
  bucket?: string;
  prefix?: string;
  all?: boolean;
}

/**
 * 列出所有未完成的多部分上传
 */
async function listIncompleteUploads(bucketName: string, prefix?: string) {
  try {
    const command = new ListMultipartUploadsCommand({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response: ListMultipartUploadsCommandOutput =
      await s3Client.send(command);
    return response.Uploads || [];
  } catch (error) {
    throw new Error(
      `获取未完成上传列表失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 取消单个多部分上传
 */
async function abortMultipartUpload(
  bucketName: string,
  key: string,
  uploadId: string
) {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
    console.log(`✓ 已取消上传: ${key} (Upload ID: ${uploadId})`);
  } catch (error) {
    console.error(
      `✗ 取消上传失败 ${key}: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 格式化上传开始时间
 */
function formatDate(date?: Date): string {
  if (!date) return '未知时间';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const cancelUploadsCommand = new Command('cancel-uploads')
  .description('取消未完成的多部分上传')
  .option('-b, --bucket <name>', '指定存储桶名称（可选，默认使用环境变量）')
  .option('-p, --prefix <prefix>', '只取消指定前缀的上传')
  .option('-a, --all', '取消所有未完成的上传（不询问确认）')
  .action(async (options: CancelOptions) => {
    try {
      console.log('正在查找未完成的多部分上传...');

      // 获取存储桶名称
      let bucketName: string;
      try {
        bucketName = options.bucket || envConfig.aws.storageBucket();
      } catch {
        throw new Error(
          '未配置存储桶名称，请在 .env 文件中设置 STORAGE_BUCKET_NAME 或使用 -b 参数指定'
        );
      }

      console.log(`存储桶: ${bucketName}`);
      if (options.prefix) {
        console.log(`前缀过滤: ${options.prefix}`);
      }

      // 获取未完成的上传列表
      const incompleteUploads = await listIncompleteUploads(
        bucketName,
        options.prefix
      );

      if (incompleteUploads.length === 0) {
        console.log('✓ 没有找到未完成的多部分上传');
        return;
      }

      console.log(`\n找到 ${incompleteUploads.length} 个未完成的上传:`);
      console.log('─'.repeat(80));

      // 显示未完成的上传列表
      incompleteUploads.forEach((upload, index) => {
        console.log(`${index + 1}. 文件: ${upload.Key}`);
        console.log(`   Upload ID: ${upload.UploadId}`);
        console.log(`   开始时间: ${formatDate(upload.Initiated)}`);
        console.log(`   存储类型: ${upload.StorageClass || '标准'}`);
        console.log('');
      });

      // 如果没有 --all 参数，询问用户确认
      if (!options.all) {
        console.log('是否要取消所有这些未完成的上传？');
        console.log('注意：取消后这些上传将无法恢复，需要重新开始上传。');
        console.log('');
        console.log('请输入 "yes" 确认取消，或按 Enter 键退出:');

        // 简单的确认机制（在实际使用中可能需要更好的交互方式）
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>(resolve => {
          rl.question('', (answer: string) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
          });
        });

        if (answer !== 'yes' && answer !== 'y') {
          console.log('操作已取消');
          return;
        }
      }

      console.log('\n开始取消未完成的上传...');
      console.log('─'.repeat(50));

      // 取消所有未完成的上传
      let successCount = 0;
      let failCount = 0;

      for (const upload of incompleteUploads) {
        if (upload.Key && upload.UploadId) {
          try {
            await abortMultipartUpload(bucketName, upload.Key, upload.UploadId);
            successCount++;
          } catch {
            failCount++;
          }
        }
      }

      console.log('\n操作完成!');
      console.log(`✓ 成功取消: ${successCount} 个上传`);
      if (failCount > 0) {
        console.log(`✗ 取消失败: ${failCount} 个上传`);
      }
    } catch (error) {
      console.error(
        '取消上传失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
