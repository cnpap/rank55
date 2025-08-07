import { LCUClientInterface } from '../client/interface';

/**
 * 基础服务类
 * 提供统一的 LCU 请求方法和连接状态检查
 */
export abstract class BaseService {
  protected client?: LCUClientInterface;

  constructor(client?: LCUClientInterface) {
    this.client = client;
  }

  /**
   * 统一的请求方法，自动选择调用方式
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param body 请求体（可选）
   * @returns Promise<any>
   */
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<any> {
    if (this.client) {
      // 使用传入的 LCUClient（测试环境）
      switch (method) {
        case 'GET':
          return this.client.get(endpoint);
        case 'POST':
          return this.client.post(endpoint, body);
        case 'PATCH':
          return this.client.patch(endpoint, body);
        case 'PUT':
          return this.client.put(endpoint, body);
        case 'DELETE':
          return this.client.delete(endpoint);
        default:
          throw new Error(`不支持的 HTTP 方法: ${method}`);
      }
    } else {
      // 使用 electronAPI（前端环境）
      if (
        typeof window !== 'undefined' &&
        window.electronAPI &&
        window.electronAPI.lcuRequest
      ) {
        return window.electronAPI.lcuRequest(method, endpoint, body);
      } else {
        throw new Error('无法找到可用的 LCU 客户端连接方式');
      }
    }
  }

  /**
   * 检查连接状态
   * @returns Promise<boolean>
   */
  async isConnected(): Promise<boolean> {
    try {
      if (this.client) {
        return this.client.isConnected();
      } else {
        if (
          typeof window !== 'undefined' &&
          window.electronAPI &&
          window.electronAPI.lcuIsConnected
        ) {
          return window.electronAPI.lcuIsConnected();
        }
        return false;
      }
    } catch {
      return false;
    }
  }
}
