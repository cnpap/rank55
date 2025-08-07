<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { $local, type PositionSettings } from '@/storages/storage-use';
import type { ChampionData } from '@/types/champion';
import ChampionSelector from './ChampionSelector.vue';
import { Ban, Plus, Users } from 'lucide-vue-next';
import { dataUtils } from '@/assets/versioned-assets';
import { staticAssets } from '@/assets/data-assets';

// Props
interface Props {
  modelValue?: PositionSettings;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    top: { banChampions: [], pickChampions: [] },
    jungle: { banChampions: [], pickChampions: [] },
    mid: { banChampions: [], pickChampions: [] },
    adc: { banChampions: [], pickChampions: [] },
    support: { banChampions: [], pickChampions: [] },
  }),
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: PositionSettings];
}>();

// 游戏位置定义
const positions = [
  {
    key: 'top',
    name: '上单',
    icon: 'top.png',
  },
  {
    key: 'jungle',
    name: '打野',
    icon: 'jungle.png',
  },
  {
    key: 'mid',
    name: '中单',
    icon: 'middle.png',
  },
  {
    key: 'adc',
    name: 'ADC',
    icon: 'bottom.png',
  },
  {
    key: 'support',
    name: '辅助',
    icon: 'support.png',
  },
];

// 英雄数据
const champions = ref<ChampionData[]>([]);
const isLoadingChampions = ref(false);

// 位置设置
const positionSettings = reactive<PositionSettings>({ ...props.modelValue });

// 英雄选择状态
const championSelection = reactive({
  isOpen: false,
  currentPosition: '',
  currentType: '', // 'ban' 或 'pick'
});

// 当前选择的英雄列表
const currentSelectedChampions = computed(() => {
  if (!championSelection.currentPosition || !championSelection.currentType)
    return [];

  const setting = positionSettings[championSelection.currentPosition];
  const championIds =
    championSelection.currentType === 'ban'
      ? setting.banChampions
      : setting.pickChampions;

  return championIds
    .map(id => getChampionById(id))
    .filter(Boolean) as ChampionData[];
});

// 当前位置信息
const currentPosition = computed(() => {
  return (
    positions.find(p => p.key === championSelection.currentPosition) ||
    positions[0]
  );
});

// 加载英雄数据
async function loadChampionData() {
  if (champions.value.length > 0) return;

  isLoadingChampions.value = true;
  try {
    const championData = await dataUtils.fetchChampionData();
    champions.value = Object.values(championData.data);
  } catch (error) {
    console.error('加载英雄数据失败:', error);
    toast.error('英雄数据加载失败');
  } finally {
    isLoadingChampions.value = false;
  }
}

// 加载设置
function loadSettings() {
  try {
    const savedPositionSettings = $local.getItem('positionSettings');
    if (savedPositionSettings) {
      Object.assign(positionSettings, savedPositionSettings);
      emitUpdate();
    }
  } catch (error) {
    console.error('加载位置设置失败:', error);
  }
}

// 保存设置
function saveSettings() {
  try {
    $local.setItem('positionSettings', positionSettings);
    toast.success('位置设置已保存');
    emitUpdate();
  } catch (error) {
    console.error('保存位置设置失败:', error);
    toast.error('保存位置设置失败');
  }
}

// 发送更新事件
function emitUpdate() {
  emit('update:modelValue', { ...positionSettings });
}

// 重置设置
function resetSettings() {
  Object.keys(positionSettings).forEach(key => {
    positionSettings[key] = { banChampions: [], pickChampions: [] };
  });
  saveSettings();
}

// 打开英雄选择器
function openChampionSelector(position: string, type: 'ban' | 'pick') {
  championSelection.currentPosition = position;
  championSelection.currentType = type;
  championSelection.isOpen = true;
  loadChampionData();
}

// 关闭英雄选择器
function closeChampionSelector() {
  championSelection.isOpen = false;
}

// 切换英雄选择状态
function toggleChampion(champion: ChampionData) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];

  if (currentType === 'ban') {
    const index = setting.banChampions.indexOf(champion.id);
    if (index > -1) {
      setting.banChampions.splice(index, 1);
    } else {
      setting.banChampions.push(champion.id);
    }
  } else {
    const index = setting.pickChampions.indexOf(champion.id);
    if (index > -1) {
      setting.pickChampions.splice(index, 1);
    } else {
      setting.pickChampions.push(champion.id);
    }
  }

  saveSettings();
}

