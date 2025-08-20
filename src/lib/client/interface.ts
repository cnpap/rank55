// LCU客户端接口定义
export interface LCUClientInterface {
  makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ): Promise<T>;
  makeRiotRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ): Promise<T>;
  isConnected(): Promise<boolean>;
  // 新增：获取客户端凭据信息
  getCredentials(): {
    port: number;
    token: string;
    region?: string;
    rsoPlatformId?: string;
    locale?: string;
    serverHost?: string;
  };
}

// 请求选项接口
export interface RequestOptions {
  body?: any;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}
