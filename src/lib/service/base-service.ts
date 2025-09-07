import { LCUClientInterface, RequestOptions } from '../client/interface';
import { RequestLogger } from './request-logger';
import { RequestQueue } from './request-queue';
import { DebounceCache } from './debounce-cache';
import { connectionService } from './service-manager';

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
   * 通用的HTTP请求方法（抽象出来的核心逻辑）
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param options 请求选项
   * @param isRiotApi 是否为 Riot API 请求
   * @returns Promise<T>
   */
  protected async makeHttpRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions,
    isRiotApi: boolean = false
  ): Promise<T> {
    // 将请求添加到队列中
    return RequestQueue.addToQueue(async () => {
      if (this.client) {
        // 使用传入的 LCUClient（测试环境）
        let response: any;
        let sequence: number;

        try {
          // 获取序号
          sequence = await RequestLogger.getNextSequence();

          // 记录汇总日志（在请求前记录）
          await RequestLogger.logSummary(sequence, method, endpoint);

          // 根据 isRiotApi 选择调用方式
          if (isRiotApi) {
            response = await this.client.makeRiotRequest<T>(
              method,
              endpoint,
              options
            );
          } else {
            response = await this.client.makeRequest<T>(
              method,
              endpoint,
              options
            );
          }

          // 推断 Content-Type（基于响应内容）
          let contentType = 'application/json'; // 默认值
          let statusCode: number | undefined;

          // 检查响应类型并推断 Content-Type
          if (response === null || response === undefined) {
            contentType = 'application/json';
          } else if (typeof response === 'string') {
            contentType = 'text/plain';
          } else if (typeof response === 'object') {
            contentType = 'application/json';
          }

          // 如果响应包含元数据（未来扩展）
          if (
            response &&
            typeof response === 'object' &&
            response.hasOwnProperty('data') &&
            response.hasOwnProperty('headers')
          ) {
            contentType = response.headers?.['content-type'] || contentType;
            statusCode = response.statusCode;
            response = response.data;
          }

          // 记录详细日志
          await RequestLogger.logRequest(
            sequence,
            method,
            endpoint,
            response,
            contentType,
            statusCode
          );

          return response;
        } catch (error: any) {
          // 即使请求失败也要记录详细日志
          if (sequence!) {
            await RequestLogger.logRequest(
              sequence,
              method,
              endpoint,
              {
                error: error.message,
              },
              'application/json'
            );
          }
          throw error;
        }
      } else {
        // 使用 electronAPI（前端环境）
        if (
          typeof window !== 'undefined' &&
          window.electronAPI &&
          window.electronAPI.lcuRequest
        ) {
          if (isRiotApi) {
            return window.electronAPI.riotRequest(method, endpoint, options);
          } else {
            return window.electronAPI.lcuRequest(method, endpoint, options);
          }
          // 注意：这里可能需要扩展 electronAPI 以支持 riot request
          // 目前先使用现有的 lcuRequest，后续可能需要添加 riotRequest
        } else {
          throw new Error('无法找到可用的 LCU 客户端连接方式');
        }
      }
    });
  }

  /**
   * 统一的请求方法，自动选择调用方式
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param options 请求选项（包含 body、params、headers）
   * @returns Promise<any>
   */
  protected async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    return this.makeHttpRequest<T>(method, endpoint, options, false);
  }

  /**
   * Riot API 请求方法
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param options 请求选项（包含 body、params、headers）
   * @returns Promise<any>
   */
  protected async makeRiotRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    return this.makeHttpRequest<T>(method, endpoint, options, true);
  }

  /**
   * 通用防抖方法
   * @param key 防抖键值，用于区分不同的防抖请求
   * @param fn 要执行的异步函数
   * @param delay 防抖延迟时间（毫秒），默认1000ms
   * @returns Promise<T>
   */
  protected async debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> {
    return DebounceCache.debounce(key, fn, delay);
  }

  /**
   * 清除指定key的防抖缓存
   * @param key 防抖键值
   */
  protected clearDebounceCache(key: string): void {
    DebounceCache.clearDebounceCache(key);
  }

  /**
   * 清除所有防抖缓存
   */
  static clearAllDebounceCache(): void {
    DebounceCache.clearAllDebounceCache();
  }

  /**
   * 二进制请求方法
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param options 请求选项
   * @returns Promise<Buffer>
   */
  protected async makeBinaryRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ): Promise<Buffer> {
    if (this.client) {
      // 使用传入的 LCUClient（测试环境）
      let response: Buffer;
      let sequence: number;

      try {
        // 获取序号
        sequence = await RequestLogger.getNextSequence();

        // 调用二进制请求方法
        response = await this.client.makeBinaryRequest(
          method,
          endpoint,
          options
        );

        // 记录详细日志（对于二进制数据，只记录大小）
        await RequestLogger.logRequest(
          sequence,
          method,
          endpoint,
          {
            type: 'binary',
            size: response.length,
            preview: response.slice(0, 16).toString('hex'),
          },
          'application/octet-stream'
        );

        return response;
      } catch (error: any) {
        // 即使请求失败也要记录详细日志
        if (sequence!) {
          await RequestLogger.logRequest(
            sequence,
            method,
            endpoint,
            {
              error: error.message,
            },
            'application/octet-stream'
          );
        }
        throw error;
      }
    } else {
      // 使用 electronAPI（前端环境）
      if (
        typeof window !== 'undefined' &&
        window.electronAPI &&
        window.electronAPI.lcuBinaryRequest
      ) {
        return window.electronAPI.lcuBinaryRequest(method, endpoint, options);
      } else {
        throw new Error('无法找到可用的 LCU 客户端连接方式（二进制请求）');
      }
    }
  }
}