// 从已选列表中移除英雄
function removeChampion(index: number) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];

  if (currentType === 'ban') {
    setting.banChampions.splice(index, 1);
  } else {
    setting.pickChampions.splice(index, 1);
  }

  saveSettings();
}

// 重新排序英雄
function reorderChampions(newChampions: ChampionData[]) {
  const { currentPosition, currentType } = championSelection;
  const setting = positionSettings[currentPosition];
  const newIds = newChampions.map(c => c.id);

  if (currentType === 'ban') {
    setting.banChampions.splice(0, setting.banChampions.length, ...newIds);
  } else {
    setting.pickChampions.splice(0, setting.pickChampions.length, ...newIds);
  }

  saveSettings();
}

// 获取英雄信息
function getChampionById(championId: string): ChampionData | undefined {
  return champions.value.find(c => c.id === championId);
}

function getChampionImageUrl(championKey: string): string {
  return staticAssets.getChampionIcon(championKey);
}

function getPositionIconUrl(iconName: string): string {
  return `./role/${iconName}`;
}

onMounted(() => {
  loadSettings();
  loadChampionData();
});

// 暴露方法给父组件
defineExpose({
  resetSettings,
});
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="position in positions"
      :key="position.key"
      class="flex items-center gap-4"
    >
      <!-- 位置图标 -->
      <div class="flex min-w-[56px] items-center justify-center">
        <div
          class="bg-muted/50 border-border/50 flex h-[56px] w-[56px] items-center justify-center rounded border p-3"
        >
          <img
            :src="getPositionIconUrl(position.icon)"
            :alt="position.name"
            :title="position.name"
            class="h-6 w-6 object-cover opacity-70"
          />
        </div>
      </div>

      <!-- 禁用框 -->
      <div class="flex-1">
        <div class="relative">
          <div
            class="flex h-[56px] items-center justify-center rounded border-2 border-dashed border-red-200 bg-red-50/30 p-2 dark:border-red-800/50 dark:bg-red-950/20"
          >
            <div
              v-if="positionSettings[position.key].banChampions.length === 0"
              class="text-muted-foreground flex items-center gap-2 text-xs"
            >
              <Ban class="h-3 w-3 text-red-500/60" />
              <span>当我是{{ position.name }}时点击右侧按钮选择禁用英雄</span>
            </div>
            <div v-else class="flex flex-wrap justify-center gap-1">
              <img
                v-for="championId in positionSettings[position.key]
                  .banChampions"
                :key="championId"
                :src="
                  getChampionImageUrl(getChampionById(championId)?.key || '')
                "
                :alt="getChampionById(championId)?.name"
                :title="getChampionById(championId)?.name"
                class="h-8 w-8 rounded border border-red-400 object-cover"
              />
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'ban')"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- 选用框 -->
      <div class="flex-1">
        <div class="relative">
          <div
            class="flex h-[56px] items-center justify-center rounded border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-2 dark:border-emerald-800/50 dark:bg-emerald-950/20"
          >
            <div
              v-if="positionSettings[position.key].pickChampions.length === 0"
              class="text-muted-foreground flex items-center gap-2 text-xs"
            >
              <Users class="h-3 w-3 text-emerald-500/60" />
              <span>当我是{{ position.name }}时点击右侧按钮选择优先英雄</span>
            </div>
            <div v-else class="flex flex-wrap justify-center gap-1">
              <img
                v-for="championId in positionSettings[position.key]
                  .pickChampions"
                :key="championId"
                :src="
                  getChampionImageUrl(getChampionById(championId)?.key || '')
                "
                :alt="getChampionById(championId)?.name"
                :title="getChampionById(championId)?.name"
                class="h-8 w-8 rounded border border-emerald-400 object-cover"
              />
            </div>
          </div>

          <!-- 嵌入的选择按钮 -->
          <button
            @click="openChampionSelector(position.key, 'pick')"
            class="absolute top-1/2 -right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- 英雄选择器组件 -->
    <ChampionSelector
      :is-open="championSelection.isOpen"
      :champions="champions"
      :selected-champions="currentSelectedChampions"
      :position="currentPosition"
      :selection-type="championSelection.currentType as 'ban' | 'pick'"
      :is-loading="isLoadingChampions"
      @close="closeChampionSelector"
      @toggle-champion="toggleChampion"
      @remove-champion="removeChampion"
      @reorder-champions="reorderChampions"
    />
  </div>
</template>
