import { LCUClientInterface } from '../client/interface';

/**
 * 基础服务类
 * 提供统一的 LCU 请求方法和连接状态检查
 */
export abstract class BaseService {
  protected client?: LCUClientInterface;
  private static requestSequence: number = 0;
  private static readonly LOG_DIR = 'logs/requests';
  private static readonly SUMMARY_LOG_PATH = 'logs/requests-summary.log';

  constructor(client?: LCUClientInterface) {
    this.client = client;
  }

  /**
   * 获取下一个请求序号
   */
  private static async getNextSequence(): Promise<number> {
    // 只在 Node.js 环境中执行文件操作
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      const fs = await import('fs/promises');
      if (BaseService.requestSequence === 0) {
        // 初始化序号，检查日志文件夹
        try {
          // 确保日志目录存在
          await fs.mkdir(BaseService.LOG_DIR, { recursive: true });

          const fileUtil = await import('../../utils/file-utils');
          // 检查是否有现有的日志文件
          if (await fileUtil.fileExists(BaseService.LOG_DIR)) {
            const files = await fs.readdir(BaseService.LOG_DIR);
            const logFiles = files.filter(file => file.match(/^\d{8}\.log$/));

            if (logFiles.length > 0) {
              // 找到最大的序号
              const maxSequence = Math.max(
                ...logFiles.map(file => parseInt(file.substring(0, 8), 10))
              );
              BaseService.requestSequence = maxSequence + 1;
            } else {
              // 没有日志文件，从1开始
              BaseService.requestSequence = 1;
            }
          } else {
            BaseService.requestSequence = 1;
          }
        } catch (error) {
          console.error('初始化请求序号失败:', error);
          BaseService.requestSequence = 1;
        }
      } else {
        BaseService.requestSequence++;
      }
    }

    return BaseService.requestSequence;
  }

  /**
   * 格式化时间为 YYYY-MM-DD HH-mm-ss 格式
   */
  private static formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
  }

  /**
   * 记录汇总日志
   */
  private static async logSummary(
    sequence: number,
    method: string,
    endpoint: string
  ): Promise<void> {
    // 只在 Node.js 环境中执行文件操作
    if (typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      // 确保日志目录存在
      await fs.mkdir(BaseService.LOG_DIR, { recursive: true });

      const now = new Date();
      const timeStr = BaseService.formatDateTime(now);
      const sequenceStr = sequence.toString().padStart(8, '0');

      // 格式：时间 YYYY-MM-DD 时-分-秒 序号 method url
      const logLine = `${timeStr} ${sequenceStr} ${method} ${endpoint}\n`;

      // 追加到汇总日志文件
      await fs.appendFile(BaseService.SUMMARY_LOG_PATH, logLine, 'utf-8');
    } catch (error) {
      console.warn('Failed to log summary:', error);
    }
  }

  /**
   * 记录详细请求日志
   */
  private static async logRequest(
    sequence: number,
    method: string,
    endpoint: string,
    response?: any,
    contentType?: string,
    statusCode?: number
  ): Promise<void> {
    // 只在 Node.js 环境中执行文件操作
    if (typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      // 确保日志目录存在
      await fs.mkdir(BaseService.LOG_DIR, { recursive: true });

      // 生成8位序号文件名
      const sequenceStr = sequence.toString().padStart(8, '0');
      const logFileName = `${sequenceStr}.log`;
      const logFilePath = `${BaseService.LOG_DIR}/${logFileName}`;

      // 生成日志内容
      const logContent = {
        sequence: sequenceStr,
        method,
        url: endpoint,
        timestamp: new Date().toISOString(),
        statusCode: statusCode,
        contentType: contentType,
        response: response,
      };

      // 写入详细日志文件
      await fs.writeFile(
        logFilePath,
        JSON.stringify(logContent, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn('Failed to log request:', error);
    }
  }

  /**
   * 统一的请求方法，自动选择调用方式
   * @param method HTTP 方法
   * @param endpoint API 端点
   * @param body 请求体（可选）
   * @returns Promise<any>
   */
  protected async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    if (this.client) {
      // 使用传入的 LCUClient（测试环境）
      let response: any;
      let sequence: number;

      try {
        // 获取序号
        sequence = await BaseService.getNextSequence();

        // 记录汇总日志（在请求前记录）
        await BaseService.logSummary(sequence, method, endpoint);

        // 执行请求
        switch (method) {
          case 'GET':
            response = await this.client.get(endpoint);
            break;
          case 'POST':
            response = await this.client.post(endpoint, body);
            break;
          case 'PATCH':
            response = await this.client.patch(endpoint, body);
            break;
          case 'PUT':
            response = await this.client.put(endpoint, body);
            break;
          case 'DELETE':
            response = await this.client.delete(endpoint);
            break;
          default:
            throw new Error(`不支持的 HTTP 方法: ${method}`);
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
        await BaseService.logRequest(
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
          await BaseService.logRequest(
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
