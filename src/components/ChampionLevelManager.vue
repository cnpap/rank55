<script setup lang="ts">
import { ref, computed } from 'vue';
import { $local } from '@/storages/storage-use';
import type { ChampionCnData } from '@/types/champion-cn';

// Props
interface Props {
  championId: string;
  champion: ChampionCnData;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  levelChanged: [championId: string, newLevel: number];
  skillLevelChanged: [championId: string, skillLevels: number[]];
}

const emit = defineEmits<Emits>();

// 英雄状态管理
const championLevels = ref<Record<string, number>>({});
const championSkillLevels = ref<Record<string, number[]>>({});
const championSkillHistory = ref<
  Record<string, Array<{ level: number; skillIndex: number }>>
>({});

// 初始化英雄等级和技能
function initChampionLevel(championId: string) {
  if (!(championId in championLevels.value)) {
    championLevels.value[championId] = 1;
  }
  if (!(championId in championSkillLevels.value)) {
    championSkillLevels.value[championId] = [0, 0, 0, 0];
  }
  if (!(championId in championSkillHistory.value)) {
    championSkillHistory.value[championId] = [];
  }
}

// 检查是否可以降级
function canLevelDown(championId: string): boolean {
  const currentLevel = championLevels.value[championId] || 1;
  const skillLevels = championSkillLevels.value[championId] || [0, 0, 0, 0];
  const totalSkillPoints = skillLevels.reduce((sum, level) => sum + level, 0);
  const availablePoints = currentLevel - totalSkillPoints;

  // 如果可用技能点为0，不允许降级
  if (availablePoints <= 0) return false;

  // 如果已经是1级，不能再降
  if (currentLevel <= 1) return false;

  // 检查降级后是否还能满足已加技能点的等级要求
  const newLevel = currentLevel - 1;

  // 检查大招等级要求
  const ultLevel = skillLevels[3];
  if (ultLevel >= 3 && newLevel < 16) return false; // 3级大招需要16级
  if (ultLevel >= 2 && newLevel < 11) return false; // 2级大招需要11级
  if (ultLevel >= 1 && newLevel < 6) return false; // 1级大招需要6级

  // 检查小技能等级要求
  for (let i = 0; i < 3; i++) {
    const skillLevel = skillLevels[i];
    if (skillLevel >= 5 && newLevel < 9) return false; // 5级小技能需要9级
    if (skillLevel >= 4 && newLevel < 7) return false; // 4级小技能需要7级
    if (skillLevel >= 3 && newLevel < 5) return false; // 3级小技能需要5级
    if (skillLevel >= 2 && newLevel < 3) return false; // 2级小技能需要3级
  }

  return true;
}

// 调整英雄等级
function adjustLevel(championId: string, delta: number) {
  const currentLevel = championLevels.value[championId] || 1;

  // 如果是降级，先检查是否可以降级
  if (delta < 0 && !canLevelDown(championId)) {
    return;
  }

  const newLevel = Math.max(1, Math.min(18, currentLevel + delta));
  championLevels.value[championId] = newLevel;
  emit('levelChanged', championId, newLevel);
}

// 检查在指定等级和技能状态下是否可以升级技能
function canLevelUpSkillAtLevel(
  skillLevels: number[],
  skillIndex: number,
  championLevel: number
): boolean {
  const currentSkillLevel = skillLevels[skillIndex];

  if (skillIndex === 3) {
    // R技能 (大招)
    if (championLevel < 6) return false;
    if (currentSkillLevel === 0 && championLevel < 6) return false;
    if (currentSkillLevel === 1 && championLevel < 11) return false;
    if (currentSkillLevel === 2 && championLevel < 16) return false;
    if (currentSkillLevel >= 3) return false;
  } else {
    // Q/W/E技能 (小技能)
    if (currentSkillLevel >= 5) return false;
    if (championLevel === 1 && skillLevels.every(level => level === 0)) {
      return skillIndex !== 3;
    }

    // 小技能等级限制规则
    if (currentSkillLevel === 1 && championLevel < 3) return false;
    if (currentSkillLevel === 2 && championLevel < 5) return false;
    if (currentSkillLevel === 3 && championLevel < 7) return false;
    if (currentSkillLevel === 4 && championLevel < 9) return false;
  }

  return true;
}

// 检查是否可以升级技能
function canLevelUpSkill(
  championId: string,
  skillIndex: number,
  championLevel: number
): boolean {
  const skillLevels = championSkillLevels.value[championId] || [0, 0, 0, 0];
  return canLevelUpSkillAtLevel(skillLevels, skillIndex, championLevel);
}

