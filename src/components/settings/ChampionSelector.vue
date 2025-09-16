<script setup lang="ts">
import { ref, computed } from 'vue';
import ChampionList from './ChampionList.vue';
import SelectedChampionsList from './SelectedChampionsList.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
} from '@/components/ui/alert-dialog';
import { Search, X } from 'lucide-vue-next';
import { ChampionSummary } from '@/types/lol-game-data';
import { positions } from '@/config/position-config';
import type { AssignedPosition } from '@/types/players-info';

interface Props {
  isOpen: boolean;
  champions: ChampionSummary[];
  selectedChampions: ChampionSummary[];
  position: { key: string; name: string; icon: string };
  selectionType: 'ban' | 'pick';
  isLoading: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'toggle-champion', champion: ChampionSummary): void;
  (e: 'remove-champion', index: number): void;
  (e: 'reorder-champions', champions: ChampionSummary[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchTerm = ref('');
const selectedPositionFilter = ref<AssignedPosition | 'all'>(
  props.position.key as AssignedPosition
);

// 排序状态管理
type SortBy = 'tier' | 'winRate';
const sortBy = ref<SortBy>('tier'); // 默认按强度排序

const selectedChampionIds = computed(() =>
  props.selectedChampions.map(c => c.id.toString())
);

function handleClose() {
  searchTerm.value = '';
  selectedPositionFilter.value = 'all';
  emit('close');
}

function selectPositionFilter(position: AssignedPosition | 'all') {
  selectedPositionFilter.value = position;
}

// 切换排序方式
function setSortBy(newSortBy: SortBy) {
  sortBy.value = newSortBy;
}

function handleToggleChampion(champion: ChampionSummary) {
  emit('toggle-champion', champion);
}

function handleRemoveChampion(index: number) {
  emit('remove-champion', index);
}

function handleReorderChampions(champions: ChampionSummary[]) {
  emit('reorder-champions', champions);
}
</script>

<template>
  <AlertDialog
    :open="isOpen"
    @update:open="
      open => {
        if (!open) handleClose();
      }
    "
  >
    <AlertDialogContent
      class="flex h-[85vh] w-[90vw] max-w-6xl flex-col !gap-0 !p-0"
      @pointer-down-outside="handleClose"
    >
      <!-- 优化的标题栏 -->
      <div class="bg-background border-border border-b">
        <div
          class="bg-background flex h-10 w-full items-center justify-between"
        >
          <!-- 左侧标题区域 -->
          <div class="flex h-full flex-1 items-center px-4 select-none">
            <div class="flex items-center gap-3">
              <img
                :src="`./role/${position.icon}`"
                :alt="position.name"
                class="h-6 w-6 object-cover opacity-70 brightness-0 dark:invert"
              />
              <h1 class="text-foreground text-sm font-medium">
                {{ position.name }} -
                {{ selectionType === 'ban' ? '禁用英雄' : '优选英雄' }}
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
        <!-- 已选英雄区域 -->
        <div v-if="selectedChampions.length > 0" class="flex-shrink-0">
          <SelectedChampionsList
            :champions="selectedChampions"
            :type="selectionType"
            @remove="handleRemoveChampion"
            @reorder="handleReorderChampions"
          />
        </div>

        <!-- 搜索区域 -->
        <div class="flex-shrink-0 px-3 pb-3">
          <div class="relative">
            <Search
              class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            />
            <Input
              v-model="searchTerm"
              type="text"
              placeholder="搜索英雄名称、拼音，例如 安妮、an、anni..."
              class="pl-10"
            />
          </div>
        </div>

        <!-- 位置过滤区域 -->
        <div class="flex-shrink-0">
          <div class="border-border flex h-10 items-center border-y">
            <!-- 全部选项 -->
            <button
              @click="selectPositionFilter('all')"
              class="relative flex h-full flex-1 items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
              :class="{
                'bg-primary/10': selectedPositionFilter === 'all',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50':
                  selectedPositionFilter !== 'all',
              }"
            >
              <span>全部</span>
              <!-- 活跃指示器 -->
              <div
                v-if="selectedPositionFilter === 'all'"
                class="bg-primary absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2"
              ></div>
            </button>

            <!-- 位置选项 -->
            <button
              v-for="position in positions"
              :key="position.key"
              @click="selectPositionFilter(position.key)"
              class="relative flex h-full flex-1 items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
              :class="{
                'bg-primary/10': selectedPositionFilter === position.key,
                'text-muted-foreground hover:text-foreground hover:bg-muted/50':
                  selectedPositionFilter !== position.key,
              }"
            >
              <img
                :src="`./role/${position.icon}`"
                :alt="position.name"
                class="h-4 w-4 object-cover opacity-70 brightness-0 dark:invert"
              />
              <span>{{ position.name }}</span>
              <!-- 活跃指示器 -->
              <div
                v-if="selectedPositionFilter === position.key"
                class="bg-primary absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2"
              ></div>
            </button>
          </div>
        </div>

        <!-- 英雄列表区域 -->
        <div class="bg-background flex min-h-0 flex-1 flex-col">
          <!-- 英雄列表 - 可滚动区域 -->
          <div class="flex-1 overflow-hidden">
            <ChampionList
              :champions="champions"
              :selected-champion-ids="selectedChampionIds"
              :search-term="searchTerm"
              :position-filter="selectedPositionFilter"
              :is-loading="isLoading"
              :selection-type="selectionType"
              :sort-by="sortBy"
              @toggle-champion="handleToggleChampion"
            />
          </div>

          <!-- 固定表头 - 底部 -->
          <div
            v-if="!isLoading"
            class="bg-background border-border flex h-10 flex-shrink-0 items-center border-t px-6"
          >
            <!-- 英雄/位置 -->
            <div
              class="text-muted-foreground relative flex h-full items-center justify-start text-sm font-medium"
              style="width: 200px"
            >
              <span>英雄/位置</span>
            </div>

            <!-- 强度 -->
            <button
              @click="setSortBy('tier')"
              class="relative flex h-full flex-1 items-center justify-center text-sm font-medium transition-all duration-200"
              :class="{
                'bg-primary/10 text-foreground': sortBy === 'tier',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50':
                  sortBy !== 'tier',
              }"
            >
              <span>强度</span>
              <!-- 活跃指示器 -->
              <div
                v-if="sortBy === 'tier'"
                class="bg-primary absolute top-0 left-1/2 h-0.5 w-full -translate-x-1/2"
              ></div>
            </button>

            <!-- 胜率 -->
            <button
              @click="setSortBy('winRate')"
              class="relative flex h-full flex-1 items-center justify-center text-sm font-medium transition-all duration-200"
              :class="{
                'bg-primary/10 text-foreground': sortBy === 'winRate',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50':
                  sortBy !== 'winRate',
              }"
            >
              <span>胜率</span>
              <!-- 活跃指示器 -->
              <div
                v-if="sortBy === 'winRate'"
                class="bg-primary absolute top-0 left-1/2 h-0.5 w-full -translate-x-1/2"
              ></div>
            </button>

            <!-- 状态 -->
            <div
              class="text-muted-foreground relative flex h-full w-16 items-center justify-center text-sm font-medium"
            >
              <span>状态</span>
            </div>
          </div>
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
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
