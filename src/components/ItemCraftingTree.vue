<script setup lang="ts">
import type { ItemTinyData } from '@/types/item';
import { gameAssets } from '@/assets/data-assets';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
  onBeforeUnmount,
} from 'vue';
import { Badge } from '@/components/ui/badge';

interface Props {
  item: ItemTinyData;
  allItems: ItemTinyData[];
}

const props = defineProps<Props>();

// 创建装备ID到装备数据的映射
const itemMap = computed(() => {
  const map = new Map<string, ItemTinyData>();
  props.allItems.forEach(item => {
    map.set(item.id, item);
  });
  return map;
});

// 树节点结构
interface TreeNode {
  item: ItemTinyData;
  children: TreeNode[];
  count: number;
  level: number;
  id: string;
  x?: number;
  y?: number;
}

// 连线数据结构
interface LineData {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isBasic: boolean;
}

// 构建合成树
function buildTree(
  itemId: string,
  visited = new Set<string>(),
  level = 0
): TreeNode | null {
  if (visited.has(itemId)) {
    return null;
  }

  const item = itemMap.value.get(itemId);
  if (!item) {
    return null;
  }

  const currentVisited = new Set(visited);
  currentVisited.add(itemId);

  const children: TreeNode[] = [];
  const nodeId = `${itemId}-${level}-${Math.random().toString(36).substr(2, 9)}`;

  if (item.from && item.from.length > 0) {
    const materialCounts = new Map<string, number>();
    item.from.forEach(fromId => {
      materialCounts.set(fromId, (materialCounts.get(fromId) || 0) + 1);
    });

    materialCounts.forEach((count, fromId) => {
      const childNode = buildTree(fromId, currentVisited, level + 1);
      if (childNode) {
        childNode.count = count;
        children.push(childNode);
      } else {
        console.log(`❌ [Level ${level}] 子节点创建失败: ${fromId}`);
      }
    });
  }

  return {
    item,
    children,
    count: 1,
    level,
    id: nodeId,
  };
}

const craftingTree = computed(() => buildTree(props.item.id));

// 检查是否有合成路线
const hasCraftingPath = computed(() => {
  return craftingTree.value && craftingTree.value.children.length > 0;
});

// 获取装备图标URL
function getItemImageUrl(itemId: string): string {
  return gameAssets.getItemIcon(itemId);
}

// 计算总价格
function calculateTotalCost(node: TreeNode | null): number {
  if (!node) return 0;

  if (node.children.length === 0) {
    return node.item.actualPrice * node.count;
  }

  return node.children.reduce((total, child) => {
    return total + calculateTotalCost(child);
  }, 0);
}

const totalCost = computed(() => calculateTotalCost(craftingTree.value));

// 判断是否为基础材料
function isBasicItem(node: TreeNode): boolean {
  return node.children.length === 0;
}

// 扁平化树结构用于布局
function flattenTree(node: TreeNode): TreeNode[] {
  const result = [node];
  node.children.forEach(child => {
    result.push(...flattenTree(child));
  });
  return result;
}

const flatNodes = computed(() => {
  return craftingTree.value ? flattenTree(craftingTree.value) : [];
});

// 按层级分组节点
const nodesByLevel = computed(() => {
  const groups: { [key: number]: TreeNode[] } = {};
  flatNodes.value.forEach(node => {
    if (!groups[node.level]) {
      groups[node.level] = [];
    }
    groups[node.level].push(node);
  });
  return groups;
});

// 连线数据
const lines = ref<LineData[]>([]);
const containerRef = ref<HTMLElement>();

// 计算节点位置和生成连线
function calculateLinesAndPositions() {
  if (!containerRef.value || !craftingTree.value) {
    lines.value = [];
    return;
  }

  nextTick(() => {
    const newLines: LineData[] = [];

    // 递归计算连线
    function processNode(node: TreeNode) {
      if (!node.children.length) return;

      const parentElement = document.getElementById(`item-${node.id}`);
      if (!parentElement) return;

      const parentRect = parentElement.getBoundingClientRect();
      const containerRect = containerRef.value!.getBoundingClientRect();

      // 修改连线起点为装备底部边缘
      const parentBottom = {
        x: parentRect.left + parentRect.width / 2 - containerRect.left,
        y: parentRect.bottom - containerRect.top,
      };

      node.children.forEach(child => {
        const childElement = document.getElementById(`item-${child.id}`);
        if (!childElement) return;

        const childRect = childElement.getBoundingClientRect();
        // 修改连线终点为装备顶部边缘
        const childTop = {
          x: childRect.left + childRect.width / 2 - containerRect.left,
          y: childRect.top - containerRect.top,
        };

        newLines.push({
          from: parentBottom,
          to: childTop,
          color: isBasicItem(child) ? '#10b981' : '#3b82f6',
          isBasic: isBasicItem(child),
        });

        // 递归处理子节点
        processNode(child);
      });
    }

    processNode(craftingTree.value!);
    lines.value = newLines;
  });
}

