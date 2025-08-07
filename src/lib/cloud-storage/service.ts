import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from './client-factory';
import type {
  CloudProvider,
  CloudStorageService,
  SignedUrlOptions,
  DownloadUrlOptions,
} from './types';

/**
 * 通用云存储服务实现
 */
class CloudStorageServiceImpl implements CloudStorageService {
  constructor(private provider: CloudProvider) {}

  /**
   * 生成预签名上传 URL
   */
  async generateSignedUploadUrl(options: SignedUrlOptions): Promise<string> {
    const client = getS3Client(this.provider);

    const command = new PutObjectCommand({
      Bucket: options.bucketName,
      Key: options.objectKey,
      Metadata: {
        'x-amz-meta-max-size':
          options.maxSize?.toString() ?? (1024 * 1024).toString(),
      },
      ACL: options.acl ?? 'public-read',
    });

    return getSignedUrl(client, command, {
      expiresIn: options.expiration ?? 3600,
    });
  }

  /**
   * 生成预签名下载 URL
   */
  async generateSignedDownloadUrl(
    options: DownloadUrlOptions
  ): Promise<string> {
    const client = getS3Client(this.provider);

    const command = new GetObjectCommand({
      Bucket: options.bucketName,
      Key: options.objectKey,
    });

    return getSignedUrl(client, command, {
      expiresIn: options.expiration ?? 3600,
    });
  }

  /**
   * 生成公共访问 URL
   */
  generatePublicUrl(bucketName: string, objectKey: string): string {
    switch (this.provider) {
      case 'aliyun': {
        const endpoint =
          process.env.ALIYUN_OSS_ENDPOINT || 'oss-cn-chengdu.aliyuncs.com';
        return `https://${bucketName}.${endpoint}/${objectKey}`;
      }

      case 'cloudflare': {
        const domain = process.env.CLOUDFLARE_DOMAIN || 'app.com';
        return `https://${bucketName}.${domain}/${objectKey}`;
      }

      case 'ucloud': {
        const endpoint =
          process.env.UCLOUD_S3_ENDPOINT || 's3-cn-bj.ufileos.com';
        return `https://${bucketName}.${endpoint}/${objectKey}`;
      }

      default:
        throw new Error(`不支持的云存储提供商: ${this.provider}`);
    }
  }
}

// 服务实例缓存
const serviceCache = new Map<CloudProvider, CloudStorageService>();

/**
 * 获取云存储服务实例
 */
export function getCloudStorageService(
  provider: CloudProvider
): CloudStorageService {
  if (!serviceCache.has(provider)) {
    serviceCache.set(provider, new CloudStorageServiceImpl(provider));
  }
  return serviceCache.get(provider)!;
}
