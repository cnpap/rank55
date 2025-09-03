import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SummonerData } from '@/types/summoner';
import { $local, SearchHistoryItem } from '@/storages/storage-use';
import serverConfig from '../../public/config/league-servers.json';
import { useRouter } from 'vue-router';
import { useClientUserStore } from './client-user';
import {
  riotApiService,
  summonerService,
  sgpApi,
  sgpMatchService,
} from '@/lib/service/service-manager';

// 简化的搜索结果接口 - 只包含基本信息
export interface PuuidSearchResult {
  puuid: string;
  summoner?: SummonerData;
  serverId?: string;
  error?: string;
}

// 服务器选项接口
export interface ServerOption {
  id: string;
  name: string;
}

export const useMatchHistoryStore = defineStore('matchHistory', () => {
  const router = useRouter();
  const userStore = useClientUserStore();

  // 只保留导航组件需要的状态
  const isSearching = ref(false);
  const searchHistory = ref<SearchHistoryItem[]>(
    $local.getItem('searchHistory') || []
  );
  const selectedServerId = ref<string>('TENCENT_HN1');

  // 使用全局服务实例
  // 所有服务实例现在通过 service-manager 管理

  // 获取排序后的搜索历史（收藏的在前面）
  const sortedSearchHistory = computed(() => {
    return [...searchHistory.value].sort((a, b) => {
      // 收藏的项目排在前面
      if (a.isBookmarked && !b.isBookmarked) return -1;
      if (!a.isBookmarked && b.isBookmarked) return 1;
      // 如果都是收藏或都不是收藏，保持原有顺序
      return 0;
    });
  });
  // 获取可用服务器列表
  const availableServers = computed((): ServerOption[] => {
    const servers: ServerOption[] = [];
    const serverNames = (serverConfig as any).serverNames['zh-CN'];

    const tencentServers = [
      'TENCENT_HN1',
      'TENCENT_HN10',
      'TENCENT_TJ100',
      'TENCENT_TJ101',
      'TENCENT_NJ100',
      'TENCENT_GZ100',
      'TENCENT_CQ100',
      'TENCENT_BGP2',
    ];

    tencentServers.forEach(serverId => {
      if (serverNames[serverId]) {
        servers.push({
          id: serverId,
          name: serverNames[serverId],
        });
      }
    });

    return servers;
  });

  // 验证用户ID格式
  const validateUserIdFormat = (userId: string): boolean => {
    const userIdPattern = /^.+#\d{5,}$/;
    return userIdPattern.test(userId);
  };

  // 设置选中的服务器
  const setSelectedServerId = (serverId: string) => {
    selectedServerId.value = serverId;
  };

  // 保存搜索历史到 localStorage
  const saveSearchHistory = () => {
    $local.setItem('searchHistory', searchHistory.value);
  };

  // 通用的玩家导航函数 - 通过 puuid 导航到玩家页面
  const navigateToPlayer = async (
    puuid: string,
    serverId?: string,
    summonerName?: string
  ): Promise<void> => {
    // 使用指定的服务器ID或当前选中的服务器ID
    const targetServerId = serverId || selectedServerId.value;

    isSearching.value = true;

    try {
      if (puuid === userStore.user!.puuid) {
        // 跳转到 Home 页面，带上 puuid 和 serverId 参数
        await router.push({
          name: 'Home',
          query: {
            puuid: puuid,
            serverId: targetServerId,
          },
        });
        return;
      }

      // 如果提供了召唤师名称，添加到搜索历史（避免重复，应该使用 puuid 来判断重复）
      if (summonerName) {
        const existingIndex = searchHistory.value.findIndex(
          item => item.puuid === puuid
        );

        if (existingIndex !== -1) {
          // 如果已存在，移动到最前面并更新 puuid
          const existingItem = searchHistory.value.splice(existingIndex, 1)[0];
          existingItem.puuid = puuid;
          // 如果是收藏项，直接放到最前面；否则放到非收藏项的最前面
          if (existingItem.isBookmarked) {
            searchHistory.value.unshift(existingItem);
          } else {
            // 找到第一个非收藏项的位置
            const firstNonBookmarkedIndex = searchHistory.value.findIndex(
              item => !item.isBookmarked
            );
            if (firstNonBookmarkedIndex === -1) {
              // 如果所有项都是收藏的，放到最后
              searchHistory.value.push(existingItem);
            } else {
              // 插入到第一个非收藏项的位置
              searchHistory.value.splice(
                firstNonBookmarkedIndex,
                0,
                existingItem
              );
            }
          }
        } else {
          // 如果不存在，添加新项
          const newItem = {
            name: summonerName,
            serverId: targetServerId,
            serverName:
              availableServers.value.find(
                server => server.id === targetServerId
              )?.name || '',
            puuid: puuid,
            isBookmarked: false, // 新添加的项默认不收藏
          };

          // 找到第一个非收藏项的位置，新项插入到非收藏项的最前面
          const firstNonBookmarkedIndex = searchHistory.value.findIndex(
            item => !item.isBookmarked
          );
          if (firstNonBookmarkedIndex === -1) {
            // 如果所有项都是收藏的，放到最后
            searchHistory.value.push(newItem);
          } else {
            // 插入到第一个非收藏项的位置
            searchHistory.value.splice(firstNonBookmarkedIndex, 0, newItem);
          }

          // 限制非收藏历史记录数量为10条（不包括收藏的）
          const nonBookmarkedItems = searchHistory.value.filter(
            item => !item.isBookmarked
          );
          const bookmarkedItems = searchHistory.value.filter(
            item => item.isBookmarked
          );

          if (nonBookmarkedItems.length > 10) {
            // 保留收藏项和最新的10条非收藏项
            const latestNonBookmarked = nonBookmarkedItems.slice(0, 10);
            searchHistory.value = [...bookmarkedItems, ...latestNonBookmarked];
          }
        }

        // 保存到 localStorage
        saveSearchHistory();
      }

      // 跳转到 Home 页面，带上 puuid 和 serverId 参数
      await router.push({
        name: 'Home',
        query: {
          puuid: puuid,
          serverId: targetServerId,
        },
      });
    } catch (error: any) {
      console.error('导航到玩家页面失败:', error);
      throw new Error(error.message || '导航失败，请检查网络连接');
    } finally {
      isSearching.value = false;
    }
  };

  // 根据召唤师名称搜索 - 获取 puuid 并导航
  const searchSummonerByName = async (
    summonerName: string,
    serverId?: string
  ): Promise<void> => {
    // 移除特殊Unicode控制字符（U+2066到U+2069）
    summonerName = summonerName.replace(/[\u2066-\u2069]/g, '');
    // 移除所有空格（包括名称中间的空格）
    summonerName = summonerName.replace(/\s/g, '');
    // 通过第一个#号拆分
    let parts = summonerName.split('#');
    let gameName = parts[0];
    let tagLine = parts.length > 1 ? parts[1] : '';
    // 标签部分只保留数字
    tagLine = tagLine.replace(/\D/g, '');
    // 如果标签为空，可以按照需求处理，比如设为默认值或报错
    // 重新组合
    summonerName = `${gameName}#${tagLine}`;

    // 验证用户ID格式
    if (!validateUserIdFormat(summonerName)) {
      throw new Error(
        '召唤师名称格式不正确，请使用格式：召唤师名#标签（标签至少5位数字）'
      );
    }

    try {
      const playerAccountAlias = (
        await riotApiService.lookupPlayerAccount(gameName, tagLine)
      )[0];

      if (!playerAccountAlias) {
        throw new Error('未找到该召唤师');
      }

      // 使用通用导航函数
      await navigateToPlayer(playerAccountAlias.puuid, serverId, summonerName);
    } catch (error: any) {
      console.error('搜索召唤师失败:', error);
      throw new Error(error.message || '搜索失败，请检查召唤师名称或网络连接');
    }
  };

  // 直接通过 puuid 导航到玩家页面
  const navigateByPuuid = async (
    puuid: string,
    serverId?: string
  ): Promise<void> => {
    await navigateToPlayer(puuid, serverId);
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = [];
    saveSearchHistory();
  };

  // 切换收藏状态
  const toggleBookmark = (puuid: string) => {
    const itemIndex = searchHistory.value.findIndex(
      item => item.puuid === puuid
    );
    if (itemIndex !== -1) {
      const item = searchHistory.value[itemIndex];
      const wasBookmarked = item.isBookmarked;

      // 切换收藏状态
      item.isBookmarked = !item.isBookmarked;

      // 如果是新收藏的项目，需要重新排序
      if (!wasBookmarked && item.isBookmarked) {
        // 从原位置移除
        searchHistory.value.splice(itemIndex, 1);
        // 插入到最前面（所有收藏项目的第一位）
        searchHistory.value.unshift(item);
      } else if (wasBookmarked && !item.isBookmarked) {
        // 如果是取消收藏，从原位置移除
        searchHistory.value.splice(itemIndex, 1);
        // 找到第一个非收藏项的位置
        const firstNonBookmarkedIndex = searchHistory.value.findIndex(
          item => !item.isBookmarked
        );
        if (firstNonBookmarkedIndex === -1) {
          // 如果所有项都是收藏的，放到最后
          searchHistory.value.push(item);
        } else {
          // 插入到第一个非收藏项的位置
          searchHistory.value.splice(firstNonBookmarkedIndex, 0, item);
        }
      }

      saveSearchHistory();
    }
  };

  // 删除历史记录
  const deleteHistoryItem = (puuid: string) => {
    const index = searchHistory.value.findIndex(item => item.puuid === puuid);
    if (index !== -1) {
      searchHistory.value.splice(index, 1);
      saveSearchHistory();
    }
  };

  return {
    // 状态
    isSearching,
    searchHistory: sortedSearchHistory,
    selectedServerId,

    // 计算属性
    availableServers,

    // 方法
    setSelectedServerId,
    searchSummonerByName,
    navigateByPuuid,
    navigateToPlayer,
    validateUserIdFormat,
    clearSearchHistory,
    toggleBookmark,
    deleteHistoryItem,
  };
});
