<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChampionData } from '@/types/champion';

// Props
interface Props {
  champions: ChampionData[];
  searchTerm?: string;
  sortBy?: string;
  selectedTags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  searchTerm: '',
  sortBy: 'name-asc',
  selectedTags: () => [],
});

// Emits
interface Emits {
  'update:searchTerm': [value: string];
  'update:sortBy': [value: string];
  'update:selectedTags': [value: string[]];
  'filtered-champions': [champions: ChampionData[]];
}

const emit = defineEmits<Emits>();

// 内部状态
const filterState = reactive({
  searchTerm: props.searchTerm,
  sortBy: props.sortBy,
  selectedTags: [...props.selectedTags],
});

// 监听 props 变化，同步内部状态
watch(
  () => props.searchTerm,
  newVal => {
    filterState.searchTerm = newVal;
  }
);

watch(
  () => props.sortBy,
  newVal => {
    filterState.sortBy = newVal;
  }
);

watch(
  () => props.selectedTags,
  newVal => {
    filterState.selectedTags = [...newVal];
  },
  { deep: true }
);

// 过滤和排序后的英雄列表
const filteredChampions = computed(() => {
  let filtered = props.champions;

  // 搜索过滤
  if (filterState.searchTerm) {
    const searchLower = filterState.searchTerm.toLowerCase();
    filtered = filtered.filter(
      champion =>
        champion.name.toLowerCase().includes(searchLower) ||
        champion.title.toLowerCase().includes(searchLower) ||
        champion.id.toLowerCase().includes(searchLower)
    );
  }

  // 标签过滤
  if (filterState.selectedTags.length > 0) {
    filtered = filtered.filter(champion =>
      filterState.selectedTags.every(tag => champion.tags.includes(tag))
    );
  }

  // 排序
  return filtered.sort((a, b) => {
    switch (filterState.sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'attack-desc':
        return b.info.attack - a.info.attack;
      case 'defense-desc':
        return b.info.defense - a.info.defense;
      case 'magic-desc':
        return b.info.magic - a.info.magic;
      default:
        return 0;
    }
  });
});

// 可用标签列表
const availableTags = computed(() => {
  const tagCounts = new Map<string, number>();

  props.champions.forEach(champion => {
    champion.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, count]) => ({
      value: tag,
      label: `${getTagName(tag)} (${count})`,
    }));
});

// 获取标签中文名
function getTagName(tag: string): string {
  const tagNames: Record<string, string> = {
    Fighter: '战士',
    Tank: '坦克',
    Assassin: '刺客',
    Mage: '法师',
    Marksman: '射手',
    Support: '辅助',
  };
  return tagNames[tag] || tag;
}

// 切换标签选择
function toggleTag(tagValue: string) {
  const index = filterState.selectedTags.indexOf(tagValue);
  if (index > -1) {
    filterState.selectedTags.splice(index, 1);
  } else {
    filterState.selectedTags.push(tagValue);
  }
  emit('update:selectedTags', [...filterState.selectedTags]);
}

// 更新搜索词 - 修复类型错误
function updateSearchTerm(value: unknown) {
  const stringValue = String(value);
  filterState.searchTerm = stringValue;
  emit('update:searchTerm', stringValue);
}

// 更新排序方式 - 修复类型错误
function updateSortBy(value: unknown) {
  if (value !== null && value !== undefined) {
    const stringValue = String(value);
    filterState.sortBy = stringValue;
    emit('update:sortBy', stringValue);
  }
}

// 监听过滤结果变化，向父组件发送
watch(
  filteredChampions,
  newChampions => {
    emit('filtered-champions', newChampions);
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-6">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Input
          :model-value="filterState.searchTerm"
          @update:model-value="updateSearchTerm"
          placeholder="搜索英雄..."
          class="w-64"
        />
        <Select
          :model-value="filterState.sortBy"
          @update:model-value="updateSortBy"
        >
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">名称 A-Z</SelectItem>
            <SelectItem value="name-desc">名称 Z-A</SelectItem>
            <SelectItem value="attack-desc">攻击力从高到低</SelectItem>
            <SelectItem value="defense-desc">防御力从高到低</SelectItem>
            <SelectItem value="magic-desc">法术强度从高到低</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- 标签过滤区域 - 统一装备样式 -->
    <div v-if="availableTags.length > 0" class="">
      <div class="mb-3">
        <h3 class="text-foreground text-sm font-medium">英雄类型筛选</h3>
        <p class="text-muted-foreground mt-1 text-xs">
          点击标签进行筛选，再次点击取消选择
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag.value"
          :class="[
            'focus:ring-ring inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 select-none focus:ring-2 focus:ring-offset-2 focus:outline-none',
            filterState.selectedTags.includes(tag.value)
              ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 border shadow-sm'
              : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 border hover:shadow-sm',
          ]"
          @click="toggleTag(tag.value)"
        >
          <span class="truncate">{{ tag.label }}</span>
        </button>
      </div>
      <div
        v-if="filterState.selectedTags.length > 0"
        class="border-border mt-4 border-t pt-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs">
            已选择 {{ filterState.selectedTags.length }} 个标签
          </span>
          <button
            @click="
              filterState.selectedTags = [];
              emit('update:selectedTags', []);
            "
            class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors duration-200 hover:underline"
          >
            清除所有
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
