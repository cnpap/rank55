<script setup lang="ts">
import { reactive, ref } from 'vue';
import { toast } from 'vue-sonner';
import { type PositionSettings } from '@/storages/storage-use';
import AutoFunctionSettings from './AutoFunctionSettings.vue';
import PositionChampionSettings from './PositionChampionSettings.vue';
import { RotateCcw } from 'lucide-vue-next';
import Button from '../ui/button/Button.vue';

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
    <!-- 卡片头部 -->
    <div class="flex items-center justify-between px-6 py-4">
      <h3 class="text-foreground text-lg font-medium">依次禁选</h3>
      <!-- 重置按钮 -->
      <Button @click="resetSettings">
        <RotateCcw class="h-4 w-4" />
        重置
      </Button>
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
</template>
