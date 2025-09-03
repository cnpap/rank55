/**
 * 连接状态管理器
 * 负责处理连接状态缓存功能
 */
export class ConnectionManager {
  private static connectionCache: {
    isConnected: boolean;
    lastChecked: number;
    readonly CACHE_DURATION: number;
  } = {
    isConnected: false,
    lastChecked: 0,
    CACHE_DURATION: 5000, // 5秒缓存时间
  };

  /**
   * 获取缓存的连接状态
   * @returns 连接状态信息
   */
  static getCachedConnectionStatus(): {
    isConnected: boolean;
    lastChecked: number;
    isExpired: boolean;
  } {
    const now = Date.now();
    const isExpired =
      now - ConnectionManager.connectionCache.lastChecked >
      ConnectionManager.connectionCache.CACHE_DURATION;

    return {
      isConnected: ConnectionManager.connectionCache.isConnected,
      lastChecked: ConnectionManager.connectionCache.lastChecked,
      isExpired,
    };
  }

  /**
   * 更新连接状态缓存
   * @param isConnected 连接状态
   */
  static updateConnectionCache(isConnected: boolean): void {
    const now = Date.now();
    ConnectionManager.connectionCache.isConnected = isConnected;
    ConnectionManager.connectionCache.lastChecked = now;
  }

  /**
   * 手动清除连接状态缓存
   */
  static clearConnectionCache(): void {
    ConnectionManager.connectionCache.lastChecked = 0;
    ConnectionManager.connectionCache.isConnected = false;
  }

  /**
   * 检查缓存是否过期
   * @returns 是否过期
   */
  static isCacheExpired(): boolean {
    const now = Date.now();
    return (
      now - ConnectionManager.connectionCache.lastChecked >
      ConnectionManager.connectionCache.CACHE_DURATION
    );
  }

  /**
   * 获取缓存持续时间配置
   * @returns 缓存持续时间（毫秒）
   */
  static getCacheDuration(): number {
    return ConnectionManager.connectionCache.CACHE_DURATION;
  }

  /**
   * 获取连接状态统计信息
   */
  static getConnectionStats(): {
    isConnected: boolean;
    lastChecked: number;
    cacheAge: number;
    isExpired: boolean;
    cacheDuration: number;
  } {
    const now = Date.now();
    const cacheAge = now - ConnectionManager.connectionCache.lastChecked;
    const isExpired =
      cacheAge > ConnectionManager.connectionCache.CACHE_DURATION;

    return {
      isConnected: ConnectionManager.connectionCache.isConnected,
      lastChecked: ConnectionManager.connectionCache.lastChecked,
      cacheAge,
      isExpired,
      cacheDuration: ConnectionManager.connectionCache.CACHE_DURATION,
    };
  }
}
