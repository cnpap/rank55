import { getS3Client } from './client-factory';
import { getCloudStorageService } from './service';

// 导出类型
export type {
  CloudProvider,
  S3ClientConfig,
  SignedUrlOptions,
  DownloadUrlOptions,
  CloudStorageService,
} from './types';

// 导出工厂函数
export { getS3Client, clearClientCache } from './client-factory';
export { getCloudStorageService } from './service';

// 导出便捷的服务实例
export const aliyunOssService = getCloudStorageService('aliyun');
export const cloudflareService = getCloudStorageService('cloudflare');
export const ucloudService = getCloudStorageService('ucloud');

// 导出客户端实例（保持向后兼容）
export const aliyunOssClient = getS3Client('aliyun');
export const s3Client = getS3Client('cloudflare');
export const ucloudUs3Client = getS3Client('ucloud');
