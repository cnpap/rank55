<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { staticAssets } from '@/assets/data-assets';
import type { ChampionSummary } from '@/types/lol-game-data';
import { X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  champion: ChampionSummary;
  runes: [number, number]; // 天赋配置 [主系, 副系]
}

interface Emits {
  (e: 'update:open', open: boolean): void;
  (e: 'runes-change', runes: [number, number]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 天赋系统配置
const availableRunes = [
  { id: 8000, name: '精密', key: 'Precision' },
  { id: 8100, name: '主宰', key: 'Domination' },
  { id: 8200, name: '巫术', key: 'Sorcery' },
  { id: 8300, name: '坚决', key: 'Resolve' },
  { id: 8400, name: '启迪', key: 'Inspiration' },
];

// 当前选中的天赋
const selectedRunes = ref<[number, number]>([...props.runes]);

// 获取当前天赋
const currentRunes = computed(() => {
  return selectedRunes.value;
});

// 获取英雄头像URL
function getChampionImageUrl(championKey: string | number): string {
  return staticAssets.getChampionIcon(championKey as string);
}

// 处理天赋选择
function selectRune(runeId: number, slotIndex: 0 | 1) {
  const newRunes: [number, number] = [...selectedRunes.value];

  // 确保主系和副系不能相同
  if (slotIndex === 0) {
    // 选择主系时，如果副系和主系相同，则清空副系
    if (newRunes[1] === runeId) {
      newRunes[1] = availableRunes.find(r => r.id !== runeId)?.id || 8100;
    }
  } else {
    // 选择副系时，如果和主系相同，则不允许选择
    if (newRunes[0] === runeId) {
      return;
    }
  }

  newRunes[slotIndex] = runeId;
  selectedRunes.value = newRunes;
  emit('runes-change', newRunes);
}

// 关闭模态框
function handleCloseModal() {
  emit('update:open', false);
}

// 获取天赋名称
function getRuneName(runeId: number): string {
  const rune = availableRunes.find(r => r.id === runeId);
  return rune?.name || `天赋${runeId}`;
}

// 监听props变化，同步更新本地状态
function updateLocalRunes() {
  selectedRunes.value = [...props.runes];
}

// 当props.runes变化时更新本地状态
watch(() => props.runes, updateLocalRunes, { immediate: true });
</script>

<template>
  <!-- 配置模态框 -->
  <AlertDialog :open="open" @update:open="value => emit('update:open', value)">
    <AlertDialogContent
      class="flex h-[80vh] w-[90vw] max-w-4xl flex-col !gap-0 !p-0"
      @pointer-down-outside="handleCloseModal"
    >
      <!-- 标题栏 -->
      <div class="bg-background border-border border-b">
        <div
          class="bg-background flex h-10 w-full items-center justify-between"
        >
          <!-- 左侧标题区域 -->
          <div class="flex h-full flex-1 items-center px-4 select-none">
            <div class="flex items-center gap-3">
              <img
                :src="getChampionImageUrl(champion.id)"
                :alt="champion.name"
                class="h-6 w-6 object-cover"
              />
              <h1 class="text-foreground text-sm font-medium">
                {{ champion.name }} - 天赋配置
              </h1>
            </div>
          </div>

          <!-- 右侧关闭按钮 -->
          <div class="flex h-full items-center">
            <AlertDialogCancel asChild class="border-none">
              <Button
                variant="ghost"
                class="control-btn close-btn border-radius-0 h-10 w-10"
              >
                <X class="h-4 w-4" />
              </Button>
            </AlertDialogCancel>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <!-- 当前配置预览 -->
        <div class="flex items-center gap-6 border-b p-4">
          <!-- 天赋预览 -->
          <div class="flex items-center gap-2">
            <img
              :src="staticAssets.getRuneIcon(`${currentRunes[0]}`)"
              :alt="`主系天赋${currentRunes[0]}`"
              class="border-border/40 h-8 w-8 border"
            />
            <img
              :src="staticAssets.getRuneIcon(`${currentRunes[1]}`)"
              :alt="`副系天赋${currentRunes[1]}`"
              class="border-border/40 h-8 w-8 border"
            />
          </div>
        </div>

        <!-- 配置区域 -->
        <div class="flex-1 space-y-6 overflow-auto p-6">
          <!-- 天赋配置 -->
          <div class="space-y-4">
            <h3 class="text-foreground text-lg font-medium">天赋</h3>

            <!-- 主系天赋 -->
            <div>
              <div class="text-muted-foreground mb-3 text-sm">主系天赋</div>
              <div class="grid grid-cols-4 gap-4">
                <div
                  v-for="rune in availableRunes"
                  :key="`primary-${rune.id}`"
                  @click="selectRune(rune.id, 0)"
                  class="relative cursor-pointer border p-3 transition-transform"
                  :class="{
                    'border-primary bg-primary/10': currentRunes[0] === rune.id,
                    'hover:border-border border-transparent':
                      currentRunes[0] !== rune.id,
                  }"
                >
                  <div class="flex flex-col items-center gap-2">
                    <img
                      :src="staticAssets.getRuneIcon(`${rune.id}`)"
                      :alt="rune.name"
                      :title="rune.name"
                      class="h-12 w-12"
                    />
                    <span class="text-center text-xs font-medium">{{
                      rune.name
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 副系天赋 -->
            <div>
              <div class="text-muted-foreground mb-3 text-sm">副系天赋</div>
              <div class="grid grid-cols-4 gap-4">
                <div
                  v-for="rune in availableRunes"
                  :key="`secondary-${rune.id}`"
                  @click="selectRune(rune.id, 1)"
                  class="relative cursor-pointer border p-3 transition-transform"
                  :class="{
                    'border-primary bg-primary/10': currentRunes[1] === rune.id,
                    'hover:border-border border-transparent':
                      currentRunes[1] !== rune.id &&
                      currentRunes[0] !== rune.id,
                    'cursor-not-allowed opacity-50':
                      currentRunes[0] === rune.id,
                  }"
                >
                  <div class="flex flex-col items-center gap-2">
                    <img
                      :src="staticAssets.getRuneIcon(`${rune.id}`)"
                      :alt="rune.name"
                      :title="
                        currentRunes[0] === rune.id
                          ? '不能选择与主系相同的天赋'
                          : rune.name
                      "
                      class="h-12 w-12"
                      :class="{ 'opacity-70': currentRunes[1] === rune.id }"
                    />
                    <span class="text-center text-xs font-medium">{{
                      rune.name
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
/* 模态框控制按钮样式 */
.control-btn {
  border-radius: 0 !important;
  transition: all 0.15s ease !important;
}

.control-btn:hover {
  background-color: var(--muted) !important;
}

.control-btn:active {
  transform: scale(0.95);
}

.close-btn:hover {
  background-color: #ef4444 !important;
  color: white !important;
}

/* SVG 图标样式 */
.control-btn svg {
  transition: all 0.15s ease;
}

.control-btn:hover svg {
  opacity: 0.8;
}
</style>
