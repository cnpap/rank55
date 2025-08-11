<script setup lang="ts">
import { ref, watch } from 'vue';
import { $local } from '@/storages/storage-use';
import { toast } from 'vue-sonner';
import { RotateCcw } from 'lucide-vue-next';
const savedAutoAccept = $local.getItem('autoAcceptGame');
const autoAcceptGame = ref(savedAutoAccept || false);

// 保存设置
function saveSettings() {
  $local.setItem('autoAcceptGame', autoAcceptGame.value);
  toast.success('游戏设置已保存');
}

// 监听设置变化并自动保存
watch(autoAcceptGame, () => {
  saveSettings();
});

// 重置设置
function resetSettings() {
  autoAcceptGame.value = false;
  saveSettings();
  toast.success('游戏设置已重置');
}

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <!-- 卡片容器 -->
  <div class="border-border bg-card rounded border">
    <!-- 卡片头部 -->
    <div
      class="border-border flex items-center justify-between border-b px-6 py-4"
    >
      <h3 class="text-foreground text-lg font-medium">游戏设置</h3>
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
      <!-- 自动接受游戏对局 -->
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-foreground font-medium">自动接受游戏对局</h4>
          <p class="text-muted-foreground mt-1 text-sm">
            当找到对局时自动接受，无需手动点击
          </p>
        </div>

        <!-- 开关 -->
        <label class="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            v-model="autoAcceptGame"
            class="peer sr-only"
          />
          <div
            class="bg-muted-foreground/20 peer relative h-6 w-11 rounded-full peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
          ></div>
        </label>
      </div>
    </div>
  </div>
</template>
