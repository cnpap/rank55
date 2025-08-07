<template>
  <Button
    variant="ghost"
    size="sm"
    @click="toggleTheme"
    class="relative"
    :title="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
  >
    <Sun v-if="theme === 'light'" class="h-4 w-4 transition-all" />
    <Moon v-else class="h-4 w-4 transition-all" />
    <span class="sr-only">切换主题</span>
  </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-vue-next';
import { useTheme } from '@/utils/theme';

const { theme, toggleTheme } = useTheme();
</script>
