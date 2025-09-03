/**
 * 请求队列管理器
 * 负责处理请求队列和限流功能
 */
export class RequestQueue {
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessingQueue: boolean = false;
  private static lastRequestTime: number = 0;
  private static readonly MIN_REQUEST_INTERVAL = 100; // 最小请求间隔 100ms

  /**
   * 处理请求队列
   */
  private static async processQueue(): Promise<void> {
    if (
      RequestQueue.isProcessingQueue ||
      RequestQueue.requestQueue.length === 0
    ) {
      return;
    }

    RequestQueue.isProcessingQueue = true;

    while (RequestQueue.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - RequestQueue.lastRequestTime;

      // 如果距离上次请求时间不足最小间隔，则等待
      if (timeSinceLastRequest < RequestQueue.MIN_REQUEST_INTERVAL) {
        const waitTime =
          RequestQueue.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const requestHandler = RequestQueue.requestQueue.shift();
      if (requestHandler) {
        try {
          await requestHandler();
        } catch (error) {
          // 错误会在 requestHandler 内部处理，这里只是确保队列继续处理
          console.error('Queue request failed:', error);
        }
        RequestQueue.lastRequestTime = Date.now();
      }
    }

    RequestQueue.isProcessingQueue = false;
  }

  /**
   * 将请求添加到队列
   */
  static addToQueue<T>(requestHandler: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedHandler = async () => {
        try {
          const result = await requestHandler();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      RequestQueue.requestQueue.push(wrappedHandler);
      RequestQueue.processQueue();
    });
  }

  /**
   * 获取当前队列长度
   */
  static getQueueLength(): number {
    return RequestQueue.requestQueue.length;
  }

  /**
   * 清空队列
   */
  static clearQueue(): void {
    RequestQueue.requestQueue = [];
    RequestQueue.isProcessingQueue = false;
  }

  /**
   * 获取队列状态
   */
  static getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    lastRequestTime: number;
  } {
    return {
      queueLength: RequestQueue.requestQueue.length,
      isProcessing: RequestQueue.isProcessingQueue,
      lastRequestTime: RequestQueue.lastRequestTime,
    };
  }
}