// 升级技能
function levelUpSkill(championId: string, skillIndex: number) {
  const currentLevel = championLevels.value[championId] || 1;
  const skillLevels = championSkillLevels.value[championId] || [0, 0, 0, 0];
  const totalSkillPoints = skillLevels.reduce((sum, level) => sum + level, 0);
  const availablePoints = currentLevel - totalSkillPoints;

  if (availablePoints <= 0) return;
  if (!canLevelUpSkill(championId, skillIndex, currentLevel)) return;

  skillLevels[skillIndex]++;
  championSkillLevels.value[championId] = [...skillLevels];

  // 记录技能加点历史
  const history = championSkillHistory.value[championId] || [];
  history.push({ level: currentLevel, skillIndex });
  championSkillHistory.value[championId] = history;

  saveSkillLevels();
  emit('skillLevelChanged', championId, [...skillLevels]);
}

// 减技能点功能
function levelDownSkill(championId: string, skillIndex: number) {
  const skillLevels = championSkillLevels.value[championId] || [0, 0, 0, 0];

  if (skillLevels[skillIndex] <= 0) return;

  skillLevels[skillIndex]--;
  championSkillLevels.value[championId] = [...skillLevels];

  // 从历史记录中移除最后一次对该技能的加点
  const history = championSkillHistory.value[championId] || [];
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].skillIndex === skillIndex) {
      history.splice(i, 1);
      break;
    }
  }
  championSkillHistory.value[championId] = history;

  saveSkillLevels();
  emit('skillLevelChanged', championId, [...skillLevels]);
}

// 保存技能等级到本地存储
function saveSkillLevels() {
  $local.setItem('championSkillLevels', championSkillLevels.value);
}

// 计算指定等级的属性
function calculateStats(champion: ChampionCnData, level: number) {
  const hero = champion.hero;
  return {
    hp: Math.round(
      parseFloat(hero.hp) + (level - 1) * parseFloat(hero.hpperlevel)
    ),
    hpregen: (
      parseFloat(hero.hpregen) +
      (level - 1) * parseFloat(hero.hpregenperlevel)
    ).toFixed(1),
    mp: Math.round(
      parseFloat(hero.mp) + (level - 1) * parseFloat(hero.mpperlevel)
    ),
    mpregen: (
      parseFloat(hero.mpregen) +
      (level - 1) * parseFloat(hero.mpregenperlevel)
    ).toFixed(1),
    attackdamage: Math.round(
      parseFloat(hero.attackdamage) +
        (level - 1) * parseFloat(hero.attackdamageperlevel)
    ),
    attackspeed: (
      parseFloat(hero.attackspeed) *
      (1 + ((level - 1) * parseFloat(hero.attackspeedperlevel)) / 100)
    ).toFixed(2),
    armor: (
      parseFloat(hero.armor) +
      (level - 1) * parseFloat(hero.armorperlevel)
    ).toFixed(1),
    spellblock: (
      parseFloat(hero.spellblock) +
      (level - 1) * parseFloat(hero.spellblockperlevel)
    ).toFixed(1),
    movespeed: parseFloat(hero.movespeed),
    attackrange: parseFloat(hero.attackrange),
    crit: (
      parseFloat(hero.crit) +
      (level - 1) * parseFloat(hero.critperlevel)
    ).toFixed(1),
  };
}

// 获取当前英雄等级
const currentLevel = computed(() => {
  return championLevels.value[props.championId] || 1;
});

// 获取当前技能等级
const currentSkillLevels = computed(() => {
  return championSkillLevels.value[props.championId] || [0, 0, 0, 0];
});

// 获取当前属性
const currentStats = computed(() => {
  return calculateStats(props.champion, currentLevel.value);
});

// 初始化当前英雄
initChampionLevel(props.championId);

// 暴露方法给父组件
defineExpose({
  adjustLevel,
  levelUpSkill,
  levelDownSkill,
  canLevelUpSkill,
  currentLevel,
  currentSkillLevels,
  currentStats,
  initChampionLevel,
});
</script>

<template>
  <!-- 这个组件主要提供逻辑，不包含UI -->
  <slot
    :current-level="currentLevel"
    :current-skill-levels="currentSkillLevels"
    :current-stats="currentStats"
    :adjust-level="adjustLevel"
    :level-up-skill="levelUpSkill"
    :level-down-skill="levelDownSkill"
    :can-level-up-skill="canLevelUpSkill"
  />
</template>
