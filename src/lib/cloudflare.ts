import { cloudflareService } from './cloud-storage';
import type { SignedUrlOptions, DownloadUrlOptions } from './cloud-storage';

// 重新导出接口以保持向后兼容
export interface GenerateSignedUrlOptions extends SignedUrlOptions {}
export interface GenerateSignedDownloadUrlOptions extends DownloadUrlOptions {}

/**
 * @description 生成预签名 URL
 */
export const generateSignedUploadUrl =
  cloudflareService.generateSignedUploadUrl.bind(cloudflareService);

/**
 * @description 生成预签名下载 URL
 */
export const generateSignedDownloadUrl =
  cloudflareService.generateSignedDownloadUrl.bind(cloudflareService);
