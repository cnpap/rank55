import { Command } from 'commander';
import { resolve, join, extname } from 'path';
import { readdir, readFile, stat } from 'fs/promises';
import { Upload } from '@aws-sdk/lib-storage';
import { envConfig } from '@/env';
import { s3Client } from '@/lib/cloud-storage';

interface UploadHtmlOptions {
  htmlDir?: string;
  bucket?: string;
  prefix?: string;
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
 * 获取文件的 MIME 类型
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * 上传文件到 S3 (带进度显示)
 */
async function uploadFileToS3(
  filePath: string,
  key: string,
  bucketName: string
): Promise<void> {
  try {
    const fileContent = await readFile(filePath);
    const fileSize = fileContent.length;
    const mimeType = getMimeType(filePath);

    console.log(`开始上传: ${key} (${formatBytes(fileSize)})`);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
        ACL: 'public-read',
        // 为 HTML 文件设置缓存控制
        CacheControl: key.endsWith('.html')
          ? 'no-cache'
          : 'public, max-age=31536000',
      },
    });

    // 监听上传进度
    upload.on('httpUploadProgress', progress => {
      if (progress.loaded && progress.total) {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        const loaded = formatBytes(progress.loaded);
        const total = formatBytes(progress.total);

        // 使用 \r 来覆盖当前行，实现进度条效果
        process.stdout.write(
          `\r  📤 ${key}: ${percentage}% (${loaded}/${total})`
        );
      }
    });

    await upload.done();

    // 上传完成后换行并显示成功消息
    console.log(`\n  ✓ 上传成功: ${key}`);
  } catch (error) {
    console.log(''); // 确保错误信息在新行显示
    throw new Error(
      `上传文件失败 ${key}: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 递归获取目录中的所有文件
 */
async function getAllFiles(
  dir: string,
  baseDir: string = dir
): Promise<string[]> {
  const files: string[] = [];
  const items = await readdir(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const itemStat = await stat(fullPath);

    if (itemStat.isDirectory()) {
      // 递归处理子目录
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      // 添加文件的相对路径
      const relativePath = fullPath.replace(baseDir, '').replace(/^[\\\/]/, '');
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * upload-html 命令实现
 */
export const uploadHtmlCommand = new Command('upload-html')
  .description('上传 HTML 网站文件到 S3 存储')
  .option('-d, --html-dir <path>', '指定 HTML 文件目录', 'html')
  .option(
    '-b, --bucket <bucket>',
    '指定 S3 存储桶名称（可选，默认使用环境变量）'
  )
  .option(
    '-p, --prefix <prefix>',
    '指定上传路径前缀（可选，默认直接上传到根目录）',
    ''
  )
  .action(async (options: UploadHtmlOptions) => {
    try {
      console.log('开始上传 HTML 网站文件到 S3...');

      // 构建 HTML 目录路径
      const htmlDir = resolve(options.htmlDir || 'html');
      console.log(`HTML 目录: ${htmlDir}`);

      // 检查 HTML 目录是否存在
      try {
        await stat(htmlDir);
      } catch {
        throw new Error(`HTML 目录不存在: ${htmlDir}`);
      }

      // 递归获取所有文件
      const allFiles = await getAllFiles(htmlDir);

      if (allFiles.length === 0) {
        throw new Error('HTML 目录中没有找到可上传的文件');
      }

      console.log(`找到 ${allFiles.length} 个文件需要上传:`);

      // 显示文件列表和大小
      for (const file of allFiles) {
        const filePath = join(htmlDir, file);
        const fileStat = await stat(filePath);
        console.log(`  - ${file} (${formatBytes(fileStat.size)})`);
      }

      // 获取存储桶名称，优先使用命令行参数，然后是环境变量
      let bucketName: string;
      try {
        bucketName = options.bucket || envConfig.aws.storageBucket();
      } catch {
        throw new Error(
          '未配置存储桶名称，请在 .env 文件中设置 STORAGE_BUCKET_NAME 或使用 -b 参数指定'
        );
      }

      const prefix = options.prefix || '';
      console.log(`存储桶: ${bucketName}`);
      if (prefix) {
        console.log(`上传前缀: ${prefix}`);
      } else {
        console.log('直接上传到根目录');
      }
      console.log(''); // 空行分隔

      // 逐个上传文件（串行上传以避免进度显示混乱）
      for (const file of allFiles) {
        const filePath = join(htmlDir, file);
        // 将 Windows 路径分隔符转换为 URL 路径分隔符
        const normalizedFile = file.replace(/\\/g, '/');
        const key = prefix ? `${prefix}/${normalizedFile}` : normalizedFile;
        await uploadFileToS3(filePath, key, bucketName);
      }

      console.log('\n🎉 上传完成!');
      if (prefix) {
        console.log(`网站访问地址: https://lol.opss.dev/${prefix}/index.html`);
        console.log(`所有文件都已上传到: https://lol.opss.dev/${prefix}/`);
      } else {
        console.log(`网站访问地址: https://lol.opss.dev/index.html`);
        console.log(`所有文件都已上传到: https://lol.opss.dev/`);
      }
    } catch (error) {
      console.error(
        '上传 HTML 文件失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
