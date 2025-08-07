import { computed, ref, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'lol-helper-theme';

// 应用主题到DOM
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

// 主题状态
const theme = useLocalStorage<Theme>(STORAGE_KEY, 'light');

// 监听主题变化并应用
watch(theme, applyTheme, { immediate: true });

export function useTheme() {
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
  };

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  return {
    theme: computed(() => theme.value),
    setTheme,
    toggleTheme,
  };
}
