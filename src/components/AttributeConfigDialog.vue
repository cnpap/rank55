<script setup lang="ts">
import { reactive, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AttributeValues } from '@/utils/item-calculator';

interface Props {
  open: boolean;
  attributeValues: AttributeValues;
}

interface Emits {
  'update:open': [value: boolean];
  'update:attributeValues': [values: AttributeValues];
  apply: [values: AttributeValues];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 本地副本，避免直接修改props
const localValues = reactive<AttributeValues>({ ...props.attributeValues });

// 监听props变化，同步到本地副本
watch(
  () => props.attributeValues,
  newValues => {
    Object.assign(localValues, newValues);
  },
  { deep: true }
);

// 应用配置
function applyConfig() {
  emit('apply', { ...localValues });
  emit('update:open', false);
}

// 取消配置
function cancelConfig() {
  // 恢复到原始值
  Object.assign(localValues, props.attributeValues);
  emit('update:open', false);
}

// 属性配置项定义
const attributeFields = [
  { key: 'ad', label: '攻击力', step: 1 },
  { key: 'ap', label: '法术强度', step: 0.01 },
  { key: 'hp', label: '生命值', step: 0.01 },
  { key: 'armor', label: '护甲', step: 1 },
  { key: 'mr', label: '魔法抗性', step: 1 },
  { key: 'as', label: '攻击速度(%)', step: 1 },
  { key: 'crit', label: '暴击几率(%)', step: 1 },
  { key: 'mana', label: '法力值', step: 0.01 },
  { key: 'ms', label: '移动速度', step: 0.1 },
  { key: 'msPercent', label: '移动速度(%)', step: 1 },
  { key: 'lethality', label: '穿甲', step: 1 },
  { key: 'armorPenPercent', label: '护甲穿透(%)', step: 1 },
  { key: 'magicPen', label: '法术穿透', step: 1 },
  { key: 'magicPenPercent', label: '法术穿透(%)', step: 1 },
  { key: 'cdr', label: '技能急速', step: 0.01 },
  { key: 'lifesteal', label: '生命偷取(%)', step: 1 },
  { key: 'spellvamp', label: '法术吸血(%)', step: 1 },
  { key: 'hpregen', label: '生命回复(%)', step: 0.01 },
  { key: 'manaregen', label: '法力回复(%)', step: 0.01 },
  { key: 'healShieldPower', label: '治疗护盾强度(%)', step: 1 },
] as const;
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>属性价值配置</DialogTitle>
      </DialogHeader>
      <div class="grid max-h-96 grid-cols-3 gap-4 overflow-y-auto py-4">
        <div
          v-for="field in attributeFields"
          :key="field.key"
          class="space-y-2"
        >
          <Label>{{ field.label }}</Label>
          <Input
            v-model.number="localValues[field.key]"
            type="number"
            :step="field.step"
            min="0"
          />
        </div>
      </div>
      <div class="flex justify-end space-x-2">
        <Button variant="outline" @click="cancelConfig">取消</Button>
        <Button @click="applyConfig">应用配置</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
