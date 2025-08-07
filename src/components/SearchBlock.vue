<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const props = defineProps<{
  modelValue: string;
  isSearching: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [];
  searchFromHistory: [name: string];
}>();

// 搜索历史记录 - 第一个是"我"
const searchHistory = ref(['我']);

const handleSearch = () => {
  emit('search');
};

const searchFromHistory = (name: string) => {
  emit('searchFromHistory', name);
};
</script>

<template>
  <div class="space-y-6">
    <!-- 搜索输入区域 -->
    <div class="mx-auto max-w-md">
      <div class="relative">
        <!-- 搜索框容器 -->
        <div
          class="bg-card border-border/60 relative overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm"
        >
          <!-- 微妙的顶部装饰线 -->
          <div
            class="via-primary/20 absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
          ></div>
          <!-- 内部容器，提供微妙的背景层次 -->
          <div class="relative">
            <!-- 亮模式下的微妙内阴影效果 -->
            <div
              class="to-muted/20 absolute inset-0 rounded-[11px] bg-gradient-to-b from-transparent via-transparent dark:to-transparent"
            ></div>
            <div class="relative flex p-3">
              <!-- 输入框区域背景 -->
              <div
                class="bg-muted/30 absolute top-3 right-[88px] bottom-3 left-3 rounded-lg transition-colors duration-200 dark:bg-transparent"
              ></div>
              <Input
                :model-value="props.modelValue"
                @update:model-value="emit('update:modelValue', String($event))"
                placeholder="请输入召唤师名称..."
                class="placeholder:text-muted-foreground/70 relative z-10 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                @keyup.enter="handleSearch"
                :disabled="props.isSearching"
              />
              <Button
                @click="handleSearch"
                :disabled="!props.modelValue.trim() || props.isSearching"
                class="relative z-10 ml-2 h-10 px-6 font-medium"
                size="sm"
              >
                <span v-if="props.isSearching" class="flex items-center gap-2">
                  <div
                    class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  ></div>
                  搜索中
                </span>
                <span v-else>搜索</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索历史区域 -->
    <div class="flex justify-center">
      <div class="flex flex-col items-center space-y-3">
        <span class="text-muted-foreground text-sm font-medium">快速搜索</span>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="(item, index) in searchHistory"
            :key="index"
            class="bg-card hover:bg-card/80 border-border/40 hover:border-border/60 text-muted-foreground hover:text-foreground group relative overflow-hidden rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
            @click="searchFromHistory(item)"
          >
            <!-- 按钮微妙的悬停效果 -->
            <div
              class="from-primary/8 to-accent/8 absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            ></div>
            <!-- 亮模式下的微妙背景层次 -->
            <div
              class="bg-muted/20 absolute inset-0 rounded-lg dark:bg-transparent"
            ></div>
            <span class="relative z-10">{{ item }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
