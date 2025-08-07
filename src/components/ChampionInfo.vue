<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-vue-next';
import type { ChampionCnData } from '@/types/champion-cn';

interface Props {
  champion: ChampionCnData;
  isFavorite: boolean;
}

interface Emits {
  toggleFavorite: [championId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 获取标签中文名
function getTagName(tag: string): string {
  const tagNames: Record<string, string> = {
    mage: '法师',
    support: '辅助',
    fighter: '战士',
    tank: '坦克',
    assassin: '刺客',
    marksman: '射手',
  };
  return tagNames[tag.toLowerCase()] || tag;
}

// 获取标签颜色
function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    mage: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    support:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    fighter: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    tank: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assassin:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    marksman:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };
  return (
    colors[tag.toLowerCase()] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  );
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center space-x-3">
          <h4 class="text-xl font-bold">{{ champion.hero.name }}</h4>
        </div>
        <p class="text-muted-foreground mt-1 text-sm">
          {{ champion.hero.title }}
        </p>
      </div>
      <!-- 收藏按钮 -->
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{
          'text-yellow-500 hover:text-yellow-600': isFavorite,
          'text-gray-400 hover:text-yellow-500': !isFavorite,
        }"
        @click="emit('toggleFavorite', champion.hero.heroId)"
      >
        <Heart class="h-4 w-4" :class="{ 'fill-current': isFavorite }" />
      </Button>
    </div>

    <!-- 标签 -->
    <div class="flex flex-wrap gap-1">
      <Badge
        v-for="role in champion.hero.roles"
        :key="role"
        variant="secondary"
        :class="getTagColor(role)"
        class="text-xs"
      >
        {{ getTagName(role) }}
      </Badge>
    </div>
  </div>
</template>
