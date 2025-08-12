<script setup lang="ts">
import { reactive, ref } from 'vue';
import { toast } from 'vue-sonner';
import { type PositionSettings } from '@/storages/storage-use';
import AutoFunctionSettings from './AutoFunctionSettings.vue';
import PositionChampionSettings from './PositionChampionSettings.vue';
import { RotateCcw } from 'lucide-vue-next';

// 自动功能设置
const autoFunctionSettings = ref({
  autoBanEnabled: false,
  autoPickEnabled: false,
  autoBanCountdown: 5,
  autoPickCountdown: 5,
});

// 位置设置 - 改为 ref 而不是 reactive
const positionSettings = ref<PositionSettings>({
  top: { banChampions: [], pickChampions: [] },
  jungle: { banChampions: [], pickChampions: [] },
  middle: { banChampions: [], pickChampions: [] },
  bottom: { banChampions: [], pickChampions: [] },
  support: { banChampions: [], pickChampions: [] },
});

// 子组件引用
const autoFunctionRef = ref();
const positionChampionRef = ref();

// 重置所有设置
function resetSettings() {
  // 重置自动功能设置
  autoFunctionRef.value?.resetSettings();

  // 重置位置设置
  positionChampionRef.value?.resetSettings();

  toast.success('位置设置已重置');
}

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="space-y-6">
    <!-- 依次禁选卡片 -->
    <div class="border-border bg-card rounded border">
      <!-- 卡片头部 -->
      <div
        class="border-border flex items-center justify-between border-b px-6 py-4"
      >
        <h3 class="text-foreground text-lg font-medium">依次禁选</h3>
        <!-- 重置按钮 -->
        <button
          @click="resetSettings"
          class="text-muted-foreground hover:text-foreground border-border hover:border-foreground/20 flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors"
        >
          <RotateCcw class="h-4 w-4" />
          重置
        </button>
      </div>

      <!-- 卡片内容 -->
      <div class="p-6">
        <!-- 自动功能设置组件 -->
        <div class="mb-6">
          <AutoFunctionSettings
            ref="autoFunctionRef"
            v-model="autoFunctionSettings"
          />
        </div>

        <!-- 位置英雄设置组件 -->
        <PositionChampionSettings
          ref="positionChampionRef"
          v-model="positionSettings"
        />
      </div>
    </div>
  </div>
</template>
