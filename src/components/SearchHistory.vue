<script setup lang="ts">
import { SearchHistoryItem } from '@/storages/storage-use';

// Props 定义
interface Props {
  // 搜索历史数据
  searchHistory: SearchHistoryItem[];
  // 是否正在搜索
  isSearching: boolean;
}

const props = defineProps<Props>();

// Emits 定义
interface Emits {
  // 从历史记录搜索事件
  searchFromHistory: [item: SearchHistoryItem];
}

const emit = defineEmits<Emits>();

// 处理历史记录点击
const handleHistoryClick = (item: SearchHistoryItem) => {
  if (props.isSearching) return;
  emit('searchFromHistory', item);
};
</script>

<template>
  <div v-if="searchHistory.length > 0" class="mb-3">
    <div class="mb-3">
      <span class="text-foreground font-medium">搜索历史</span>
    </div>
    <!-- flex布局，自适应每行显示数量 -->
    <div class="flex flex-wrap gap-1">
      <div
        v-for="(item, index) in searchHistory"
        :key="index"
        class="group border-border/40 bg-card/50 hover:border-border/80 hover:bg-card/80 relative cursor-pointer overflow-hidden border p-0.5 transition-all duration-200 hover:shadow-sm"
        @click="handleHistoryClick(item)"
        :class="{ 'cursor-not-allowed opacity-50': isSearching }"
      >
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">{{ item.serverName }}</span>
          <span class="text-foreground">{{ item.name }}</span>
        </div>
        <!-- 底部装饰线 -->
        <div
          class="bg-primary absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
        ></div>
      </div>
    </div>
  </div>
</template>
