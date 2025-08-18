// LCU凭据接口
export interface LCUCredentials {
  port: number;
  token: string;
  region?: string;
  rsoPlatformId?: string;
  locale?: string;
  serverHost?: string;
}
