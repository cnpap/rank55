import { LCUClientInterface } from '../client/interface';
import { DebounceCache } from './debounce-cache';

/**
 * 连接状态服务
 * 负责检查 LCU 客户端连接状态
 */
export class ConnectionService {
  private client?: LCUClientInterface;

  constructor(client?: LCUClientInterface) {
    this.client = client;
  }

  /**
   * 检查连接状态（带防抖优化）
   * @returns Promise<boolean>
   */
  async isConnected(): Promise<boolean> {
    try {
      let isConnected = false;
      console.log('检查连接状态...');

      if (this.client) {
        isConnected = await this.client.isConnected();
      } else {
        if (
          typeof window !== 'undefined' &&
          window.electronAPI &&
          window.electronAPI.lcuIsConnected
        ) {
          console.log('调用 Electron API 检查连接状态');
          isConnected = await window.electronAPI.lcuIsConnected();
        }
      }
      console.log(`连接状态: ${isConnected}`);
      return isConnected;
    } catch {
      return false;
    }
  }
}