// 监听数据变化重新计算连线
watch(
  () => props.item.id,
  () => {
    setTimeout(calculateLinesAndPositions, 100);
  },
  { immediate: true }
);

onMounted(() => {
  setTimeout(calculateLinesAndPositions, 200);

  // 监听窗口大小变化
  window.addEventListener('resize', calculateLinesAndPositions);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateLinesAndPositions);
});

// 获取节点样式
function getNodeStyle(node: TreeNode) {
  const baseSize = node.level === 0 ? 64 : node.level === 1 ? 48 : 40;

  return {
    width: `${baseSize}px`,
    height: `${baseSize}px`,
  };
}

// 获取容器布局 - 增加高度以容纳文字信息
function getContainerLayout() {
  if (!craftingTree.value) return {};

  const maxLevel = getMaxLevel(craftingTree.value);
  // 减少间距以优化空间利用
  const minHeight = Math.max(150, maxLevel * 120 + 80);

  return {
    minHeight: `${minHeight}px`,
  };
}

// 获取最大层级
function getMaxLevel(node: TreeNode): number {
  if (!node.children.length) return node.level;

  return Math.max(...node.children.map(child => getMaxLevel(child)));
}

// 生成SVG路径
function generatePath(line: LineData): string {
  const { from, to } = line;
  const deltaX = Math.abs(to.x - from.x);
  const deltaY = to.y - from.y;

  // 如果是垂直线条（水平距离很小），使用直线或简单曲线
  if (deltaX < 10) {
    const midY = from.y + deltaY * 0.5;
    return `M ${from.x} ${from.y} Q ${from.x + 20} ${midY} ${to.x} ${to.y}`;
  }

  // 对于有水平距离的线条，使用原来的逻辑但优化控制点
  const midY = from.y + deltaY * 0.6;
  const controlX = from.x + (to.x - from.x) * 0.3;

  return `M ${from.x} ${from.y} Q ${controlX} ${midY} ${to.x} ${to.y}`;
}
</script>

