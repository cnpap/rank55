<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import type { ChampionCnData } from '@/types/champion-cn';
import { versionedAssets } from '@/assets/versioned-assets';

interface Props {
  championId: string;
  championKey: string;
  championLevel: number;
  skillLevels: number[];
  championDetails: ChampionCnData | null;
  abilityHaste: number;
}

interface Emits {
  levelUpSkill: [championId: string, skillIndex: number];
  levelDownSkill: [championId: string, skillIndex: number];
  adjustLevel: [championId: string, delta: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算可用技能点
const availableSkillPoints = computed(() => {
  const usedPoints = props.skillLevels.reduce((sum, level) => sum + level, 0);
  return props.championLevel - usedPoints;
});

// 检查是否可以降低等级
const canLevelDown = computed(() => {
  // 如果可用技能点为0，不允许降级
  if (availableSkillPoints.value <= 0) return false;

  // 如果已经是1级，不能再降
  if (props.championLevel <= 1) return false;

  // 检查降级后是否还能满足已加技能点的等级要求
  const newLevel = props.championLevel - 1;

  // 检查大招等级要求
  const ultLevel = props.skillLevels[3];
  if (ultLevel >= 3 && newLevel < 16) return false; // 3级大招需要16级
  if (ultLevel >= 2 && newLevel < 11) return false; // 2级大招需要11级
  if (ultLevel >= 1 && newLevel < 6) return false; // 1级大招需要6级

  // 检查小技能等级要求
  for (let i = 0; i < 3; i++) {
    const skillLevel = props.skillLevels[i];
    if (skillLevel >= 5 && newLevel < 9) return false; // 5级小技能需要9级
    if (skillLevel >= 4 && newLevel < 7) return false; // 4级小技能需要7级
    if (skillLevel >= 3 && newLevel < 5) return false; // 3级小技能需要5级
    if (skillLevel >= 2 && newLevel < 3) return false; // 2级小技能需要3级
  }

  return true;
});

// 检查是否可以升级技能
function canLevelUpSkill(skillIndex: number): boolean {
  const currentSkillLevel = props.skillLevels[skillIndex];

  // 没有可用技能点时不能升级
  if (availableSkillPoints.value <= 0) return false;

  if (skillIndex === 3) {
    // R技能 (大招)
    if (currentSkillLevel >= 3) return false; // 最多3级
    if (currentSkillLevel === 0 && props.championLevel < 6) return false; // 6级学第1级
    if (currentSkillLevel === 1 && props.championLevel < 11) return false; // 11级学第2级
    if (currentSkillLevel === 2 && props.championLevel < 16) return false; // 16级学第3级
  } else {
    // Q/W/E技能 (小技能)
    if (currentSkillLevel >= 5) return false; // 最多5级

    // 1级时必须先学一个小技能
    if (
      props.championLevel === 1 &&
      props.skillLevels.every(level => level === 0)
    ) {
      return true;
    }

    // 小技能等级限制规则
    if (currentSkillLevel === 0) {
      // 可以学第1级
      return true;
    } else if (currentSkillLevel === 1) {
      // 3级可以学第2级
      return props.championLevel >= 3;
    } else if (currentSkillLevel === 2) {
      // 5级可以学第3级
      return props.championLevel >= 5;
    } else if (currentSkillLevel === 3) {
      // 7级可以学第4级
      return props.championLevel >= 7;
    } else if (currentSkillLevel === 4) {
      // 9级可以学第5级
      return props.championLevel >= 9;
    }
  }

  return true;
}

// 获取技能图标URL
function getSkillImageUrl(skillIndex: number): string {
  const skillNames = ['Q', 'W', 'E', 'R'];
  return versionedAssets.getSkillIcon(
    props.championKey,
    skillNames[skillIndex]
  );
}

// 获取技能按键
function getSkillKey(index: number): string {
  return ['Q', 'W', 'E', 'R'][index];
}

// 获取被动技能图标URL
function getPassiveImageUrl(): string {
  return versionedAssets.getPassiveIcon(props.championKey);
}

// 获取技能名称
function getSkillName(skillIndex: number): string {
  if (!props.championDetails) return '';

  const skillKeys = ['q', 'w', 'e', 'r'] as const; // 改为小写
  const skillKey = skillKeys[skillIndex];
  const skill = props.championDetails.spells.find(
    spell => spell.spellKey === skillKey
  );

  return skill?.name || '';
}

// 获取技能描述
function getSkillDescription(skillIndex: number): string {
  if (!props.championDetails) return '';

  const skillKeys = ['q', 'w', 'e', 'r'] as const; // 改为小写
  const skillKey = skillKeys[skillIndex];
  const skill = props.championDetails.spells.find(
    spell => spell.spellKey === skillKey
  );

  return skill?.description || '';
}

// 计算技能冷却时间
function calculateSkillCooldown(skillIndex: number): number {
  if (!props.championDetails) return 0;

  const skillKeys = ['q', 'w', 'e', 'r'] as const; // 改为小写
  const skillKey = skillKeys[skillIndex];

  // 从 spells 数组中找到对应的技能
  const skill = props.championDetails.spells.find(
    spell => spell.spellKey === skillKey
  );

  if (!skill) return 0;

  const skillLevel = props.skillLevels[skillIndex];
  if (skillLevel === 0) {
    // 解析冷却时间字符串，取第一个值
    const cooldowns = skill.cooldown.split('/');
    return parseFloat(cooldowns[0]) || 0;
  }

  // 解析冷却时间字符串
  const cooldowns = skill.cooldown.split('/');
  const baseCooldown =
    parseFloat(cooldowns[skillLevel - 1] || cooldowns[0]) || 0;
  const actualCooldown = baseCooldown / (1 + props.abilityHaste / 100);
  return Math.round(actualCooldown * 10) / 10;
}

// 获取被动技能信息
function getPassiveSkill() {
  if (!props.championDetails) return null;
  return props.championDetails.spells.find(
    spell => spell.spellKey === 'passive'
  );
}

// 获取被动技能名称
function getPassiveName(): string {
  const passive = getPassiveSkill();
  return passive?.name || '被动技能';
}

// 获取被动技能描述
function getPassiveDescription(): string {
  const passive = getPassiveSkill();
  return passive?.description || '';
}
</script>

<template>
  <div v-if="championDetails">
    <!-- 技能区域 -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium">等级:</span>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            class="h-6 w-6"
            :disabled="!canLevelDown"
            @click="emit('adjustLevel', championId, -1)"
          >
            -
          </Button>
          <span class="min-w-[2rem] text-center text-lg font-bold">{{
            championLevel
          }}</span>
          <Button
            variant="outline"
            size="icon"
            class="h-6 w-6"
            :disabled="championLevel >= 18"
            @click="emit('adjustLevel', championId, 1)"
          >
            +
          </Button>
        </div>
      </div>
      <span class="text-muted-foreground text-sm">
        可用技能点: {{ availableSkillPoints }}
      </span>
    </div>

    <div class="flex gap-2">
      <!-- 被动技能 -->
      <div class="flex flex-col items-center space-y-1">
        <div class="relative">
          <div
            class="border-border/60 bg-muted/20 flex h-12 w-12 items-center justify-center border-2"
            :title="`${getPassiveName()}\n${getPassiveDescription()}`"
          >
            <img
              :src="getPassiveImageUrl()"
              alt="被动技能"
              class="h-8 w-8 object-cover"
            />
            <span v-if="!getPassiveImageUrl()" class="text-xs font-bold"
              >P</span
            >
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs font-medium">P</div>
          <div class="text-muted-foreground text-xs">被动</div>
        </div>
      </div>

      <!-- 主动技能 Q/W/E/R -->
      <div
        v-for="(skillKey, index) in ['Q', 'W', 'E', 'R']"
        :key="skillKey"
        class="flex flex-col items-center space-y-1"
      >
        <div class="relative">
          <div
            class="border-border/60 bg-muted/20 flex h-12 w-12 cursor-pointer items-center justify-center border-2 transition-colors"
            :class="{
              'border-blue-500 bg-blue-100 dark:bg-blue-900':
                skillLevels[index] > 0,
              'hover:border-primary/40':
                canLevelUpSkill(index) && availableSkillPoints > 0,
            }"
            :title="`${getSkillName(index)}\n${getSkillDescription(index)}\n冷却: ${calculateSkillCooldown(index)}s`"
            @click="emit('levelUpSkill', championId, index)"
            @contextmenu.prevent="emit('levelDownSkill', championId, index)"
          >
            <img
              :src="getSkillImageUrl(index)"
              :alt="getSkillName(index)"
              class="h-8 w-8 object-cover"
            />
            <span v-if="!getSkillImageUrl(index)" class="text-xs font-bold">{{
              getSkillKey(index)
            }}</span>
          </div>

          <!-- 技能等级显示 -->
          <div
            v-if="skillLevels[index] > 0"
            class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
          >
            {{ skillLevels[index] }}
          </div>

          <!-- 升级/降级按钮 -->
          <div class="absolute right-0 bottom-0 left-0 flex justify-between">
            <Button
              variant="outline"
              size="icon"
              class="h-4 w-4 text-xs"
              :disabled="skillLevels[index] <= 0"
              @click.stop="emit('levelDownSkill', championId, index)"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="h-4 w-4 text-xs"
              :disabled="!canLevelUpSkill(index) || availableSkillPoints <= 0"
              @click.stop="emit('levelUpSkill', championId, index)"
            >
              +
            </Button>
          </div>
        </div>

        <div class="text-center">
          <div class="text-xs font-medium">{{ getSkillKey(index) }}</div>
          <div class="text-muted-foreground text-xs">
            {{ calculateSkillCooldown(index) }}s
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
