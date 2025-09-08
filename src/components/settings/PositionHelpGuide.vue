<script setup lang="ts">
import { staticAssets } from '@/assets/data-assets';
import { Plus, Settings } from 'lucide-vue-next';
// 帮助说明组件 - 无背景色设计
</script>

<template>
  <div class="mt-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
    <h4
      class="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
    >
      使用说明
    </h4>

    <div
      class="grid grid-cols-1 gap-3 text-xs text-gray-600 lg:grid-cols-2 dark:text-gray-400"
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-red-500 shadow-sm"></div>
          <span
            ><span class="font-medium text-red-600 dark:text-red-400"
              >禁用英雄</span
            >
            - BP阶段优先禁用，从左到右按顺序执行</span
          >
        </div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-emerald-500 shadow-sm"></div>
          <span
            ><span class="font-medium text-emerald-600 dark:text-emerald-400"
              >优先英雄</span
            >
            - BP阶段优先选择，从左到右按顺序执行</span
          >
        </div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-gray-400 shadow-sm"></div>
          <span
            ><span class="font-medium">推荐英雄</span> -
            系统推荐（灰色），点击快速添加</span
          >
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-blue-500 shadow-sm"></div>
          <span>
            <span class="font-medium"> 拖拽排序 </span>
            - 悬停英雄头像，拖拽调整优先级
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-orange-500 shadow-sm"></div>
          <span class="flex items-center gap-1">
            <span class="font-medium"> 删除英雄 </span>
            - 悬停头像，点击
            <div
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500"
            >
              <img
                :src="staticAssets.getIcon('close')"
                alt="删除"
                class="h-4 w-4"
              />
            </div>
            按钮移除
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-3 rounded-sm bg-pink-500 shadow-sm"></div>
          <span class="flex items-center gap-1">
            <span class="font-medium"> 添加英雄 </span>
            - 点击添加按钮
            <div
              class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-white shadow-sm"
            >
              <Plus class="h-2.5 w-2.5" />
            </div>
            打开选择器
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
