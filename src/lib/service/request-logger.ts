/**
 * 请求日志管理器
 * 负责处理所有请求日志相关功能
 */
export class RequestLogger {
  private static requestSequence: number = 0;
  private static readonly LOG_DIR = 'logs/requests';
  private static readonly SUMMARY_LOG_PATH = 'logs/requests-summary.log';

  /**
   * 获取下一个请求序号
   */
  static async getNextSequence(): Promise<number> {
    // 只在 Node.js 环境中执行文件操作
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
      const fs = await import('fs/promises');
      if (RequestLogger.requestSequence === 0) {
        // 初始化序号，检查日志文件夹
        try {
          // 确保日志目录存在
          await fs.mkdir(RequestLogger.LOG_DIR, { recursive: true });

          const fileUtil = await import('../../utils/file-utils');
          // 检查是否有现有的日志文件
          if (await fileUtil.fileExists(RequestLogger.LOG_DIR)) {
            const files = await fs.readdir(RequestLogger.LOG_DIR);
            const logFiles = files.filter(file => file.match(/^\d{8}\.log$/));

            if (logFiles.length > 0) {
              // 找到最大的序号
              const maxSequence = Math.max(
                ...logFiles.map(file => parseInt(file.substring(0, 8), 10))
              );
              RequestLogger.requestSequence = maxSequence + 1;
            } else {
              // 没有日志文件，从1开始
              RequestLogger.requestSequence = 1;
            }
          } else {
            RequestLogger.requestSequence = 1;
          }
        } catch (error) {
          console.error('初始化请求序号失败:', error);
          RequestLogger.requestSequence = 1;
        }
      } else {
        RequestLogger.requestSequence++;
      }
    }

    return RequestLogger.requestSequence;
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
  static async logSummary(
    sequence: number,
    method: string,
    endpoint: string
  ): Promise<void> {
    // 只在 Node.js 环境中执行文件操作
    if (typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      // 确保日志目录存在
      await fs.mkdir(RequestLogger.LOG_DIR, { recursive: true });

      const now = new Date();
      const timeStr = RequestLogger.formatDateTime(now);
      const sequenceStr = sequence.toString().padStart(8, '0');

      // 格式：时间 YYYY-MM-DD 时-分-秒 序号 method url
      const logLine = `${timeStr} ${sequenceStr} ${method} ${endpoint}\n`;

      // 追加到汇总日志文件
      await fs.appendFile(RequestLogger.SUMMARY_LOG_PATH, logLine, 'utf-8');
    } catch (error) {
      console.warn('Failed to log summary:', error);
    }
  }

  /**
   * 记录详细请求日志
   */
  static async logRequest(
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
      await fs.mkdir(RequestLogger.LOG_DIR, { recursive: true });

      // 生成8位序号文件名
      const sequenceStr = sequence.toString().padStart(8, '0');
      const logFileName = `${sequenceStr}.log`;
      const logFilePath = `${RequestLogger.LOG_DIR}/${logFileName}`;

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
}
