import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SummonerService } from '@/lib/service/summoner-service';
import {
  gameConnectionMonitor,
  type GameConnectionState,
} from '@/lib/service/game-connection-monitor';
import { eventBus } from '@/lib/event-bus';
import type { SummonerData } from '@/types/summoner';

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<SummonerData | null>(null);
  const isLoadingUser = ref(false);
  const errorMessage = ref<string | null>(null);
  const isPolling = ref(false);
  const pollTimer = ref<NodeJS.Timeout | null>(null);

  // 智能监控状态
  const appHasFocus = ref(true);
  const isOnUserRelatedPage = ref(false);
  const shouldMonitor = computed(
    () => appHasFocus.value && isOnUserRelatedPage.value
  );

  // 防抖相关状态
  const debounceTimer = ref<NodeJS.Timeout | null>(null);
  const lastCheckTime = ref<number>(0);
  const MIN_CHECK_INTERVAL = 6000; // 最小检查间隔6秒

  // 服务实例
  const summonerService = new SummonerService();

  // 游戏连接状态订阅
  let connectionUnsubscribe: (() => void) | null = null;

  // 计算属性
  const isLoggedIn = computed(() => !!currentUser.value);
  const displayName = computed(() => {
    if (!currentUser.value) return '';
    return currentUser.value.displayName || currentUser.value.gameName || '';
  });
  const fullGameName = computed(() => {
    if (!currentUser.value) return '';
    if (currentUser.value.gameName && currentUser.value.tagLine) {
      return `${currentUser.value.gameName}#${currentUser.value.tagLine}`;
    }
    return displayName.value;
  });
  const profileIconId = computed(() => currentUser.value?.profileIconId || 0);
  const summonerLevel = computed(() => currentUser.value?.summonerLevel || 0);
  const hasError = computed(() => !!errorMessage.value);

  // 清空状态
  const clearState = () => {
    currentUser.value = null;
    errorMessage.value = null;
  };

  // 设置错误信息
  const setError = (error: string) => {
    errorMessage.value = error;
  };

  // 清空错误信息
  const clearError = () => {
    errorMessage.value = null;
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollTimer.value) {
      clearInterval(pollTimer.value);
      pollTimer.value = null;
    }
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
      debounceTimer.value = null;
    }
    isPolling.value = false;
  };

  // 防抖检查用户状态
  const debouncedCheckUserStatus = () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime.value;

    // 如果距离上次检查不足最小间隔，则延迟执行
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }

      const delay = MIN_CHECK_INTERVAL - timeSinceLastCheck;
      console.log(`防抖延迟 ${delay}ms 后执行用户状态检查`);

      debounceTimer.value = setTimeout(() => {
        checkUserStatus();
      }, delay);
      return;
    }

    // 立即执行检查
    checkUserStatus();
  };

  // 开始轮询
  const startPolling = () => {
    if (isPolling.value) {
      console.log('用户轮询已在进行中，跳过重复启动');
      return;
    }

    console.log('开始用户监控轮询');
    isPolling.value = true;

    // 设置定时器
    pollTimer.value = setInterval(async () => {
      await checkUserStatus();
    }, 8000); // 每8秒轮询一次

    // 使用防抖机制立即执行一次检查
    debouncedCheckUserStatus();

    // 发送用户监控开始事件
    eventBus.emit('user:monitoring:start');
  };

  // 智能监控控制
  const updateMonitoringState = () => {
    console.log(
      '更新用户监控状态 - 应用焦点:',
      appHasFocus.value,
      '相关页面:',
      isOnUserRelatedPage.value,
      '应该监控:',
      shouldMonitor.value,
      '当前轮询状态:',
      isPolling.value
    );

    if (shouldMonitor.value && !isPolling.value) {
      console.log('开始用户监控 - 应用有焦点且在相关页面');
      startPolling();
    } else if (!shouldMonitor.value && isPolling.value) {
      console.log('停止用户监控 - 应用失去焦点或离开相关页面');
      stopPolling();
      eventBus.emit('user:monitoring:stop');
    } else if (shouldMonitor.value && isPolling.value) {
      console.log('用户监控状态无变化，但触发防抖检查');
      debouncedCheckUserStatus();
    }
  };

  // 处理游戏连接状态变化
  const handleConnectionStateChange = (
    connectionState: GameConnectionState
  ) => {
    if (!connectionState.isConnected && isLoggedIn.value) {
      console.log('游戏连接断开，清空用户状态');
      clearState();
      setError('游戏客户端连接断开');
    } else if (
      connectionState.isConnected &&
      !isLoggedIn.value &&
      shouldMonitor.value
    ) {
      console.log('游戏重新连接，尝试获取用户信息');
      debouncedCheckUserStatus();
    }
  };

  // 设置事件监听器
  const setupEventListeners = () => {
    // 订阅游戏连接状态
    connectionUnsubscribe = gameConnectionMonitor.subscribe(
      handleConnectionStateChange
    );

    // 监听应用焦点变化
    eventBus.on('app:focus', hasFocus => {
      console.log('用户store - 应用焦点状态变化:', hasFocus);
      const previousFocus = appHasFocus.value;
      appHasFocus.value = hasFocus;

      if (previousFocus !== hasFocus) {
        console.log('用户store - 焦点状态发生实际变化，更新监控状态');
        updateMonitoringState();
      }
    });

    // 监听页面切换 - 用户相关页面包括首页、设置页等
    eventBus.on('page:change', pageName => {
      console.log('用户store - 页面切换事件:', pageName);
      const wasOnUserRelatedPage = isOnUserRelatedPage.value;
      // 用户信息在多个页面都需要，所以大部分页面都算相关页面
      isOnUserRelatedPage.value = [
        'Home',
        'Settings',
        'RoomManagement',
      ].includes(pageName);
      console.log('用户store - 是否在相关页面:', isOnUserRelatedPage.value);

      if (wasOnUserRelatedPage !== isOnUserRelatedPage.value) {
        console.log('用户store - 相关页面状态发生变化，更新监控状态');
        updateMonitoringState();
      }
    });
  };

  // 移除事件监听器
  const removeEventListeners = () => {
    if (connectionUnsubscribe) {
      connectionUnsubscribe();
      connectionUnsubscribe = null;
    }
    eventBus.off('app:focus');
    eventBus.off('page:change');
  };

  // 检查用户状态
  const checkUserStatus = async (): Promise<void> => {
    // 更新最后检查时间
    lastCheckTime.value = Date.now();

    try {
      console.log('执行用户状态检查...');

      // 直接检查连接状态，而不依赖监控器的缓存状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        if (isLoggedIn.value) {
          clearState();
          setError('无法连接到英雄联盟客户端');
        }
        return;
      }

      // 获取当前用户信息
      const userData = await summonerService.getCurrentSummoner();

      // 检查用户是否发生变化
      const userChanged =
        !currentUser.value ||
        currentUser.value.summonerId !== userData.summonerId ||
        currentUser.value.puuid !== userData.puuid;

      if (userChanged) {
        console.log('检测到用户变化，更新用户信息');
        currentUser.value = userData;
        clearError();
      }
    } catch (error: any) {
      console.error('检查用户状态失败:', error);
      if (isLoggedIn.value) {
        // 只有在之前有用户信息的情况下才设置错误，避免频繁错误提示
        setError(error.message || '检查用户状态失败');
      }
    }
  };

  // 获取当前用户信息（初始化用）
  const fetchCurrentUser = async (): Promise<void> => {
    if (isLoadingUser.value) return;

    isLoadingUser.value = true;
    clearError();

    try {
      // 直接检查连接状态，而不依赖监控器的缓存状态
      const isConnected = await summonerService.isConnected();
      if (!isConnected) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 获取当前召唤师信息
      const userData = await summonerService.getCurrentSummoner();
      currentUser.value = userData;

      console.log('成功获取当前用户信息:', {
        displayName: displayName.value,
        level: summonerLevel.value,
        summonerId: userData.summonerId,
      });
    } catch (error: any) {
      console.error('获取当前用户信息失败:', error);
      setError(error.message || '获取用户信息失败');
      clearState();
    } finally {
      isLoadingUser.value = false;
    }
  };

  // 刷新用户信息
  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  // 初始化用户信息（应用启动时调用）
  const initializeUser = async (): Promise<void> => {
    console.log('初始化用户信息...');

    // 确保游戏连接监控已启动
    if (!gameConnectionMonitor.monitoring.value) {
      gameConnectionMonitor.startMonitoring();
    }

    // 等待监控器完成初始检查
    await gameConnectionMonitor.checkConnectionNow();

    // 设置事件监听器
    setupEventListeners();

    // 获取用户信息
    await fetchCurrentUser();
  };

  return {
    // 状态
    currentUser,
    isLoadingUser,
    errorMessage,
    isPolling,
    appHasFocus,
    isOnUserRelatedPage,
    shouldMonitor,

    // 计算属性
    isLoggedIn,
    displayName,
    fullGameName,
    profileIconId,
    summonerLevel,
    hasError,

    // 方法
    clearState,
    setError,
    clearError,
    startPolling,
    stopPolling,
    setupEventListeners,
    removeEventListeners,
    fetchCurrentUser,
    refreshUser,
    initializeUser,
  };
});
