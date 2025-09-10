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

const selectedChampionIds = computed(() =>
  props.selectedChampions.map(c => c.id.toString())
);

function handleClose() {
  searchTerm.value = '';
  emit('close');
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
      class="flex h-[85vh] w-[90vw] max-w-6xl flex-col p-0"
      @pointer-down-outside="handleClose"
    >
      <!-- 简化的标题栏 -->
      <div
        class="flex flex-shrink-0 items-center justify-between border-b px-6 py-4"
      >
        <div
          class="flex items-center gap-3 object-cover opacity-70 brightness-0 dark:invert"
        >
          <img
            :src="`./role/${position.icon}`"
            :alt="position.name"
            class="h-8 w-8"
          />
          <span class="text-lg font-semibold">{{ position.name }}</span>
        </div>
        <AlertDialogCancel asChild>
          <Button variant="ghost" size="icon">
            <X class="h-4 w-4" />
          </Button>
        </AlertDialogCancel>
      </div>

      <!-- 内容区域 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- 已选英雄区域 - 始终显示，避免布局抖动 -->
        <div
          v-if="selectedChampions.length > 0"
          class="flex-shrink-0 px-6 py-3"
        >
          <SelectedChampionsList
            :champions="selectedChampions"
            :type="selectionType"
            @remove="handleRemoveChampion"
            @reorder="handleReorderChampions"
          />
        </div>

        <!-- 搜索区域 -->
        <div class="flex-shrink-0 px-6 py-4">
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

        <!-- 英雄列表区域 -->
        <div class="bg-background mx-6 mb-4 flex-1 overflow-hidden border">
          <ChampionList
            :champions="champions"
            :selected-champion-ids="selectedChampionIds"
            :search-term="searchTerm"
            :is-loading="isLoading"
            :selection-type="selectionType"
            @toggle-champion="handleToggleChampion"
          />
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>