<template>
  <div v-if="hasCraftingPath">
    <!-- 主要内容区域 -->
    <div
      ref="containerRef"
      class="relative w-full"
      :style="getContainerLayout()"
    >
      <!-- SVG连线层 -->
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        style="z-index: 20"
      >
        <defs>
          <!-- 箭头标记 -->
          <marker
            id="arrowhead-blue"
            markerWidth="6"
            markerHeight="4"
            refX="5"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 6 2, 0 4"
              fill="#3b82f6"
              stroke="#3b82f6"
              stroke-width="0.5"
            />
          </marker>
          <marker
            id="arrowhead-green"
            markerWidth="6"
            markerHeight="4"
            refX="5"
            refY="2"
            orient="auto"
          >
            <polygon
              points="0 0, 6 2, 0 4"
              fill="#10b981"
              stroke="#10b981"
              stroke-width="0.5"
            />
          </marker>

          <!-- 渐变定义 -->
          <linearGradient
            id="blue-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
          <linearGradient
            id="green-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#10b981" />
          </linearGradient>

          <!-- 阴影滤镜 -->
          <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="1"
              dy="1"
              stdDeviation="2"
              flood-color="rgba(0,0,0,0.2)"
            />
          </filter>
        </defs>

        <!-- 渲染连线 -->
        <path
          v-for="(line, index) in lines"
          :key="index"
          :d="generatePath(line)"
          :stroke="
            line.isBasic ? 'url(#green-gradient)' : 'url(#blue-gradient)'
          "
          stroke-width="2"
          fill="none"
          :marker-end="
            line.isBasic ? 'url(#arrowhead-green)' : 'url(#arrowhead-blue)'
          "
          filter="url(#drop-shadow)"
          class="transition-all duration-300"
        />
      </svg>

      <!-- 按层级渲染节点 -->
      <div
        v-for="(level, levelIndex) in Object.keys(nodesByLevel)
          .map(Number)
          .sort((a, b) => a - b)"
        :key="level"
        class="absolute flex w-full items-start justify-center gap-8"
        :style="{
          top: `${level * 120 + 20}px`,
          zIndex: 10,
        }"
      >
        <div
          v-for="node in nodesByLevel[level]"
          :key="node.id"
          :id="`item-${node.id}`"
          class="relative flex flex-col items-center"
          @mouseenter="calculateLinesAndPositions"
        >
          <!-- 装备图标容器 -->
          <div
            :class="[
              'relative transform cursor-pointer border-2 p-1 transition-all duration-300 hover:scale-105',
              'rounded-lg shadow-lg backdrop-blur-sm hover:shadow-xl',
              node.level === 0
                ? 'border-yellow-400 bg-gradient-to-br from-yellow-100/90 to-orange-100/90 dark:from-yellow-900/90 dark:to-orange-900/90'
                : isBasicItem(node)
                  ? 'border-green-400 bg-gradient-to-br from-green-100/90 to-emerald-100/90 dark:from-green-900/90 dark:to-emerald-900/90'
                  : 'border-blue-400 bg-gradient-to-br from-blue-100/90 to-indigo-100/90 dark:from-blue-900/90 dark:to-indigo-900/90',
            ]"
            :style="getNodeStyle(node)"
          >
            <!-- 装备图标 -->
            <div class="relative h-full w-full overflow-hidden rounded">
              <img
                :src="getItemImageUrl(node.item.id)"
                :alt="node.item.name"
                class="h-full w-full object-cover"
              />

              <!-- 光效边框 -->
              <div
                :class="[
                  'absolute inset-0 rounded opacity-40',
                  node.level === 0
                    ? 'bg-gradient-to-br from-yellow-400/30 to-orange-400/30'
                    : isBasicItem(node)
                      ? 'bg-gradient-to-br from-green-400/30 to-emerald-400/30'
                      : 'bg-gradient-to-br from-blue-400/30 to-indigo-400/30',
                ]"
              ></div>
            </div>

            <!-- 数量徽章 - 优化版本 -->
            <div
              v-if="node.count > 1"
              class="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center"
            >
              <!-- 外层光环效果 -->
              <div
                class="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-60 blur-sm"
              ></div>

              <!-- 主体徽章 -->
              <div
                class="relative flex h-6 w-6 items-center justify-center rounded-full border border-white/50 bg-gradient-to-br from-orange-400 via-red-500 to-red-600 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
              >
                <!-- 内层高光 -->
                <div
                  class="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/30 to-transparent"
                ></div>

                <!-- 数字文本 -->
                <span
                  class="relative z-10 text-xs font-bold text-white drop-shadow-sm"
                >
                  {{ node.count }}
                </span>

                <!-- 闪烁效果 -->
                <div
                  class="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-500 hover:opacity-100"
                ></div>
              </div>
            </div>

            <!-- 层级指示器 -->
            <div
              v-if="node.level === 0"
              class="absolute -top-1 -left-1 h-3 w-3 animate-pulse rounded-full border border-white bg-yellow-400 shadow-lg dark:border-gray-800"
            ></div>
            <div
              v-else-if="isBasicItem(node)"
              class="absolute -right-1 -bottom-1 h-2 w-2 rounded-full border border-white bg-green-400 shadow-lg dark:border-gray-800 dark:bg-green-500/70"
            ></div>
          </div>

          <!-- 装备信息显示在图标下方 -->
          <div class="mt-1 flex max-w-20 flex-col items-center text-center">
            <!-- 装备名称 -->
            <div
              :class="[
                'w-full truncate text-xs font-medium',
                node.level === 0
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : isBasicItem(node)
                    ? 'text-green-700 dark:text-green-400/80'
                    : 'text-blue-700 dark:text-blue-300',
              ]"
              :title="node.item.name"
            >
              {{ node.item.name }}
            </div>

            <!-- 价格信息 -->
            <div class="flex items-center gap-1 text-xs">
              <span
                :class="[
                  'font-bold',
                  node.level === 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : isBasicItem(node)
                      ? 'text-green-600 dark:text-green-500/80'
                      : 'text-blue-600 dark:text-blue-400',
                ]"
              >
                {{ node.item.actualPrice }}
              </span>
              <span
                v-if="node.count > 1"
                class="text-gray-500 dark:text-gray-400"
              >
                ×{{ node.count }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* 悬浮效果 */
.hover\:scale-105:hover {
  transform: scale(1.05) !important;
}

/* SVG连线动画 */
path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 1s ease-in-out forwards;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
