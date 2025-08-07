<script setup lang="ts">
interface Props {
  championId: string;
  equipment: (string | null)[];
}

interface Emits {
  updateEquipment: [
    championId: string,
    slotIndex: number,
    itemId: string | null,
  ];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleSlotClick(slotIndex: number) {
  // 这里可以打开装备选择器
  console.log(`装备栏 ${slotIndex + 1} 被点击`);
}

function removeItem(slotIndex: number) {
  emit('updateEquipment', props.championId, slotIndex, null);
}
</script>

<template>
  <div>
    <h5 class="text-muted-foreground mb-3 font-semibold">装备</h5>
    <div class="flex gap-2">
      <div
        v-for="(item, index) in equipment"
        :key="index"
        class="border-muted-foreground/20 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 group relative flex h-12 w-12 cursor-pointer items-center justify-center border border-dashed transition-colors"
        :title="`装备栏 ${index + 1}`"
        @click="handleSlotClick(index)"
      >
        <div v-if="item" class="relative h-full w-full">
          <!-- 这里可以显示装备图标 -->
          <div
            class="flex h-full w-full items-center justify-center rounded bg-gray-300"
          >
            <span class="text-xs">{{ index + 1 }}</span>
          </div>
          <!-- 移除按钮 -->
          <button
            class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            @click.stop="removeItem(index)"
          >
            ×
          </button>
        </div>
        <span v-else class="text-muted-foreground text-lg font-thin">+</span>
      </div>
    </div>
  </div>
</template>
