import { ref, computed } from 'vue';
import { eventBus } from '@/lib/event-bus';
import { summonerService } from './service-manager';

export interface GameConnectionState {
  isConnected: boolean;
  lastCheckTime: number;
  error?: string;
}

/**
 * 游戏连接监控服务
 * 负责统一管理游戏客户端连接状态的检查，避免重复检查
 */
export class GameConnectionMonitor {
  private static instance: GameConnectionMonitor | null = null;

  // 连接状态
  private connectionState = ref<GameConnectionState>({
    isConnected: false,
    lastCheckTime: 0,
  });

  // 监控状态
  private isMonitoring = ref(false);
  private monitorTimer: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  // 配置
  private readonly CHECK_INTERVAL = 5000; // 5秒检查一次
  private readonly MIN_CHECK_INTERVAL = 3000; // 最小检查间隔2秒

  // 使用全局服务实例

  // 订阅者列表
  private subscribers = new Set<(state: GameConnectionState) => void>();

  private constructor() {
    this.setupEventListeners();
  }

  // 单例模式
  public static getInstance(): GameConnectionMonitor {
    if (!GameConnectionMonitor.instance) {
      GameConnectionMonitor.instance = new GameConnectionMonitor();
    }
    return GameConnectionMonitor.instance;
  }

  // 计算属性
  public get isConnected() {
    return computed(() => this.connectionState.value.isConnected);
  }

  public get state() {
    return computed(() => this.connectionState.value);
  }

  public get monitoring() {
    return computed(() => this.isMonitoring.value);
  }

  // 订阅连接状态变化
  public subscribe(callback: (state: GameConnectionState) => void): () => void {
    this.subscribers.add(callback);

    // 立即通知当前状态
    callback(this.connectionState.value);

    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // 通知所有订阅者
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.connectionState.value);
      } catch (error) {
        console.error('通知连接状态订阅者失败:', error);
      }
    });
  }

  // 设置事件监听器
  private setupEventListeners() {
    // 监听应用焦点变化
    eventBus.on('app:focus', (hasFocus: boolean) => {
      if (hasFocus && this.isMonitoring.value) {
        // 应用重新获得焦点时，立即检查一次连接状态
        this.debouncedCheckConnection();
      }
    });
  }

  // 开始监控
  public startMonitoring(): void {
    if (this.isMonitoring.value) {
      console.log('游戏连接监控已在进行中，跳过重复启动');
      return;
    }

    console.log('开始游戏连接监控');
    this.isMonitoring.value = true;

    // 设置定时器
    this.monitorTimer = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL);

    // 立即执行一次检查
    this.debouncedCheckConnection();

    // 发送监控开始事件
    eventBus.emit('monitoring:start');
  }

  // 停止监控
  public stopMonitoring(): void {
    if (!this.isMonitoring.value) {
      return;
    }

    console.log('停止游戏连接监控');

    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isMonitoring.value = false;

    // 发送监控停止事件
    eventBus.emit('monitoring:stop');
  }

  // 防抖检查连接状态
  private debouncedCheckConnection(): void {
    const now = Date.now();
    const timeSinceLastCheck = now - this.connectionState.value.lastCheckTime;

    // 如果距离上次检查不足最小间隔，则延迟执行
    if (timeSinceLastCheck < this.MIN_CHECK_INTERVAL) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      const delay = this.MIN_CHECK_INTERVAL - timeSinceLastCheck;
      console.log(`防抖延迟 ${delay}ms 后执行连接状态检查`);

      this.debounceTimer = setTimeout(() => {
        this.checkConnection();
      }, delay);
      return;
    }

    // 立即执行检查
    this.checkConnection();
  }

  // 检查连接状态
  private async checkConnection(): Promise<void> {
    const now = Date.now();

    try {
      console.log('执行游戏连接状态检查...');

      const isConnected = await summonerService.isConnected();
      const previousState = this.connectionState.value.isConnected;

      // 更新连接状态
      this.connectionState.value = {
        isConnected,
        lastCheckTime: now,
        error: undefined,
      };

      // 如果连接状态发生变化，记录日志
      if (previousState !== isConnected) {
        console.log(
          `游戏连接状态变化: ${previousState ? '已连接' : '未连接'} -> ${isConnected ? '已连接' : '未连接'}`
        );
      }

      // 通知订阅者
      this.notifySubscribers();
    } catch (error: any) {
      console.error('检查游戏连接状态失败:', error);

      // 更新错误状态
      this.connectionState.value = {
        isConnected: false,
        lastCheckTime: now,
        error: error.message || '检查连接状态失败',
      };

      // 通知订阅者
      this.notifySubscribers();
    }
  }

  // 手动检查连接状态（供外部调用）
  public async checkConnectionNow(): Promise<boolean> {
    await this.checkConnection();
    return this.connectionState.value.isConnected;
  }

  // 销毁实例（清理资源）
  public destroy(): void {
    this.stopMonitoring();
    this.subscribers.clear();
    eventBus.off('app:focus');
    GameConnectionMonitor.instance = null;
  }
}

// 导出单例实例
export const gameConnectionMonitor = GameConnectionMonitor.getInstance();
