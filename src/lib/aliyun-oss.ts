import { aliyunOssService } from './cloud-storage';
import type { SignedUrlOptions, DownloadUrlOptions } from './cloud-storage';

// 重新导出接口以保持向后兼容
export interface GenerateSignedUrlOptions extends SignedUrlOptions {}
export interface GenerateSignedDownloadUrlOptions extends DownloadUrlOptions {}

/**
 * @description 生成阿里云OSS预签名上传URL
 */
export const generateAliyunSignedUploadUrl =
  aliyunOssService.generateSignedUploadUrl.bind(aliyunOssService);

/**
 * @description 生成阿里云OSS预签名下载URL
 */
export const generateAliyunSignedDownloadUrl =
  aliyunOssService.generateSignedDownloadUrl.bind(aliyunOssService);

/**
 * @description 生成阿里云OSS公共访问URL（无需签名）
 */
export const generateAliyunPublicUrl =
  aliyunOssService.generatePublicUrl.bind(aliyunOssService);
