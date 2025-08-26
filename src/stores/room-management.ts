import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { RoomService } from '@/lib/service/room-service';
import { SummonerService } from '@/lib/service/summoner-service';
import {
  gameConnectionMonitor,
  type GameConnectionState,
} from '@/lib/service/game-connection-monitor';
import { eventBus } from '@/lib/event-bus';
import type { Room, Member } from '@/types/room';
import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
// 添加 SGP 服务导入
import { SgpMatchService } from '@/lib/sgp/sgp-match-service';
import { SimpleSgpApi } from '@/lib/sgp/sgp-api';
import { SgpMatchHistoryResult } from '@/types/match-history-sgp';

export interface MemberWithDetails extends Member {
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  matchHistory?: SgpMatchHistoryResult;
  isLoading?: boolean;
  error?: string;
}

export const useRoomManagementStore = defineStore('roomManagement', () => {
  // 状态
  const currentRoom = ref<Room | null>(null);
  const roomMembers = ref<MemberWithDetails[]>([]);
  const isLoadingRoom = ref(false);
  const isLoadingMembers = ref(false);
  const errorMessage = ref<string | null>(null);
  const isPolling = ref(false);
  const pollTimer = ref<NodeJS.Timeout | null>(null);

  // 智能监控状态
  const appHasFocus = ref(true);
  const isOnRoomPage = ref(false);
  const shouldMonitor = computed(() => appHasFocus.value && isOnRoomPage.value);

  // 防抖相关状态
  const debounceTimer = ref<NodeJS.Timeout | null>(null);
  const lastCheckTime = ref<number>(0);
  const MIN_CHECK_INTERVAL = 4000; // 最小检查间隔4秒

  // 服务实例
  const roomService = new RoomService();
  const summonerService = new SummonerService();
  // 添加 SGP 服务实例
  const sgpApi = new SimpleSgpApi();
  const sgpMatchService = new SgpMatchService(sgpApi);

  // 游戏连接状态订阅
  let connectionUnsubscribe: (() => void) | null = null;

  // 计算属性
  const isInRoom = computed(() => !!currentRoom.value);
  const roomLeader = computed(() =>
    roomMembers.value.find(member => member.isLeader)
  );
  const otherMembers = computed(() =>
    roomMembers.value.filter(member => !member.isLeader)
  );
  const hasError = computed(() => !!errorMessage.value);

  // 清空状态
  const clearState = () => {
    currentRoom.value = null;
    roomMembers.value = [];
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

  // 防抖检查房间状态
  const debouncedCheckRoomStatus = () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime.value;

    // 如果距离上次检查不足最小间隔，则延迟执行
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }

      const delay = MIN_CHECK_INTERVAL - timeSinceLastCheck;
      console.log(`防抖延迟 ${delay}ms 后执行房间状态检查`);

      debounceTimer.value = setTimeout(() => {
        checkRoomStatus();
      }, delay);
      return;
    }

    // 立即执行检查
    checkRoomStatus();
  };

  // 开始轮询
  const startPolling = () => {
    if (isPolling.value) {
      console.log('轮询已在进行中，跳过重复启动');
      return;
    }

    console.log('开始房间监控轮询');
    isPolling.value = true;

    // 设置定时器
    pollTimer.value = setInterval(async () => {
      await checkRoomStatus();
    }, 2000); // 每4秒轮询一次

    // 使用防抖机制立即执行一次检查
    debouncedCheckRoomStatus();

    // 发送房间监控开始事件
    eventBus.emit('room:monitoring:start');
  };

  // 智能监控控制 - 添加防抖
  const updateMonitoringState = () => {
    console.log(
      '更新房间监控状态 - 应用焦点:',
      appHasFocus.value,
      '房间页面:',
      isOnRoomPage.value,
      '应该监控:',
      shouldMonitor.value,
      '当前轮询状态:',
      isPolling.value
    );

    if (shouldMonitor.value && !isPolling.value) {
      console.log('开始房间监控 - 应用有焦点且在房间管理页面');
      startPolling();
    } else if (!shouldMonitor.value && isPolling.value) {
      console.log('停止房间监控 - 应用失去焦点或离开房间管理页面');
      stopPolling();
      eventBus.emit('room:monitoring:stop');
    } else if (shouldMonitor.value && isPolling.value) {
      console.log('房间监控状态无变化，但触发防抖检查');
      // 即使轮询已经在进行，也可以触发一次防抖检查（用于焦点重新获得时的即时更新）
      debouncedCheckRoomStatus();
    }
  };

  // 处理游戏连接状态变化
  const handleConnectionStateChange = (
    connectionState: GameConnectionState
  ) => {
    if (!connectionState.isConnected && isInRoom.value) {
      console.log('游戏连接断开，清空房间状态');
      clearState();
      setError('游戏客户端连接断开');
    } else if (
      connectionState.isConnected &&
      !isInRoom.value &&
      shouldMonitor.value
    ) {
      console.log('游戏重新连接，尝试获取房间信息');
      debouncedCheckRoomStatus();
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
      console.log('房间store - 应用焦点状态变化:', hasFocus);
      const previousFocus = appHasFocus.value;
      appHasFocus.value = hasFocus;

      // 只有当焦点状态真正发生变化时才更新监控状态
      if (previousFocus !== hasFocus) {
        console.log('房间store - 焦点状态发生实际变化，更新监控状态');
        updateMonitoringState();
      }
    });

    // 监听页面切换
    eventBus.on('page:change', pageName => {
      console.log('房间store - 页面切换事件:', pageName);
      const wasOnRoomPage = isOnRoomPage.value;
      isOnRoomPage.value = pageName === 'RoomManagement';
      console.log('房间store - 是否在房间页面:', isOnRoomPage.value);

      if (wasOnRoomPage !== isOnRoomPage.value) {
        console.log('房间store - 房间页面状态发生变化，更新监控状态');
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

  // 检查房间状态
  const checkRoomStatus = async (): Promise<void> => {
    // 更新最后检查时间
    lastCheckTime.value = Date.now();

    try {
      console.log('执行房间状态检查...');

      // 检查游戏连接状态
      if (!gameConnectionMonitor.isConnected.value) {
        if (isInRoom.value) {
          clearState();
          setError('无法连接到英雄联盟客户端');
        }
        return;
      }

      // 检查是否在房间中
      const inLobby = await roomService.isInLobby();
      if (!inLobby) {
        if (isInRoom.value) {
          clearState();
          setError('当前不在游戏房间中');
        }
        return;
      }

      // 获取房间信息
      const room = await roomService.getCurrentLobby();
      currentRoom.value = room;
      clearError();

      // 检查成员变化
      await checkMemberChanges();
    } catch (error: any) {
      console.error('检查房间状态失败:', error);
      if (isInRoom.value) {
        setError(error.message || '检查房间状态失败');
      }
    }
  };

  // 检查成员变化
  const checkMemberChanges = async (): Promise<void> => {
    if (!currentRoom.value) return;

    try {
      const currentMembers = await roomService.getLobbyMembers();
      const currentMemberIds = currentMembers.map(m => m.summonerId);
      const existingMemberIds = roomMembers.value.map(m => m.summonerId);

      // 找出离开的成员
      const leftMemberIds = existingMemberIds.filter(
        id => !currentMemberIds.includes(id)
      );

      // 找出新加入的成员
      const newMembers = currentMembers.filter(
        m => !existingMemberIds.includes(m.summonerId)
      );

      // 移除离开的成员
      if (leftMemberIds.length > 0) {
        roomMembers.value = roomMembers.value.filter(
          member => !leftMemberIds.includes(member.summonerId)
        );
        console.log('成员离开:', leftMemberIds);
      }

      // 为新成员获取详细信息
      if (newMembers.length > 0) {
        console.log(
          '新成员加入:',
          newMembers.map(m => m.summonerName)
        );
        await fetchNewMembersDetails(newMembers);
      }

      // 更新现有成员的基本信息（位置偏好、准备状态等）
      updateExistingMembersInfo(currentMembers);
    } catch (error: any) {
      console.error('检查成员变化失败:', error);
    }
  };

  // 获取新成员的详细信息
  const fetchNewMembersDetails = async (
    newMembers: Member[]
  ): Promise<void> => {
    // 先添加新成员到列表中，标记为加载中
    const newMembersWithDetails: MemberWithDetails[] = newMembers.map(
      member => ({
        ...member,
        isLoading: true,
      })
    );

    roomMembers.value.push(...newMembersWithDetails);

    // 并行获取每个新成员的详细信息
    const memberPromises = newMembers.map(async (member, index) => {
      const memberIndex = roomMembers.value.findIndex(
        m => m.summonerId === member.summonerId
      );
      if (memberIndex === -1) return;

      try {
        // 获取召唤师详细信息
        let summonerData = await summonerService.getSummonerByID(
          member.summonerId
        );

        let rankedStats = await summonerService.getRankedStats(
          summonerData.puuid
        );
        let matchHistory = await sgpMatchService.getMatchHistory(
          summonerData.puuid,
          0,
          19, // 获取最近20场
          {
            serverId:
              (await sgpMatchService._inferCurrentUserServerId()) as string,
          }
        );

        // 更新成员信息
        roomMembers.value[memberIndex] = {
          ...member,
          summonerData,
          rankedStats,
          matchHistory,
          isLoading: false,
        };
      } catch (error: any) {
        console.error(`获取成员 ${member.summonerName} 详细信息失败:`, error);
        roomMembers.value[memberIndex] = {
          ...member,
          isLoading: false,
          error: error.message || '获取成员信息失败',
        };
      }
    });

    await Promise.all(memberPromises);
  };

  // 更新现有成员的基本信息
  const updateExistingMembersInfo = (currentMembers: Member[]) => {
    roomMembers.value.forEach((existingMember, index) => {
      const updatedMember = currentMembers.find(
        m => m.summonerId === existingMember.summonerId
      );
      if (updatedMember) {
        // 保留详细信息，只更新基本信息
        roomMembers.value[index] = {
          ...existingMember,
          ...updatedMember,
          // 保留已获取的详细信息
          summonerData: existingMember.summonerData,
          rankedStats: existingMember.rankedStats,
          matchHistory: existingMember.matchHistory,
          isLoading: existingMember.isLoading,
          error: existingMember.error,
        };
      }
    });
  };

  // 获取房间信息（初始化用）
  const fetchRoomInfo = async (): Promise<void> => {
    if (isLoadingRoom.value) return;

    isLoadingRoom.value = true;
    clearError();

    try {
      // 检查游戏连接状态
      if (!gameConnectionMonitor.isConnected.value) {
        throw new Error('无法连接到英雄联盟客户端，请确保游戏客户端已启动');
      }

      // 检查是否在房间中
      const inLobby = await roomService.isInLobby();
      if (!inLobby) {
        throw new Error('当前不在游戏房间中，请先创建或加入房间');
      }

      // 获取房间信息
      const room = await roomService.getCurrentLobby();
      currentRoom.value = room;
      console.log('currentRoom.value', currentRoom.value);

      // 获取房间成员
      await fetchRoomMembers();
    } catch (error: any) {
      console.error('获取房间信息失败:', error);
      setError(error.message || '获取房间信息失败');
      clearState();
    } finally {
      isLoadingRoom.value = false;
    }
  };

  // 获取房间成员信息（初始化用）
  const fetchRoomMembers = async (): Promise<void> => {
    if (!currentRoom.value || isLoadingMembers.value) return;

    isLoadingMembers.value = true;

    try {
      const members = await roomService.getLobbyMembers();

      // 初始化成员数据
      roomMembers.value = members.map(member => ({
        ...member,
        isLoading: true,
      }));

      // 并行获取每个成员的详细信息
      const memberPromises = members.map(async (member, index) => {
        try {
          // 获取召唤师详细信息
          let summonerData = await summonerService.getSummonerByID(
            member.summonerId
          );

          let rankedStats = await summonerService.getRankedStats(
            summonerData.puuid
          );
          let matchHistory = await sgpMatchService.getMatchHistory(
            summonerData.puuid,
            0,
            19, // 获取最近20场
            {
              serverId:
                (await sgpMatchService._inferCurrentUserServerId()) as string,
            }
          );

          // 更新成员信息
          roomMembers.value[index] = {
            ...member,
            summonerData,
            rankedStats,
            matchHistory,
            isLoading: false,
          };
        } catch (error: any) {
          console.error(`获取成员 ${member.summonerName} 详细信息失败:`, error);
          roomMembers.value[index] = {
            ...member,
            isLoading: false,
            error: error.message || '获取成员信息失败',
          };
        }
      });

      await Promise.all(memberPromises);
    } catch (error: any) {
      console.error('获取房间成员失败:', error);
      setError(error.message || '获取房间成员失败');
    } finally {
      isLoadingMembers.value = false;
    }
  };

  // 踢出成员
  const kickMember = async (summonerId: number): Promise<void> => {
    try {
      await roomService.kickMember(summonerId);
      // 不需要手动刷新，轮询会自动检测到成员变化
    } catch (error: any) {
      console.error('踢出成员失败:', error);
      setError(error.message || '踢出成员失败');
    }
  };

  // 检查当前用户是否为房主
  const checkIsLeader = async (): Promise<boolean> => {
    try {
      return await roomService.isCurrentUserLeader();
    } catch (error) {
      console.error('检查房主权限失败:', error);
      return false;
    }
  };

  // 初始化房间管理（页面进入时调用）
  const initializeRoomManagement = async (): Promise<void> => {
    console.log('初始化房间管理...');

    // 确保游戏连接监控已启动
    if (!gameConnectionMonitor.monitoring.value) {
      gameConnectionMonitor.startMonitoring();
    }

    // 设置事件监听器
    setupEventListeners();

    // 获取房间信息
    await fetchRoomInfo();
  };

  return {
    // 状态
    currentRoom,
    roomMembers,
    isLoadingRoom,
    isLoadingMembers,
    errorMessage,
    isPolling,
    appHasFocus,
    isOnRoomPage,
    shouldMonitor,

    // 计算属性
    isInRoom,
    roomLeader,
    otherMembers,
    hasError,

    // 方法
    clearState,
    setError,
    clearError,
    startPolling,
    stopPolling,
    setupEventListeners,
    removeEventListeners,
    fetchRoomInfo,
    fetchRoomMembers,
    kickMember,
    checkIsLeader,
    initializeRoomManagement,
  };
});
