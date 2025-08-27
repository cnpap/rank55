<script setup lang="ts">
import { SearchHistoryItem } from '@/storages/storage-use';
import { ref } from 'vue';

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
  // 标记/取消标记事件
  toggleBookmark: [item: SearchHistoryItem, index: number];
  // 删除历史记录事件
  deleteHistory: [item: SearchHistoryItem, index: number];
}

const emit = defineEmits<Emits>();

// 悬停状态管理
const hoveredIndex = ref<number | null>(null);
const hoverTimers = ref<Map<number, NodeJS.Timeout>>(new Map());

// 防抖处理悬停进入
const handleMouseEnter = (index: number) => {
  // 清除可能存在的离开定时器
  const leaveTimer = hoverTimers.value.get(`leave-${index}` as any);
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    hoverTimers.value.delete(`leave-${index}` as any);
  }

  // 设置进入定时器
  const enterTimer = setTimeout(() => {
    hoveredIndex.value = index;
    hoverTimers.value.delete(`enter-${index}` as any);
  }, 50); // 50ms 防抖延迟

  hoverTimers.value.set(`enter-${index}` as any, enterTimer);
};

// 防抖处理悬停离开
const handleMouseLeave = (index: number) => {
  // 清除可能存在的进入定时器
  const enterTimer = hoverTimers.value.get(`enter-${index}` as any);
  if (enterTimer) {
    clearTimeout(enterTimer);
    hoverTimers.value.delete(`enter-${index}` as any);
  }

  // 设置离开定时器
  const leaveTimer = setTimeout(() => {
    if (hoveredIndex.value === index) {
      hoveredIndex.value = null;
    }
    hoverTimers.value.delete(`leave-${index}` as any);
  }, 100); // 100ms 防抖延迟，稍长一些避免误触

  hoverTimers.value.set(`leave-${index}` as any, leaveTimer);
};

// 检查是否处于悬停状态
const isHovered = (index: number) => {
  return hoveredIndex.value === index;
};

// 处理历史记录点击
const handleHistoryClick = (item: SearchHistoryItem) => {
  if (props.isSearching) return;
  emit('searchFromHistory', item);
};

// 处理标记切换
const handleToggleBookmark = (
  event: Event,
  item: SearchHistoryItem,
  index: number
) => {
  event.stopPropagation();
  if (props.isSearching) return;
  emit('toggleBookmark', item, index);
};

// 处理删除
const handleDelete = (event: Event, item: SearchHistoryItem, index: number) => {
  event.stopPropagation();
  if (props.isSearching) return;
  emit('deleteHistory', item, index);
};

// 判断是否已标记（使用 item 的 isBookmarked 字段）
const isBookmarked = (item: SearchHistoryItem) => {
  return item.isBookmarked || false;
};
</script>

<template>
  <div v-if="searchHistory.length > 0" class="mb-3">
    <div class="mb-3">
      <span class="text-foreground font-medium">搜索历史</span>
    </div>
    <!-- flex布局，自适应每行显示数量 -->
    <div class="flex flex-wrap gap-2">
      <!-- 占位容器，保持布局稳定 -->
      <div
        v-for="(item, index) in searchHistory"
        :key="item.puuid"
        class="relative"
      >
        <!-- 原始占位元素，保持布局不变 -->
        <div
          class="invisible flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
        >
          <!-- 为收藏的战绩预留星星空间 -->
          <svg
            v-if="isBookmarked(item)"
            class="h-3 w-3 flex-shrink-0"
            viewBox="0 0 20 20"
          >
            <path />
          </svg>
          <span>{{ item.serverName }}</span>
          <span>{{ item.name.split('#')[0] }}</span>
        </div>

        <!-- 实际显示的可交互元素，绝对定位覆盖在占位元素上，悬停时提升层级 -->
        <div
          class="absolute top-0 left-0 cursor-pointer overflow-visible rounded-lg border backdrop-blur-sm transition-all duration-300 ease-out"
          :class="[
            isSearching ? 'cursor-not-allowed opacity-50' : '',
            isHovered(index) ? 'z-50' : 'z-10',
            isBookmarked(item)
              ? isHovered(index)
                ? 'shadow-amber-500/10 dark:border-amber-300/60'
                : 'border-amber-200/40'
              : isHovered(index)
                ? 'dark:border-border/40 shadow-primary/5'
                : 'border-border/20',
          ]"
          @click="handleHistoryClick(item)"
          @mouseenter="handleMouseEnter(index)"
          @mouseleave="handleMouseLeave(index)"
        >
          <!-- 主要内容区域 - 移除悬停时的宽度变化 -->
          <div
            class="relative z-10 flex items-center gap-2 px-3 py-2 text-xs transition-all duration-300 ease-out"
          >
            <!-- 收藏标识 - 仅在已收藏时显示 -->
            <svg
              v-if="isBookmarked(item)"
              class="h-3 w-3 flex-shrink-0 text-amber-600 transition-colors duration-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            <span
              class="flex-shrink-0 transition-colors duration-300"
              :class="
                isHovered(index)
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/60'
              "
              >{{ item.serverName }}</span
            >
            <span
              class="truncate font-medium transition-colors duration-300"
              :class="[
                isHovered(index)
                  ? 'text-foreground brightness-110'
                  : 'text-foreground/80',
              ]"
              >{{ item.name.split('#')[0] }}</span
            >
          </div>

          <!-- 操作按钮区域 - 直接覆盖在右侧，悬停时显示 -->
          <div
            class="absolute top-1 right-1 z-20 flex gap-1 transition-all duration-200 ease-out"
            :class="[isHovered(index) ? 'opacity-100' : 'opacity-0']"
          >
            <!-- 标记/取消标记按钮 -->
            <button
              @click="handleToggleBookmark($event, item, index)"
              :disabled="isSearching"
              class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md backdrop-blur-sm transition-all duration-200"
              :class="[
                isBookmarked(item)
                  ? 'bg-background/90 border border-transparent text-amber-600 shadow-sm hover:border-amber-500'
                  : 'text-muted-foreground hover:text-foreground bg-background/80 hover:bg-background/90 shadow-sm',
              ]"
              :title="isBookmarked(item) ? '取消标记' : '标记收藏'"
            >
              <svg
                class="h-3 w-3"
                :fill="isBookmarked(item) ? 'currentColor' : 'none'"
                :stroke="isBookmarked(item) ? 'none' : 'currentColor'"
                stroke-width="2"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
            </button>

            <!-- 删除按钮 -->
            <button
              @click="handleDelete($event, item, index)"
              :disabled="isSearching"
              class="bg-background/80 text-muted-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-md shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-red-500/90 hover:text-white"
              title="删除记录"
            >
              <svg
                class="h-3 w-3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- 精致的内发光效果 -->
          <div
            class="absolute inset-0 rounded-lg transition-all duration-500 ease-out"
            :class="[
              isBookmarked(item)
                ? isHovered(index)
                  ? 'bg-gradient-to-br from-amber-500/5 via-amber-500/2 to-transparent'
                  : 'bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0'
                : isHovered(index)
                  ? 'from-primary/5 via-primary/2 bg-gradient-to-br to-transparent'
                  : 'from-primary/0 via-primary/0 to-primary/0 bg-gradient-to-br',
            ]"
          ></div>

          <!-- 微妙的边框高光 -->
          <div
            class="absolute inset-0 rounded-lg border border-transparent transition-all duration-300 ease-out"
            :class="[
              isBookmarked(item)
                ? isHovered(index)
                  ? 'border-amber-500/20'
                  : ''
                : isHovered(index)
                  ? 'border-primary/20'
                  : '',
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
