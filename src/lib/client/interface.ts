// LCU客户端接口定义
export interface LCUClientInterface {
  get(endpoint: string): Promise<any>;
  post(endpoint: string, body?: any): Promise<any>;
  patch(endpoint: string, body?: any): Promise<any>;
  put(endpoint: string, body?: any): Promise<any>;
  delete(endpoint: string): Promise<any>;
  isConnected(): Promise<boolean>;
}
