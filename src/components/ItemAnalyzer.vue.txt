<script setup lang="ts">
import { reactive, onMounted, computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'vue-sonner';
import ItemIconView from './ItemIconView.vue';
import ItemDetailView from './ItemDetailView.vue';
import AttributeConfigDialog from './AttributeConfigDialog.vue';
import {
  type AttributeValues,
  type FilterOptions,
  defaultAttributeValues,
  processItems,
  filterItems,
  sortItems,
} from '@/utils/item-calculator';
import type { ItemTiny, ItemTinyData, TagData } from '@/types/item';
import { dataUtils } from '@/assets/versioned-assets';

// 显示模式
const viewMode = ref<'icon' | 'detail'>('icon');
const showAttributeDialog = ref(false);
const showEfficiencyBadge = ref(false); // 控制评级显示

// 属性价值配置
const attributeValues = reactive<AttributeValues>({
  ...defaultAttributeValues,
});

// 组件状态
const state = reactive({
  items: [] as ItemTinyData[],
  tagData: null as TagData | null,
  isLoading: false,
  searchTerm: '',
  sortBy: 'price-desc',
  filterBy: 'all',
  selectedTags: [] as string[],
  loadStatus: '等待加载装备数据...',
});

// 过滤和排序后的装备列表
const filteredItems = computed(() => {
  const filters: FilterOptions = {
    searchTerm: state.searchTerm,
    filterBy: state.filterBy,
    tagFilter: state.selectedTags,
  };
  const filtered = filterItems(state.items, filters);
  return sortItems(filtered, state.sortBy);
});

// 可用标签列表
const availableTags = computed(() => {
  if (!state.tagData || !state.tagData.tags) return [];
  return Object.keys(state.tagData.tags)
    .sort()
    .map(tag => ({
      value: tag,
      label: `${state.tagData!.tags[tag].chineseName || tag} (${state.tagData!.tags[tag].count})`,
    }));
});

// 加载装备数据
async function loadItemData() {
  state.isLoading = true;
  state.loadStatus = '正在加载装备数据...';
  try {
    const itemData = await dataUtils.fetchItemData();
    const tagData = await dataUtils.fetchItemTags();
    state.tagData = tagData;
    state.items = processItems(itemData, attributeValues);
    state.loadStatus = `数据加载完成！共 ${state.items.length} 个装备`;
    toast.success('装备数据加载成功！');
  } catch (error) {
    console.error('加载装备数据失败:', error);
    state.loadStatus = '数据加载失败: ' + (error as Error).message;
    toast.error('装备数据加载失败');
  } finally {
    state.isLoading = false;
  }
}

// 应用属性配置
function applyAttributeConfig(newValues: AttributeValues) {
  Object.assign(attributeValues, newValues);
  recalculateValues();
}

// 重新计算价值
function recalculateValues() {
  if (state.items.length > 0) {
    // 重新处理所有装备数据
    const itemData: ItemTiny = {
      type: 'ItemTiny',
      version: '1.0',
      data: {},
    };
    state.items.forEach(item => {
      itemData.data[item.id] = item;
    });
    state.items = processItems(itemData, attributeValues);
    toast.success('价值重新计算完成！');
  }
}

// 切换标签选择
function toggleTag(tagValue: string) {
  const index = state.selectedTags.indexOf(tagValue);
  if (index > -1) {
    state.selectedTags.splice(index, 1);
  } else {
    state.selectedTags.push(tagValue);
  }
}

onMounted(() => {
  loadItemData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- 工具栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Input
          v-model="state.searchTerm"
          placeholder="搜索装备..."
          class="w-64"
        />
        <Select v-model="state.sortBy">
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efficiency-desc">性价比从高到低</SelectItem>
            <SelectItem value="efficiency-asc">性价比从低到高</SelectItem>
            <SelectItem value="price-asc">价格从低到高</SelectItem>
            <SelectItem value="price-desc">价格从高到低</SelectItem>
            <SelectItem value="value-desc">价值从高到低</SelectItem>
            <SelectItem value="value-asc">价值从低到高</SelectItem>
            <SelectItem value="name-asc">名称 A-Z</SelectItem>
            <SelectItem value="name-desc">名称 Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="state.filterBy">
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部装备</SelectItem>
            <SelectItem value="purchasable">可购买（价格>0）</SelectItem>
            <SelectItem value="efficient">高效率（性价比>80%）</SelectItem>
            <SelectItem value="inefficient">低效率（性价比<60%）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 属性配置弹窗 -->
        <Button variant="outline" @click="showAttributeDialog = true">
          属性配置
        </Button>

        <AttributeConfigDialog
          v-model:open="showAttributeDialog"
          :attribute-values="attributeValues"
          @apply="applyAttributeConfig"
        />

        <!-- 评级显示开关 -->
        <Button
          variant="outline"
          :class="{ 'bg-muted': showEfficiencyBadge }"
          @click="showEfficiencyBadge = !showEfficiencyBadge"
          class="flex items-center"
        >
          <input
            type="checkbox"
            :checked="showEfficiencyBadge"
            class="text-primary focus:ring-primary pointer-events-none mt-0.5 h-3 w-3 rounded border-gray-300"
            readonly
          />
          <span>{{ showEfficiencyBadge ? '隐藏评级' : '显示评级' }}</span>
        </Button>
      </div>
    </div>

    <!-- 标签过滤区域 -->
    <div v-if="availableTags.length > 0" class="">
      <div class="mb-3">
        <h3 class="text-foreground text-sm font-medium">标签筛选</h3>
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
            state.selectedTags.includes(tag.value)
              ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 border shadow-sm'
              : 'bg-secondary text-secondary-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 border hover:shadow-sm',
          ]"
          @click="toggleTag(tag.value)"
        >
          <span class="truncate">{{ tag.label }}</span>
        </button>
      </div>
      <div
        v-if="state.selectedTags.length > 0"
        class="border-border mt-4 border-t pt-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs">
            已选择 {{ state.selectedTags.length }} 个标签
          </span>
          <button
            @click="state.selectedTags = []"
            class="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors duration-200 hover:underline"
          >
            清除所有
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="state.isLoading"
      class="border-border bg-card border p-8 text-center"
    >
      <p class="text-muted-foreground">{{ state.loadStatus }}</p>
    </div>

    <!-- 装备列表 - 图标模式 -->
    <ItemIconView
      v-if="!state.isLoading && filteredItems.length > 0"
      :items="filteredItems"
      :tag-data="state.tagData"
      :show-efficiency-badge="showEfficiencyBadge"
    />

    <!-- 装备列表 - 详细模式 -->
    <ItemDetailView
      v-else-if="viewMode === 'detail' && filteredItems.length > 0"
      :items="filteredItems"
      :tag-data="state.tagData"
      :show-efficiency-badge="showEfficiencyBadge"
    />

    <!-- 空状态 -->
    <div
      v-else-if="!state.isLoading"
      class="border-border bg-card border p-12 text-center"
    >
      <div class="text-muted-foreground/50 mb-4 text-3xl">🔍</div>
      <h4 class="text-foreground mb-2 font-medium">没有找到符合条件的装备</h4>
      <p class="text-muted-foreground text-sm">尝试调整搜索条件或筛选器</p>
    </div>
  </div>
</template>
