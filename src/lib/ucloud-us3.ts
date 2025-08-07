import { ucloudService } from './cloud-storage';
import type { SignedUrlOptions, DownloadUrlOptions } from './cloud-storage';

// 重新导出接口以保持向后兼容
export interface GenerateSignedUrlOptions extends SignedUrlOptions {}
export interface GenerateSignedDownloadUrlOptions extends DownloadUrlOptions {}

/**
 * @description 生成UCloud US3预签名上传URL
 */
export const generateUcloudSignedUploadUrl =
  ucloudService.generateSignedUploadUrl.bind(ucloudService);

/**
 * @description 生成UCloud US3预签名下载URL
 */
export const generateUcloudSignedDownloadUrl =
  ucloudService.generateSignedDownloadUrl.bind(ucloudService);

/**
 * @description 生成UCloud US3公共访问URL（无需签名）
 */
export const generateUcloudPublicUrl =
  ucloudService.generatePublicUrl.bind(ucloudService);
