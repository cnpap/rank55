import { Command } from 'commander';
import { resolve, join } from 'path';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { Upload } from '@aws-sdk/lib-storage';
import { envConfig } from '@/env';
import { ucloudDomainClient, ucloudUs3Client } from '@/lib/cloud-storage';
import { generateUcloudPublicUrl } from '@/lib/ucloud-us3';

interface UploadOptions {
  version?: string;
  releaseDir?: string;
  bucket?: string;
}

/**
 * 获取当前版本号
 */
async function getCurrentVersion(): Promise<string> {
  try {
    const packagePath = resolve(process.cwd(), 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version || '0.0.0';
  } catch (error) {
    throw new Error(
      `获取版本号失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
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
 * 上传文件到 UCloud US3 (带进度显示)
 */
async function uploadFile(
  filePath: string,
  key: string,
  bucketName: string,
  isVersionFile: boolean = false
): Promise<void> {
  try {
    const fileContent = await readFile(filePath);
    const fileSize = fileContent.length;

    console.log(`开始上传: ${key} (${formatBytes(fileSize)})`);

    // 根据文件类型选择不同的客户端
    const client = isVersionFile ? ucloudDomainClient : ucloudUs3Client;
    const bucket = isVersionFile ? 'rankpub' : bucketName;

    const upload = new Upload({
      client: client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ACL: 'public-read',
      },
      // 添加分片上传配置
      partSize: 1024 * 1024 * 8, // 10MB 分片大小
      queueSize: 1, // 减少并发数，避免冲突
      leavePartsOnError: false, // 出错时自动清理分片
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
 * 解析 YAML 文件并生成 JSON 文件
 */
async function generateJsonFromYaml(
  releaseDir: string,
  version: string,
  bucketName: string
): Promise<void> {
  try {
    const yamlPath = join(releaseDir, 'latest.yml');
    const jsonPath = join(releaseDir, 'latest.json');

    // 检查 latest.yml 是否存在
    try {
      await stat(yamlPath);
    } catch {
      console.log('未找到 latest.yml 文件，跳过 JSON 生成');
      return;
    }

    const yamlContent = await readFile(yamlPath, 'utf-8');

    // 简单的 YAML 解析（针对 Electron 的 latest.yml 格式）
    const lines = yamlContent.split('\n');
    const jsonData: any = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          // 移除引号
          const cleanValue = value.replace(/^["']|["']$/g, '');
          jsonData[key.trim()] = cleanValue;
        }
      }
    }

    // 构建完整的下载 URL - 使用阿里云OSS公共URL
    const fileName = jsonData.path || jsonData.url;
    const downloadUrl = fileName
      ? generateUcloudPublicUrl(bucketName, `downloads/v${version}/${fileName}`)
      : '';

    // 生成适合前端使用的 JSON 格式
    const frontendJson = {
      version: jsonData.version,
      updateUrl: downloadUrl,
      releaseDate: new Date().toISOString(),
      ...jsonData,
    };

    await writeFile(jsonPath, JSON.stringify(frontendJson, null, 2), 'utf-8');
    console.log('✓ 已生成 latest.json 文件');
  } catch (error) {
    console.warn(
      '生成 JSON 文件失败:',
      error instanceof Error ? error.message : '未知错误'
    );
  }
}

export const uploadReleaseCommand = new Command('upload-release')
  .description('上传 Electron 应用发布文件到阿里云OSS存储')
  .option(
    '-v, --version <version>',
    '指定版本号（可选，默认使用 package.json 中的版本）'
  )
  .option('-r, --release-dir <path>', '指定发布文件目录', 'release')
  .option(
    '-b, --bucket <name>',
    '指定 UCloud US3 存储桶名称（可选，默认使用环境变量）'
  )
  .action(async (options: UploadOptions) => {
    try {
      console.log('开始上传发布文件到 UCloud US3 ...');

      // 获取版本号
      const version = options.version || (await getCurrentVersion());
      console.log(`版本号: ${version}`);

      // 构建发布目录路径
      const releaseDir = resolve(options.releaseDir || 'release');
      console.log(`发布目录: ${releaseDir}`);

      // 检查发布目录是否存在
      try {
        await stat(releaseDir);
      } catch {
        throw new Error(`发布目录不存在: ${releaseDir}`);
      }

      // 获取存储桶名称，优先使用命令行参数，然后是环境变量
      let bucketName: string;
      try {
        bucketName = options.bucket || envConfig.ucloud.us3.bucket();
      } catch {
        throw new Error(
          '未配置 UCloud US3 存储桶名称，请在 .env 文件中设置 UCLOUD_US3_BUCKET_NAME 或使用 -b 参数指定'
        );
      }

      // 生成 JSON 文件（传入版本号和存储桶名称）
      await generateJsonFromYaml(releaseDir, version, bucketName);

      // 读取发布目录中的文件
      const files = await readdir(releaseDir);

      // 上传必要的文件：exe 文件、latest.yml、latest.json 和 blockmap 文件
      const releaseFiles = files.filter(
        file =>
          file.endsWith('.exe') ||
          file === 'latest.yml' ||
          file === 'latest.json' ||
          file.endsWith('.blockmap')
      );

      if (releaseFiles.length === 0) {
        throw new Error('发布目录中没有找到可上传的文件');
      }

      console.log(`找到 ${releaseFiles.length} 个文件需要上传:`);

      // 显示文件列表和大小
      for (const file of releaseFiles) {
        const filePath = join(releaseDir, file);
        const fileStat = await stat(filePath);
        console.log(`  - ${file} (${formatBytes(fileStat.size)})`);
      }

      console.log(`存储桶: ${bucketName}`);
      console.log(''); // 空行分隔

      // 将文件分为两组：普通文件和 latest 文件
      const normalFiles = releaseFiles.filter(
        file => !file.startsWith('latest.')
      );
      const latestFiles = releaseFiles.filter(file =>
        file.startsWith('latest.')
      );

      // 先上传普通文件（exe 和 blockmap 文件）
      for (const file of normalFiles) {
        const filePath = join(releaseDir, file);
        const key = `downloads/v${version}/${file}`;
        await uploadFile(filePath, key, bucketName, false); // 使用 ucloudUs3Client
      }

      // 最后上传 latest 文件（确保其他文件都已上传完成）
      for (const file of latestFiles) {
        const filePath = join(releaseDir, file);

        // latest 文件上传到两个位置
        // 1. 版本目录 - 修复：downloads目录中的文件应该使用ucloudUs3Client
        const versionKey = `downloads/v${version}/${file}`;
        await uploadFile(filePath, versionKey, bucketName, false); // 修改为false，使用ucloudUs3Client

        // 2. 根目录（用于自动更新检查）
        if (file === 'latest.yml') {
          // 对于根目录的 latest.yml，需要修改其中的路径为版本目录路径
          let yamlContent = await readFile(filePath, 'utf-8');

          // 修改 path 字段
          yamlContent = yamlContent.replace(
            /^path:\s*(.+)$/gm,
            (match, value) => {
              const cleanValue = value.trim().replace(/^["']|["']$/g, '');
              if (
                cleanValue.startsWith('http') ||
                cleanValue.includes('downloads/v')
              ) {
                return match;
              }
              return `path: https://rank55.cn-wlcb.ufileos.com/downloads/v${version}/${cleanValue}`;
            }
          );

          // 修改 files 数组中的 url 字段
          yamlContent = yamlContent.replace(
            /^(\s+)- url:\s*(.+)$/gm,
            (match, indent, value) => {
              const cleanValue = value.trim().replace(/^["']|["']$/g, '');
              if (
                cleanValue.startsWith('http') ||
                cleanValue.includes('downloads/v')
              ) {
                return match;
              }
              return `${indent}- url: https://rank55.cn-wlcb.ufileos.com/downloads/v${version}/${cleanValue}`;
            }
          );

          // 上传修改后的 latest.yml 到根目录
          const rootKey = file;
          const upload = new Upload({
            client: ucloudDomainClient, // 使用 ucloudDomainClient
            params: {
              Bucket: 'rankpub',
              Key: rootKey,
              Body: Buffer.from(yamlContent, 'utf-8'),
              ACL: 'public-read',
            },
          });
          await upload.done();
          console.log(`  ✓ 上传成功: ${rootKey} (已修改路径)`);
        } else {
          // 其他 latest 文件直接上传到根目录 - 修复：应该使用ucloudDomainClient和rankpub bucket
          const rootKey = file;
          await uploadFile(filePath, rootKey, 'rankpub', true); // 修改为true，使用ucloudDomainClient
        }
      }

      // 生成阿里云OSS的公共访问URL
      const ossEndpoint = envConfig.ucloud.us3.endpoint();
      const baseUrl = `https://${bucketName}.${ossEndpoint}`;

      console.log('\n🎉 上传完成!');
      console.log(`版本: ${version}`);
      console.log(`版本文件目录: ${baseUrl}/downloads/v${version}/`);
      console.log(`访问地址: ${baseUrl}/`);
      console.log(`更新检查文件: rank55.com/latest.yml`);
    } catch (error) {
      console.error(
        '上传发布文件失败:',
        error instanceof Error ? error.message : '未知错误'
      );
      process.exit(1);
    }
  });
