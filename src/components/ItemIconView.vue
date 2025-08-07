<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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
    <div
      class="grid grid-cols-8 gap-4 sm:grid-cols-12 lg:grid-cols-14 xl:grid-cols-16"
    >
      <HoverCard v-for="item in items" :key="item.id">
        <HoverCardTrigger as-child>
          <div
            class="border-border bg-card hover:bg-accent relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border p-1 transition-colors"
          >
            <img
              :src="getItemImageUrl(item.id)"
              :alt="item.name"
              class="h-14 w-14 rounded-md object-cover"
            />
            <div
              v-if="showEfficiencyBadge && item.calculatedValue > 0"
              class="absolute right-0 -bottom-1"
            >
              <EfficiencyBadge :efficiency="item.efficiency" size="sm" />
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent class="w-[48rem] p-0" side="top" align="start">
          <div class="flex min-h-[380px]">
            <!-- 左侧：装备信息 -->
            <div class="border-border flex-1 border-r">
              <!-- 装备名称 -->
              <div class="bg-muted/40 border-border border-b px-6 py-3">
                <h4
                  class="text-foreground truncate text-lg font-semibold tracking-wide"
                >
                  {{ item.name }}
                </h4>
              </div>

              <!-- 价值详情区域 - 优化后的设计 -->
              <div class="bg-muted/5 border-border border-b px-6">
                <!-- 价值数据表格 -->
                <div class="grid grid-cols-3 gap-x-4">
                  <!-- 第一列：价格与价值 -->
                  <div class="border-border/20 border-r pr-4">
                    <table class="w-full border-separate border-spacing-y-2">
                      <tbody>
                        <tr>
                          <td class="text-muted-foreground text-xs font-medium">
                            购买价格
                          </td>
                          <td
                            class="text-foreground text-right text-base font-bold"
                          >
                            {{ item.actualPrice }}
                          </td>
                        </tr>
                        <tr>
                          <td class="text-muted-foreground text-xs font-medium">
                            真实价值
                          </td>
                          <td
                            class="text-foreground text-right text-base font-bold"
                          >
                            {{ item.valueBreakdown?.totalValue || 0 }}
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
                          <td
                            class="text-right text-base font-bold text-blue-600"
                          >
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
                          <td
                            class="text-right text-base font-bold text-purple-600"
                          >
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
                          class="text-xl font-bold"
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

              <!-- 装备属性区域 - 显示每个属性的价值 -->
              <div
                v-if="item.statsDisplay"
                class="border-border border-b px-6 py-4"
              >
                <div class="flex gap-x-1.5 gap-y-2">
                  <div
                    v-for="stat in item.statsDisplay"
                    :key="stat.key"
                    class="border-border/10 flex items-center justify-between border-b"
                  >
                    <Badge
                      variant="secondary"
                      class="border-slate-200 bg-slate-100 px-1 py-0.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {{ stat.formatted }} - {{ stat.calculatedValue || 0 }}
                    </Badge>
                  </div>
                </div>
              </div>

              <!-- 装备特效 -->
              <div
                v-if="item.passiveEffects && item.passiveEffects.length > 0"
                class="px-6 py-4"
              >
                <div
                  v-for="effect in item.passiveEffects"
                  :key="effect"
                  class="text-muted-foreground border-border/30 mb-2 text-sm leading-relaxed"
                >
                  {{ effect }}
                </div>
              </div>
            </div>

            <!-- 右侧：合成路线 -->
            <div
              class="w-80 bg-gradient-to-br from-slate-50/50 to-slate-100/50 py-0 pb-8 dark:from-slate-800/30 dark:to-slate-700/30"
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
        </HoverCardContent>
      </HoverCard>
    </div>
  </div>
</template>
