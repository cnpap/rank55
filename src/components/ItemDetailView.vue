<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { gameAssets } from '@/assets/data-assets';
import { getEfficiencyColor } from '@/utils/item-calculator';
import EfficiencyBadge from './EfficiencyBadge.vue';
import ItemCraftingTree from './ItemCraftingTree.vue';
import type { ItemTinyData, TagData } from '@/types/item';

interface Props {
  items: ItemTinyData[];
  tagData: TagData | null;
  showEfficiencyBadge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showEfficiencyBadge: false,
});

function getItemImageUrl(itemId: string): string {
  return gameAssets.getItemIcon(itemId);
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <span class="text-muted-foreground text-sm">
        共 {{ items.length }} 个装备
      </span>
    </div>
    <!-- 瀑布布局容器 -->
    <div class="masonry-container">
      <div
        v-for="item in items"
        :key="item.id"
        class="masonry-item border-border bg-card hover:bg-accent/50 relative mb-6 overflow-hidden border transition-colors"
      >
        <!-- 性价比徽章 - 右上角 -->
        <div
          v-if="showEfficiencyBadge && item.calculatedValue > 0"
          class="absolute top-3 right-3 z-10"
        >
          <EfficiencyBadge :efficiency="item.efficiency" size="md" />
        </div>

        <!-- 装备头部信息 -->
        <div class="bg-muted/40 border-border border-b px-4 py-3">
          <div class="flex items-start gap-3">
            <div class="relative">
              <img
                :src="getItemImageUrl(item.id)"
                :alt="item.name"
                class="border-border h-16 w-16 border object-cover"
              />
            </div>
            <div
              class="min-w-0 flex-1"
              :class="{ 'pr-8': showEfficiencyBadge }"
            >
              <h4
                class="text-foreground mb-2 text-lg font-semibold tracking-wide"
              >
                {{ item.name }}
              </h4>
              <p class="text-muted-foreground text-sm leading-relaxed">
                {{ item.plaintext || '暂无描述' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 价值详情区域 -->
        <div class="bg-muted/5 border-border border-b px-4 py-4">
          <div class="grid grid-cols-3 gap-4">
            <!-- 第一列：价格与价值 -->
            <div class="border-border/20 border-r pr-4">
              <table class="w-full border-separate border-spacing-y-2">
                <tbody>
                  <tr>
                    <td class="text-muted-foreground text-xs font-medium">
                      购买价格
                    </td>
                    <td class="text-foreground text-right text-sm font-bold">
                      {{ item.actualPrice }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-muted-foreground text-xs font-medium">
                      真实价值
                    </td>
                    <td class="text-foreground text-right text-sm font-bold">
                      {{
                        item.valueBreakdown?.totalValue ||
                        item.calculatedValue ||
                        0
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 第二列：价值构成 -->
            <div class="border-border/20 border-r pr-4">
              <table class="w-full border-separate border-spacing-y-2">
                <tbody>
                  <tr>
                    <td class="text-muted-foreground text-xs font-medium">
                      属性价值
                    </td>
                    <td class="text-right text-sm font-bold text-blue-600">
                      {{ item.valueBreakdown?.statsValue || 0 }}
                    </td>
                  </tr>
                  <tr
                    v-if="
                      item.valueBreakdown?.effectValue &&
                      item.valueBreakdown.effectValue > 0
                    "
                  >
                    <td class="text-muted-foreground text-xs font-medium">
                      特效价值
                    </td>
                    <td class="text-right text-sm font-bold text-purple-600">
                      {{ item.valueBreakdown.effectValue }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 第三列：性价比 -->
            <div>
              <div class="flex h-full items-center justify-center">
                <div class="text-center">
                  <div
                    class="text-lg font-bold"
                    :class="getEfficiencyColor(item.efficiency)"
                  >
                    {{ item.efficiency }}
                  </div>
                  <div class="text-muted-foreground mt-1 text-xs">
                    性价比分数
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 装备属性区域 -->
        <div v-if="item.statsDisplay" class="border-border border-b px-4 py-4">
          <div class="text-muted-foreground mb-2 text-xs font-medium">
            属性详情
          </div>
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="stat in item.statsDisplay"
              :key="stat.key"
              class="flex items-center justify-between"
            >
              <Badge
                variant="secondary"
                class="border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {{ stat.formatted }}
              </Badge>
              <span class="text-muted-foreground text-xs">
                价值: {{ stat.calculatedValue || 0 }}
              </span>
            </div>
          </div>
        </div>

        <!-- 装备特效 -->
        <div
          v-if="item.passiveEffects && item.passiveEffects.length > 0"
          class="border-border border-b px-4 py-4"
        >
          <div class="text-muted-foreground mb-2 text-xs font-medium">
            装备特效
          </div>
          <div class="border-border/30 bg-muted/50 border p-3">
            <div
              v-for="effect in item.passiveEffects"
              :key="effect"
              class="text-muted-foreground mb-2 text-sm leading-relaxed last:mb-0"
            >
              {{ effect }}
            </div>
          </div>
        </div>

        <!-- 合成路线区域 -->
        <div class="border-border border-b px-4 py-4">
          <div class="text-muted-foreground mb-2 text-xs font-medium">
            合成路线
          </div>
          <div
            class="min-h-[200px] bg-gradient-to-br from-slate-50/50 to-slate-100/50 p-3 dark:from-slate-800/30 dark:to-slate-700/30"
          >
            <div v-if="item.from?.length" class="h-full">
              <ItemCraftingTree :item="item" :all-items="items" />
            </div>
            <div v-else class="flex h-full items-center justify-center">
              <div class="text-muted-foreground text-center text-sm">
                <div
                  class="bg-muted/20 border-border/50 mx-auto mb-2 h-12 w-12 border"
                ></div>
                <div>无合成路线</div>
                <div class="text-xs">基础装备</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 标签区域 -->
        <div v-if="item.tags && item.tags.length > 0" class="px-4 py-4">
          <div class="text-muted-foreground mb-2 text-xs font-medium">标签</div>
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="tag in item.tags"
              :key="tag"
              variant="secondary"
              class="text-xs"
            >
              {{ tagData?.tags?.[tag]?.chineseName || tag }}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 瀑布布局样式 */
.masonry-container {
  column-count: 1;
  column-gap: 1.5rem;
  column-fill: balance;
}

@media (min-width: 768px) {
  .masonry-container {
    column-count: 2;
  }
}

@media (min-width: 1280px) {
  .masonry-container {
    column-count: 3;
  }
}

.masonry-item {
  break-inside: avoid;
  display: inline-block;
  width: 100%;
  vertical-align: top;
}
</style>
