// 云存储提供商类型
export type CloudProvider = 'aliyun' | 'cloudflare' | 'ucloud';

// S3 客户端配置接口
export interface S3ClientConfig {
  region: string;
  endpoint: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  forcePathStyle?: boolean;
}

// 签名 URL 选项
export interface SignedUrlOptions {
  bucketName: string;
  objectKey: string;
  expiration?: number;
  maxSize?: number;
  acl?: 'private' | 'public-read';
}

// 下载 URL 选项
export interface DownloadUrlOptions {
  bucketName: string;
  objectKey: string;
  expiration?: number;
}

// 云存储服务接口
export interface CloudStorageService {
  generateSignedUploadUrl(options: SignedUrlOptions): Promise<string>;
  generateSignedDownloadUrl(options: DownloadUrlOptions): Promise<string>;
  generatePublicUrl(bucketName: string, objectKey: string): string;
}
