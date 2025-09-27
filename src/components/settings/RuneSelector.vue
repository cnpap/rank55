<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  runes: [number, number]; // 当前选中的天赋 [主系, 副系]
}

interface Emits {
  (e: 'runes-change', runes: [number, number]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 下拉框状态管理
const isRuneDropdownOpen = ref(false);
const activeRuneSlot = ref<0 | 1 | null>(null); // 当前激活的天赋槽位
const runeContainerRef = ref<HTMLDivElement>();
const runeDropdownRef = ref<HTMLDivElement>(); // 天赋下拉框的引用
const rune0Ref = ref<HTMLImageElement>();
const rune1Ref = ref<HTMLImageElement>();

// 下拉框位置计算
const dropdownPosition = ref({ top: 0, left: 0 });

// 可用天赋系统配置
const availableRunes = [
  { id: 8000, name: '精密', key: 'Precision' },
  { id: 8100, name: '主宰', key: 'Domination' },
  { id: 8200, name: '巫术', key: 'Sorcery' },
  { id: 8300, name: '启迪', key: 'Inspiration' },
  { id: 8400, name: '坚决', key: 'Resolve' },
];

// 天赋系颜色配置
const runeColors = {
  8000: '#C89B3C', // 精密 - 金色
  8100: '#DC143C', // 主宰 - 红色
  8200: '#4169E1', // 巫术 - 蓝色
  8300: '#32CD32', // 启迪 - 绿色
  8400: '#228B22', // 坚决 - 深绿色
};

// 天赋点配置 - 每个天赋系的具体天赋点
const runePerks = {
  8000: {
    // 精密
    name: '精密',
    slots: [
      [8005, 8008, 8021, 8010], // 第一行 4个 - 基石天赋
      [9101, 9111, 8009], // 第二行 3个 - Absorb Life, Triumph, Presence of Mind
      [9104, 9105, 9103], // 第三行 3个 - Legend: Alacrity, Legend: Haste, Legend: Bloodline
      [8014, 8017, 8299], // 第四行 3个 - Coup de Grace, Cut Down, Last Stand
    ],
  },
  8100: {
    // 主宰
    name: '主宰',
    slots: [
      [8112, 8128, 9923], // 第一行 3个 - Electrocute, Dark Harvest, Hail of Blades
      [8126, 8139, 8143], // 第二行 3个 - Cheap Shot, Taste of Blood, Sudden Impact
      [8137, 8140, 8141], // 第三行 3个 - Sixth Sense, Grisly Mementos, Deep Ward
      [8135, 8105, 8106], // 第四行 3个 - Treasure Hunter, Relentless Hunter, Ultimate Hunter
    ],
  },
  8200: {
    // 巫术
    name: '巫术',
    slots: [
      [8214, 8229, 8230], // 第一行 3个
      [8224, 8226, 8275], // 第二行 3个
      [8210, 8234, 8233], // 第三行 3个
      [8237, 8232, 8236], // 第四行 3个
    ],
  },
  8300: {
    // 启迪
    name: '启迪',
    slots: [
      [8351, 8360, 8369], // 第一行 3个 - 冰川增幅(Glacial Augment), 启封的秘籍(Unsealed Spellbook), 先攻(First Strike)
      [8306, 8304, 8321], // 第二行 3个 - 海克斯科技闪现(Hextech Flashtraption), 神奇之靴(Magical Footwear), 现金返还(Cash Back)
      [8313, 8352, 8345], // 第三行 3个 - 三重补药(Triple Tonic), 时间扭曲补药(Time Warp Tonic), 饼干配送(Biscuit Delivery)
      [8347, 8410, 8316], // 第四行 3个 - 星界洞悉(Cosmic Insight), 接近速度(Approach Velocity), 万能石(Jack Of All Trades)
    ],
  },
  8400: {
    // 坚决
    name: '坚决',
    slots: [
      [8437, 8439, 8465], // 第一行 3个
      [8446, 8463, 8401], // 第二行 3个
      [8429, 8444, 8473], // 第三行 3个
      [8451, 8453, 8242], // 第四行 3个
    ],
  },
};

// 当前选中的天赋
const selectedRunes = ref<[number, number]>([...props.runes]);

// 当前选中的天赋点 - [主系天赋点数组, 副系天赋点数组]
const selectedPerks = ref<[number[], number[]]>([[], []]);

// 获取当前天赋
const currentRunes = computed(() => {
  return selectedRunes.value;
});

// 获取当前激活天赋系的天赋点配置
const currentRunePerks = computed(() => {
  if (activeRuneSlot.value === null) return null;
  const runeId = selectedRunes.value[activeRuneSlot.value];
  return runePerks[runeId as keyof typeof runePerks] || null;
});

// 获取当前激活天赋系的颜色
const currentRuneColor = computed(() => {
  if (activeRuneSlot.value === null) return '#666666';
  const runeId = selectedRunes.value[activeRuneSlot.value];
  return runeColors[runeId as keyof typeof runeColors] || '#666666';
});

// 处理天赋选择
function selectRune(runeId: number, slotIndex: 0 | 1) {
  const newRunes: [number, number] = [...selectedRunes.value];

  // 确保主系和副系不能相同
  if (slotIndex === 0) {
    // 选择主系时，如果副系和主系相同，则自动切换副系到其他天赋
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

  // 重置对应槽位的天赋点选择
  const newPerks: [number[], number[]] = [...selectedPerks.value];
  if (slotIndex === 0) {
    newPerks[0] = []; // 重置主系天赋点
  } else {
    newPerks[1] = []; // 重置副系天赋点
  }
  selectedPerks.value = newPerks;

  emit('runes-change', newRunes);
  // 选择天赋系后不关闭下拉框，让用户继续选择天赋点
}

// 处理天赋点选择
function selectPerk(perkId: number, slotIndex: number) {
  if (activeRuneSlot.value === null) return;

  const newPerks: [number[], number[]] = [...selectedPerks.value];
  const targetPerks = newPerks[activeRuneSlot.value];

  // 确保数组长度足够
  while (targetPerks.length <= slotIndex) {
    targetPerks.push(0);
  }

  targetPerks[slotIndex] = perkId;
  selectedPerks.value = newPerks;

  // 这里可以触发天赋点变化事件，如果需要的话
  // emit('perks-change', newPerks);
}

// 检查天赋点是否被选中
function isPerkSelected(perkId: number, slotIndex: number): boolean {
  if (activeRuneSlot.value === null) return false;
  const targetPerks = selectedPerks.value[activeRuneSlot.value];
  return targetPerks[slotIndex] === perkId;
}

// 计算下拉框位置
function calculateDropdownPosition() {
  if (activeRuneSlot.value === null) return;

  // 根据当前激活的天赋槽位获取对应的元素引用
  const targetElement =
    activeRuneSlot.value === 0 ? rune0Ref.value : rune1Ref.value;
  if (!targetElement) return;

  const rect = targetElement.getBoundingClientRect();
  const dropdownWidth = 320; // 减少宽度从400px到320px
  const dropdownHeight = activeRuneSlot.value === 0 ? 380 : 280; // 相应调整高度

  // 默认定位到右侧，Y轴居中对齐
  let top = rect.top + rect.height / 2 - dropdownHeight / 2; // 垂直居中对齐
  let left = rect.right + 8; // 8px 间距

  // 边界检测 - 防止超出右边界，如果右侧空间不够则显示在左侧
  if (left + dropdownWidth > window.innerWidth) {
    left = rect.left - dropdownWidth - 8; // 显示在左侧
  }

  // 边界检测 - 防止超出左边界
  if (left < 8) {
    left = 8;
  }

  // 边界检测 - 防止超出底部边界
  if (top + dropdownHeight > window.innerHeight) {
    // 如果下方空间不够，向上调整位置
    top = window.innerHeight - dropdownHeight - 8;
  }

  // 边界检测 - 防止超出顶部边界
  if (top < 8) {
    top = 8;
  }

  dropdownPosition.value = { top, left };
}

// 打开天赋下拉框
async function openRuneDropdown(slotIndex: 0 | 1) {
  // 如果点击的是同一个槽位，则关闭下拉框
  if (isRuneDropdownOpen.value && activeRuneSlot.value === slotIndex) {
    closeRuneDropdown();
    return;
  }

  // 否则打开对应槽位的下拉框
  activeRuneSlot.value = slotIndex;
  isRuneDropdownOpen.value = true;

  // 等待 DOM 更新后计算位置
  await nextTick();
  calculateDropdownPosition();
}

// 关闭天赋下拉框
function closeRuneDropdown() {
  isRuneDropdownOpen.value = false;
  activeRuneSlot.value = null;
}

// 处理点击外部区域关闭下拉框
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  // 检查点击是否在天赋容器内或下拉框内
  const isInsideContainer =
    runeContainerRef.value && runeContainerRef.value.contains(target);
  const isInsideDropdown =
    runeDropdownRef.value && runeDropdownRef.value.contains(target);

  // 如果点击既不在容器内也不在下拉框内，则关闭下拉框
  if (!isInsideContainer && !isInsideDropdown) {
    closeRuneDropdown();
  }
}

// 处理窗口滚动和尺寸变化
function handleWindowChange() {
  if (isRuneDropdownOpen.value) {
    calculateDropdownPosition();
  }
}

// 监听 props 变化，同步更新内部状态
function updateRunes() {
  selectedRunes.value = [...props.runes];
}

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleWindowChange, true);
  window.addEventListener('resize', handleWindowChange);
  updateRunes();
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleWindowChange, true);
  window.removeEventListener('resize', handleWindowChange);
});

