/**
 * 防抖缓存管理器
 * 负责处理防抖和缓存功能
 */
export class DebounceCache {
  private static debounceCache: Map<
    string,
    {
      promise: Promise<any>;
      timestamp: number;
      timeout: NodeJS.Timeout | number;
    }
  > = new Map();

  /**
   * 通用防抖方法
   * @param key 防抖键值，用于区分不同的防抖请求
   * @param fn 要执行的异步函数
   * @param delay 防抖延迟时间（毫秒），默认1000ms
   * @returns Promise<T>
   */
  static async debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> {
    const now = Date.now();
    const cached = DebounceCache.debounceCache.get(key);

    // 如果存在缓存且在防抖时间内，返回缓存的Promise
    if (cached && now - cached.timestamp < delay) {
      return cached.promise;
    }

    // 清除之前的定时器
    if (cached?.timeout) {
      if (typeof cached.timeout === 'number') {
        clearTimeout(cached.timeout);
      } else {
        clearTimeout(cached.timeout);
      }
    }

    // 创建新的Promise
    const promise = fn();

    // 设置清理定时器
    const timeout = setTimeout(() => {
      DebounceCache.debounceCache.delete(key);
    }, delay);

    // 缓存Promise和相关信息
    DebounceCache.debounceCache.set(key, {
      promise,
      timestamp: now,
      timeout,
    });

    // 处理Promise完成后的清理
    promise.finally(() => {
      // 延迟清理，确保在防抖时间内的后续调用能够复用结果
      setTimeout(() => {
        const current = DebounceCache.debounceCache.get(key);
        if (current && current.promise === promise) {
          DebounceCache.debounceCache.delete(key);
        }
      }, delay);
    });

    return promise;
  }

  /**
   * 清除指定key的防抖缓存
   * @param key 防抖键值
   */
  static clearDebounceCache(key: string): void {
    const cached = DebounceCache.debounceCache.get(key);
    if (cached?.timeout) {
      if (typeof cached.timeout === 'number') {
        clearTimeout(cached.timeout);
      } else {
        clearTimeout(cached.timeout);
      }
    }
    DebounceCache.debounceCache.delete(key);
  }

  /**
   * 清除所有防抖缓存
   */
  static clearAllDebounceCache(): void {
    DebounceCache.debounceCache.forEach(cached => {
      if (cached.timeout) {
        if (typeof cached.timeout === 'number') {
          clearTimeout(cached.timeout);
        } else {
          clearTimeout(cached.timeout);
        }
      }
    });
    DebounceCache.debounceCache.clear();
  }

  /**
   * 获取缓存状态
   */
  static getCacheStatus(): {
    cacheSize: number;
    keys: string[];
  } {
    return {
      cacheSize: DebounceCache.debounceCache.size,
      keys: Array.from(DebounceCache.debounceCache.keys()),
    };
  }

  /**
   * 检查指定key是否存在缓存
   */
  static hasCache(key: string): boolean {
    return DebounceCache.debounceCache.has(key);
  }
}
