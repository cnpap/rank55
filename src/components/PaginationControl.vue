<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { usePaginationControl } from '@/lib/composables/useMatchHistoryQuery';

// 每页显示数量选项
const pageSizeOptions = [
  { value: 10, label: '10条' },
  { value: 20, label: '20条' },
  { value: 50, label: '50条' },
];

// 通过 inject 获取分页控制
const paginationControl = usePaginationControl();
</script>

<template>
  <div class="flex items-center gap-1">
    <!-- 每页显示数量 -->
    <Select
      :model-value="String(paginationControl.pageSize.value)"
      @update:model-value="
        size => paginationControl.changePageSize(Number(size))
      "
    >
      <SelectTrigger class="h-8 w-20 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in pageSizeOptions"
          :key="option.value"
          :value="String(option.value)"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- 分页按钮 -->
    <div class="flex items-center gap-0.5">
      <Button
        variant="outline"
        class="h-9 w-9"
        :disabled="!paginationControl.hasPrevPage.value"
        @click="paginationControl.goToPrevPage()"
      >
        <ChevronLeft class="h-4 w-4" />
      </Button>

      <div class="px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
        {{ paginationControl.currentPage.value }}
      </div>

      <Button
        variant="outline"
        class="h-9 w-9"
        :disabled="!paginationControl.hasNextPage.value"
        @click="paginationControl.goToNextPage()"
      >
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