// 监听 props 变化
defineExpose({
  updateRunes,
});
</script>

<template>
  <div ref="runeContainerRef" class="relative flex items-center">
    <!-- 天赋 -->
    <div class="flex flex-col gap-0.5">
      <img
        ref="rune0Ref"
        :src="staticAssets.getRuneIcon(`${currentRunes[0]}`)"
        :alt="`主系天赋${currentRunes[0]}`"
        class="h-4.5 w-4.5 cursor-pointer border hover:border-blue-500"
        :title="'点击修改主系天赋'"
        @click="openRuneDropdown(0)"
      />
      <img
        ref="rune1Ref"
        :src="staticAssets.getRuneIcon(`${currentRunes[1]}`)"
        :alt="`副系天赋${currentRunes[1]}`"
        class="h-4.5 w-4.5 cursor-pointer border hover:border-blue-500"
        :title="'点击修改副系天赋'"
        @click="openRuneDropdown(1)"
      />
    </div>

    <!-- 天赋下拉选择框 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <div
        v-if="isRuneDropdownOpen && activeRuneSlot !== null"
        ref="runeDropdownRef"
        class="font-tektur-numbers border-border/50 from-background/95 to-background/90 fixed z-[99] border bg-gradient-to-b backdrop-blur-sm"
        :style="{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }"
      >
        <!-- 标题区域 - 满宽 border-b -->
        <div class="border-border/50 border-b px-3 py-2">
          <div class="text-muted-foreground text-xs font-medium">
            {{ activeRuneSlot === 0 ? '选择主系天赋' : '选择副系天赋' }}
          </div>
        </div>

        <!-- 天赋选择区域 -->
        <div>
          <!-- 天赋系选择区域 - 标签页样式 -->
          <div class="flex h-10 items-center">
            <button
              v-for="rune in availableRunes"
              :key="rune.id"
              @click="selectRune(rune.id, activeRuneSlot)"
              class="relative flex h-full w-10 flex-1 items-center justify-center gap-2 text-sm font-medium transition-all duration-200"
              :class="{
                'bg-primary/10': currentRunes[activeRuneSlot] === rune.id,
                'text-muted-foreground hover:text-foreground hover:bg-muted/50':
                  currentRunes[activeRuneSlot] !== rune.id &&
                  (activeRuneSlot === 0 || currentRunes[0] !== rune.id),
                'cursor-not-allowed opacity-50':
                  activeRuneSlot === 1 && currentRunes[0] === rune.id,
              }"
              :disabled="activeRuneSlot === 1 && currentRunes[0] === rune.id"
            >
              <img
                :src="staticAssets.getRuneIcon(`${rune.id}`)"
                :alt="rune.name"
                class="h-7 w-7 object-cover"
              />
              <!-- 活跃指示器 -->
              <div
                v-if="currentRunes[activeRuneSlot] === rune.id"
                class="bg-primary absolute bottom-0 left-1/2 h-0.5 w-full -translate-x-1/2"
              ></div>
            </button>
          </div>

          <!-- 天赋点选择区域 -->
          <div
            v-if="currentRunePerks"
            class="border-border/50 border-t px-2.5 pt-2.5"
          >
            <div class="text-muted-foreground mb-2.5 text-xs font-medium">
              选择 {{ currentRunePerks.name }} 天赋点
            </div>

            <!-- 天赋点行 -->
            <div class="space-y-1.5 pb-2.5">
              <!-- 主系显示4行，副系显示3行 -->
              <div
                v-for="(slot, slotIndex) in activeRuneSlot === 0
                  ? currentRunePerks.slots
                  : currentRunePerks.slots.slice(1)"
                :key="slotIndex"
                class="flex justify-center gap-1.5"
              >
                <div
                  v-for="(perkId, perkIndex) in slot"
                  :key="perkId"
                  @click="
                    selectPerk(
                      perkId,
                      activeRuneSlot === 0 ? slotIndex : slotIndex + 1
                    )
                  "
                  class="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200"
                  :class="{
                    'hover:scale-105': true,
                  }"
                  :style="{
                    borderColor: isPerkSelected(
                      perkId,
                      activeRuneSlot === 0 ? slotIndex : slotIndex + 1
                    )
                      ? currentRuneColor
                      : '#444444',
                    backgroundColor: '#1a1a1a',
                  }"
                >
                  <img
                    :src="staticAssets.getPerkIcon(`${perkId}`)"
                    :alt="`天赋点${perkId}`"
                    :title="`天赋点${perkId}`"
                    class="h-8 w-8 transition-all duration-200"
                    :class="{
                      'grayscale-0': isPerkSelected(
                        perkId,
                        activeRuneSlot === 0 ? slotIndex : slotIndex + 1
                      ),
                      'brightness-75 grayscale': !isPerkSelected(
                        perkId,
                        activeRuneSlot === 0 ? slotIndex : slotIndex + 1
                      ),
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 组件样式 */
</style>
