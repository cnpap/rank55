import { S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '@/env';
import type { CloudProvider, S3ClientConfig } from './types';

// S3 客户端缓存
const clientCache = new Map<CloudProvider, S3Client>();

/**
 * 获取云存储提供商的配置
 */
function getProviderConfig(provider: CloudProvider): S3ClientConfig {
  switch (provider) {
    case 'aliyun':
      return {
        region: envConfig.aliyun.oss.region(),
        endpoint: `https://${envConfig.aliyun.oss.endpoint()}`,
        credentials: {
          accessKeyId: envConfig.aliyun.accessKeyId(),
          secretAccessKey: envConfig.aliyun.accessKeySecret(),
        },
        forcePathStyle: false, // 阿里云OSS使用虚拟主机样式
      };

    case 'cloudflare':
      return {
        region: envConfig.aws.region(),
        endpoint: `https://${envConfig.cloudflare.accountId()}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: envConfig.cloudflare.accessKey(),
          secretAccessKey: envConfig.cloudflare.secretKey(),
        },
      };

    case 'ucloud':
      return {
        region: envConfig.ucloud.us3.region(),
        endpoint: `https://${envConfig.ucloud.us3.endpoint()}`,
        credentials: {
          accessKeyId: envConfig.ucloud.publicKey(),
          secretAccessKey: envConfig.ucloud.privateKey(),
        },
        forcePathStyle: true, // UCloud US3 使用路径样式
      };
    case 'ucloud-domain':
      return {
        region: 's3-hk',
        endpoint: `https://s3-hk.ufileos.com`,
        credentials: {
          accessKeyId: envConfig.ucloud.publicKey(),
          secretAccessKey: envConfig.ucloud.privateKey(),
        },
        forcePathStyle: true, // UCloud US3 使用路径样式
      };
    default:
      throw new Error(`不支持的云存储提供商: ${provider}`);
  }
}

/**
 * 创建或获取 S3 客户端实例
 */
export function getS3Client(provider: CloudProvider): S3Client {
  // 从缓存中获取客户端
  if (clientCache.has(provider)) {
    return clientCache.get(provider)!;
  }

  // 创建新的客户端
  const config = getProviderConfig(provider);
  const client = new S3Client(config);

  // 缓存客户端
  clientCache.set(provider, client);

  return client;
}

/**
 * 清除客户端缓存
 */
export function clearClientCache(): void {
  clientCache.clear();
}
