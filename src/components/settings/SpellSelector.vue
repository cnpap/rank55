<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { staticAssets } from '@/assets/data-assets';

interface Props {
  spells: [number, number]; // 当前选中的召唤师技能
}

interface Emits {
  (e: 'spells-change', spells: [number, number]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 下拉框状态管理
const isSpellDropdownOpen = ref(false);
const activeSpellSlot = ref<0 | 1 | null>(null); // 当前激活的技能槽位
const spellContainerRef = ref<HTMLDivElement>();
const spell0Ref = ref<HTMLImageElement>();
const spell1Ref = ref<HTMLImageElement>();

// 下拉框位置计算
const dropdownPosition = ref({ top: 0, left: 0 });

// 常用召唤师技能配置
const availableSpells = [
  { id: 1, name: '净化', key: 'SummonerBoost' },
  { id: 3, name: '虚弱', key: 'SummonerExhaust' },
  { id: 4, name: '闪现', key: 'SummonerFlash' },
  { id: 6, name: '幽灵疾步', key: 'SummonerHaste' },
  { id: 7, name: '治疗', key: 'SummonerHeal' },
  { id: 11, name: '惩戒', key: 'SummonerSmite' },
  { id: 12, name: '传送', key: 'SummonerTeleport' },
  { id: 13, name: '清晰术', key: 'SummonerMana' },
  { id: 14, name: '点燃', key: 'SummonerDot' },
  { id: 21, name: '屏障', key: 'SummonerBarrier' },
  { id: 30, name: '复活', key: 'SummonerRevive' },
  { id: 31, name: '挖掘', key: 'SummonerPoro' },
  { id: 32, name: '标记', key: 'SummonerSnowball' },
];

// 当前选中的召唤师技能
const selectedSpells = ref<[number, number]>([...props.spells]);

// 获取当前召唤师技能
const currentSpells = computed(() => {
  return selectedSpells.value;
});

// 处理召唤师技能选择
function selectSpell(spellId: number, slotIndex: 0 | 1) {
  const newSpells: [number, number] = [...selectedSpells.value];
  newSpells[slotIndex] = spellId;
  selectedSpells.value = newSpells;
  emit('spells-change', newSpells);
  // 选择后关闭下拉框
  closeSpellDropdown();
}

// 计算下拉框位置
function calculateDropdownPosition() {
  if (activeSpellSlot.value === null) return;

  // 根据当前激活的技能槽位获取对应的元素引用
  const targetElement =
    activeSpellSlot.value === 0 ? spell0Ref.value : spell1Ref.value;
  if (!targetElement) return;

  const rect = targetElement.getBoundingClientRect();
  const dropdownWidth = 256; // w-64 = 16rem = 256px
  const dropdownHeight = 200; // 预估高度

  // 默认定位到右侧，Y轴居中对齐
  let top = rect.top + rect.height / 2 - dropdownHeight / 2; // 垂直居中对齐
  let left = rect.right + 4; // 8px 间距

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

// 打开技能下拉框
async function openSpellDropdown(slotIndex: 0 | 1) {
  // 如果点击的是同一个槽位，则关闭下拉框
  if (isSpellDropdownOpen.value && activeSpellSlot.value === slotIndex) {
    closeSpellDropdown();
    return;
  }

  // 否则打开对应槽位的下拉框
  activeSpellSlot.value = slotIndex;
  isSpellDropdownOpen.value = true;

  // 等待 DOM 更新后计算位置
  await nextTick();
  calculateDropdownPosition();
}

// 关闭技能下拉框
function closeSpellDropdown() {
  isSpellDropdownOpen.value = false;
  activeSpellSlot.value = null;
}

// 处理点击外部区域关闭下拉框
function handleClickOutside(event: MouseEvent) {
  if (
    spellContainerRef.value &&
    !spellContainerRef.value.contains(event.target as Node)
  ) {
    closeSpellDropdown();
  }
}

// 处理窗口滚动和尺寸变化
function handleWindowChange() {
  if (isSpellDropdownOpen.value) {
    calculateDropdownPosition();
  }
}

// 监听 props 变化，同步更新内部状态
function updateSpells() {
  selectedSpells.value = [...props.spells];
}

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleWindowChange, true);
  window.addEventListener('resize', handleWindowChange);
  updateSpells();
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleWindowChange, true);
  window.removeEventListener('resize', handleWindowChange);
});

// 监听 props 变化
defineExpose({
  updateSpells,
});
</script>

<template>
  <div ref="spellContainerRef" class="relative flex items-center">
    <!-- 召唤师技能 -->
    <div class="flex flex-col gap-0.5">
      <img
        ref="spell0Ref"
        :src="staticAssets.getSpellIcon(`${currentSpells[0]}`)"
        :alt="`召唤师技能${currentSpells[0]}`"
        class="h-4.5 w-4.5 cursor-pointer border hover:border-blue-500"
        :title="'点击修改召唤师技能 1'"
        @click="openSpellDropdown(0)"
      />
      <img
        ref="spell1Ref"
        :src="staticAssets.getSpellIcon(`${currentSpells[1]}`)"
        :alt="`召唤师技能${currentSpells[1]}`"
        class="h-4.5 w-4.5 cursor-pointer border hover:border-blue-500"
        :title="'点击修改召唤师技能 2'"
        @click="openSpellDropdown(1)"
      />
    </div>

    <!-- 召唤师技能下拉选择框 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <div
        v-if="isSpellDropdownOpen && activeSpellSlot !== null"
        class="font-tektur-numbers border-border/50 from-background/95 to-background/90 fixed z-[99] w-64 border bg-gradient-to-b p-1 backdrop-blur-sm"
        :style="{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
        }"
      >
        <div class="grid max-h-32 grid-cols-6 gap-1 overflow-y-auto">
          <div
            v-for="spell in availableSpells"
            :key="spell.id"
            @click="selectSpell(spell.id, activeSpellSlot)"
            class="relative cursor-pointer transition-transform"
            :class="{
              'border-primary border':
                currentSpells[activeSpellSlot] === spell.id,
            }"
          >
            <img
              :src="staticAssets.getSpellIcon(`${spell.id}`)"
              :alt="spell.name"
              :title="spell.name"
              class="border-border/40 border"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 组件样式 */
</style>
