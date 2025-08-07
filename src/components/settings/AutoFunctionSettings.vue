<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { $local } from '@/storages/storage-use';
import { Plus, Minus, Clock } from 'lucide-vue-next';
import { eventBus } from '@/lib/event-bus';

// Props
interface Props {
  modelValue?: {
    autoBanEnabled: boolean;
    autoPickEnabled: boolean;
    autoBanCountdown: number;
    autoPickCountdown: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    autoBanEnabled: false,
    autoPickEnabled: false,
    autoBanCountdown: 5,
    autoPickCountdown: 5,
  }),
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [
    value: {
      autoBanEnabled: boolean;
      autoPickEnabled: boolean;
      autoBanCountdown: number;
      autoPickCountdown: number;
    },
  ];
}>();

// 自动功能设置
const autoBanEnabled = ref(props.modelValue.autoBanEnabled);
const autoPickEnabled = ref(props.modelValue.autoPickEnabled);

// 倒计时设置
const autoBanCountdown = ref(props.modelValue.autoBanCountdown);
const autoPickCountdown = ref(props.modelValue.autoPickCountdown);

// 倒计时控制方法
function incrementBanCountdown() {
  if (autoBanCountdown.value < 15) {
    autoBanCountdown.value++;
    saveCountdownSettings();
  }
}

function decrementBanCountdown() {
  if (autoBanCountdown.value > 5) {
    autoBanCountdown.value--;
    saveCountdownSettings();
  }
}

function incrementPickCountdown() {
  if (autoPickCountdown.value < 15) {
    autoPickCountdown.value++;
    saveCountdownSettings();
  }
}

function decrementPickCountdown() {
  if (autoPickCountdown.value > 5) {
    autoPickCountdown.value--;
    saveCountdownSettings();
  }
}

// 保存倒计时设置
function saveCountdownSettings() {
  try {
    $local.setItem('autoBanCountdown', autoBanCountdown.value);
    $local.setItem('autoPickCountdown', autoPickCountdown.value);
    emitUpdate();
  } catch (error) {
    console.error('保存倒计时设置失败:', error);
  }
}

// 保存自动功能设置
function saveAutoSettings() {
  try {
    $local.setItem('autoBanEnabled', autoBanEnabled.value);
    $local.setItem('autoPickEnabled', autoPickEnabled.value);

    // 发送事件通知
    if (autoBanEnabled.value) {
      eventBus.emit('auto-ban:enable');
    } else {
      eventBus.emit('auto-ban:disable');
    }

    if (autoPickEnabled.value) {
      eventBus.emit('auto-pick:enable');
    } else {
      eventBus.emit('auto-pick:disable');
    }

    toast.success('自动功能设置已保存');
    emitUpdate();
  } catch (error) {
    console.error('保存自动功能设置失败:', error);
    toast.error('保存自动功能设置失败');
  }
}

// 发送更新事件
function emitUpdate() {
  emit('update:modelValue', {
    autoBanEnabled: autoBanEnabled.value,
    autoPickEnabled: autoPickEnabled.value,
    autoBanCountdown: autoBanCountdown.value,
    autoPickCountdown: autoPickCountdown.value,
  });
}

// 加载设置
function loadSettings() {
  try {
    // 加载自动功能设置
    autoBanEnabled.value = $local.getItem('autoBanEnabled') || false;
    autoPickEnabled.value = $local.getItem('autoPickEnabled') || false;

    // 加载倒计时设置
    autoBanCountdown.value = $local.getItem('autoBanCountdown') || 5;
    autoPickCountdown.value = $local.getItem('autoPickCountdown') || 5;

    emitUpdate();
  } catch (error) {
    console.error('加载自动功能设置失败:', error);
  }
}

// 重置设置
function resetSettings() {
  autoBanEnabled.value = false;
  autoPickEnabled.value = false;
  autoBanCountdown.value = 5;
  autoPickCountdown.value = 5;
  saveAutoSettings();
  saveCountdownSettings();
}

// 监听自动功能设置变化
watch([autoBanEnabled, autoPickEnabled], () => {
  saveAutoSettings();
});

onMounted(() => {
  loadSettings();

  // 如果已经开启自动功能，发送启用事件
  if (autoBanEnabled.value) {
    eventBus.emit('auto-ban:enable');
  }
  if (autoPickEnabled.value) {
    eventBus.emit('auto-pick:enable');
  }
});

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="bg-muted/30 space-y-4 rounded-lg">
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <!-- 自动禁用英雄 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-foreground text-sm font-medium">自动禁用</span>
            <p class="text-muted-foreground text-xs">
              BP 阶段自动禁用配置的英雄
            </p>
          </div>
          <!-- 开关 -->
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              v-model="autoBanEnabled"
              class="peer sr-only"
            />
            <div
              class="bg-muted-foreground/20 peer relative h-5 w-9 rounded-full peer-checked:bg-red-500 peer-focus:ring-4 peer-focus:ring-red-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
            ></div>
          </label>
        </div>

        <!-- 倒计时设置 -->
        <div class="flex items-center gap-2">
          <Clock class="text-muted-foreground h-4 w-4" />
          <span class="text-muted-foreground text-xs">倒计时剩余</span>
          <div class="flex items-center gap-1">
            <button
              @click="decrementBanCountdown"
              :disabled="autoBanCountdown <= 5"
              class="border-border bg-background text-foreground hover:bg-muted flex h-6 w-6 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus class="h-3 w-3" />
            </button>
            <div
              class="border-border bg-background flex h-6 w-8 items-center justify-center rounded border text-xs font-medium"
            >
              {{ autoBanCountdown }}
            </div>
            <button
              @click="incrementBanCountdown"
              :disabled="autoBanCountdown >= 15"
              class="border-border bg-background text-foreground hover:bg-muted flex h-6 w-6 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus class="h-3 w-3" />
            </button>
          </div>
          <span class="text-muted-foreground text-xs">秒时执行</span>
        </div>
      </div>

      <!-- 自动选择英雄 -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-foreground text-sm font-medium">自动选择</span>
            <p class="text-muted-foreground text-xs">
              BP 阶段自动选择配置的英雄
            </p>
          </div>
          <!-- 开关 -->
          <label class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              v-model="autoPickEnabled"
              class="peer sr-only"
            />
            <div
              class="bg-muted-foreground/20 peer relative h-5 w-9 rounded-full peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-300/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
            ></div>
          </label>
        </div>

        <!-- 倒计时设置 -->
        <div class="flex items-center gap-2">
          <Clock class="text-muted-foreground h-4 w-4" />
          <span class="text-muted-foreground text-xs">倒计时剩余</span>
          <div class="flex items-center gap-1">
            <button
              @click="decrementPickCountdown"
              :disabled="autoPickCountdown <= 5"
              class="border-border bg-background text-foreground hover:bg-muted flex h-6 w-6 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus class="h-3 w-3" />
            </button>
            <div
              class="border-border bg-background flex h-6 w-8 items-center justify-center rounded border text-xs font-medium"
            >
              {{ autoPickCountdown }}
            </div>
            <button
              @click="incrementPickCountdown"
              :disabled="autoPickCountdown >= 15"
              class="border-border bg-background text-foreground hover:bg-muted flex h-6 w-6 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus class="h-3 w-3" />
            </button>
          </div>
          <span class="text-muted-foreground text-xs">秒时执行</span>
        </div>
      </div>
    </div>
  </div>
</template>
