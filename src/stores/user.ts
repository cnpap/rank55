import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SummonerData } from '@/types/summoner';

export const useUserStore = defineStore('user', () => {
  // 简化状态 - 主要作为数据存储
  const currentUser = ref<SummonerData | null>(null);
  const errorMessage = ref<string | null>(null);
  const serverId = ref<string>('');

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

  // 简化方法
  const setUser = (user: SummonerData | null) => {
    currentUser.value = user;
    if (user) {
      errorMessage.value = null;
    }
  };

  const setError = (error: string) => {
    errorMessage.value = error;
  };

  const clearError = () => {
    errorMessage.value = null;
  };

  const clearState = () => {
    currentUser.value = null;
    errorMessage.value = null;
  };

  const setServerId = (id: string) => {
    serverId.value = id;
  };

  return {
    // 状态
    currentUser,
    errorMessage,
    serverId,

    // 计算属性
    isLoggedIn,
    displayName,
    fullGameName,
    profileIconId,
    summonerLevel,
    hasError,

    // 方法
    setUser,
    setError,
    clearError,
    clearState,
    setServerId,
  };
});
