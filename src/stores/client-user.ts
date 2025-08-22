import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SummonerData } from '@/types/summoner';

export const useClientUserStore = defineStore('clientUser', () => {
  // 简化状态 - 主要作为数据存储
  const user = ref<SummonerData | null>(null);
  const errorMessage = ref<string | null>(null);
  const serverId = ref<string>('');

  // 计算属性
  const isLoggedIn = computed(() => !!user.value);
  const displayName = computed(() => {
    if (!user.value) return '';
    return user.value.displayName || user.value.gameName || '';
  });
  const fullGameName = computed(() => {
    if (!user.value) return '';
    if (user.value.gameName && user.value.tagLine) {
      return `${user.value.gameName}#${user.value.tagLine}`;
    }
    return displayName.value;
  });
  const profileIconId = computed(() => user.value?.profileIconId || 0);
  const summonerLevel = computed(() => user.value?.summonerLevel || 0);
  const hasError = computed(() => !!errorMessage.value);

  // 简化方法
  const setUser = (newUser: SummonerData | null) => {
    user.value = newUser;
    if (newUser) {
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
    user.value = null;
    errorMessage.value = null;
  };

  const setServerId = (id: string) => {
    serverId.value = id;
  };

  return {
    // 状态
    user,
    serverId,
    errorMessage,

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
