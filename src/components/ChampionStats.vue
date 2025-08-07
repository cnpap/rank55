<script setup lang="ts">
import { computed } from 'vue';
import type { ChampionCnData } from '@/types/champion-cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Props
interface Props {
  champion: ChampionCnData;
  currentLevel: number;
  currentStats: {
    hp: number;
    hpregen: string;
    mp: number;
    mpregen: string;
    attackdamage: number;
    attackspeed: string;
    armor: string;
    spellblock: string;
    movespeed: number;
    attackrange: number;
    crit: string;
  };
}

const props = defineProps<Props>();

// 计算18级属性
function calculateLevel18Stats(champion: ChampionCnData) {
  const hero = champion.hero;
  return {
    hp: Math.round(parseFloat(hero.hp) + 17 * parseFloat(hero.hpperlevel)),
    hpregen: (
      parseFloat(hero.hpregen) +
      17 * parseFloat(hero.hpregenperlevel)
    ).toFixed(1),
    mp: Math.round(parseFloat(hero.mp) + 17 * parseFloat(hero.mpperlevel)),
    mpregen: (
      parseFloat(hero.mpregen) +
      17 * parseFloat(hero.mpregenperlevel)
    ).toFixed(1),
    attackdamage: Math.round(
      parseFloat(hero.attackdamage) + 17 * parseFloat(hero.attackdamageperlevel)
    ),
    attackspeed: (
      parseFloat(hero.attackspeed) *
      (1 + (17 * parseFloat(hero.attackspeedperlevel)) / 100)
    ).toFixed(2),
    armor: (
      parseFloat(hero.armor) +
      17 * parseFloat(hero.armorperlevel)
    ).toFixed(1),
    spellblock: (
      parseFloat(hero.spellblock) +
      17 * parseFloat(hero.spellblockperlevel)
    ).toFixed(1),
    movespeed: parseFloat(hero.movespeed),
    attackrange: parseFloat(hero.attackrange),
    crit: (parseFloat(hero.crit) + 17 * parseFloat(hero.critperlevel)).toFixed(
      1
    ),
  };
}

// 格式化每级增长值
function formatPerLevelGrowth(perLevelValue: number, isPercentage = false) {
  if (perLevelValue === 0) return '0';
  const sign = perLevelValue > 0 ? '+' : '';
  if (isPercentage) {
    return `${sign}${perLevelValue.toFixed(2)}%`;
  }
  // 对于小于0.1的数值，保留3位小数；否则保留1位小数
  const decimals = Math.abs(perLevelValue) < 0.1 ? 3 : 1;
  return `${sign}${perLevelValue.toFixed(decimals)}`;
}

// 计算攻速每级增长（特殊处理）
function getAttackSpeedPerLevel(champion: ChampionCnData) {
  const baseAS = parseFloat(champion.hero.attackspeed);
  const perLevelPercent = parseFloat(champion.hero.attackspeedperlevel);
  const actualGrowth = baseAS * (perLevelPercent / 100);
  return actualGrowth;
}

// 获取资源类型
function getResourceType(champion: ChampionCnData): string {
  // 根据英雄的伤害类型或其他属性判断资源类型
  // 这里可以根据需要进行更复杂的判断
  return '法力'; // 默认为法力
}

// 将statsData改为computed属性
const statsData = computed(() => {
  const level18Stats = calculateLevel18Stats(props.champion);
  const resourceType = getResourceType(props.champion);

  return [
    // 生存属性
    {
      category: '生存',
      items: [
        {
          name: '生命',
          current: props.currentStats.hp,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.hpperlevel)
          ),
          level18: level18Stats.hp,
          color: 'text-green-600 dark:text-green-500',
        },
        {
          name: '生命回复',
          current: `${props.currentStats.hpregen}/5s`,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.hpregenperlevel)
          ),
          level18: `${level18Stats.hpregen}/5s`,
          color: '',
        },
        {
          name: resourceType,
          current: props.currentStats.mp,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.mpperlevel)
          ),
          level18: level18Stats.mp,
          color: 'text-blue-600 dark:text-blue-500',
        },
        {
          name: `${resourceType}回复`,
          current: `${props.currentStats.mpregen}/5s`,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.mpregenperlevel)
          ),
          level18: `${level18Stats.mpregen}/5s`,
          color: '',
        },
      ],
    },
    // 攻击属性
    {
      category: '攻击',
      items: [
        {
          name: '攻击力',
          current: props.currentStats.attackdamage,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.attackdamageperlevel)
          ),
          level18: level18Stats.attackdamage,
          color: 'text-red-600 dark:text-red-500',
        },
        {
          name: '攻速',
          current: props.currentStats.attackspeed,
          perLevel: formatPerLevelGrowth(
            getAttackSpeedPerLevel(props.champion)
          ),
          level18: level18Stats.attackspeed,
          color: '',
        },
        {
          name: '暴击',
          current: `${props.currentStats.crit}%`,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.critperlevel)
          ),
          level18: `${level18Stats.crit}%`,
          color: '',
        },
        {
          name: '攻击距离',
          current: props.currentStats.attackrange,
          perLevel: '0',
          level18: level18Stats.attackrange,
          color: '',
        },
      ],
    },
    // 防御属性
    {
      category: '防御',
      items: [
        {
          name: '护甲',
          current: props.currentStats.armor,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.armorperlevel)
          ),
          level18: level18Stats.armor,
          color: '',
        },
        {
          name: '魔抗',
          current: props.currentStats.spellblock,
          perLevel: formatPerLevelGrowth(
            parseFloat(props.champion.hero.spellblockperlevel)
          ),
          level18: level18Stats.spellblock,
          color: '',
        },
        {
          name: '移速',
          current: props.currentStats.movespeed,
          perLevel: '0',
          level18: level18Stats.movespeed,
          color: '',
        },
      ],
    },
  ];
});
</script>

<template>
  <div>
    <h5 class="text-muted-foreground mb-3 font-semibold">属性</h5>

    <div class="space-y-4">
      <div v-for="category in statsData" :key="category.category">
        <h6 class="mb-2 text-sm font-medium">{{ category.category }}</h6>

        <Table class="bg-card/40">
          <TableHeader>
            <TableRow>
              <TableHead class="w-[80px] text-xs">属性</TableHead>
              <TableHead class="w-[60px] text-center text-xs">当前</TableHead>
              <TableHead class="w-[50px] text-center text-xs">每级</TableHead>
              <TableHead class="w-[60px] text-center text-xs">18级</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="item in category.items"
              :key="item.name"
              class="text-sm"
            >
              <TableCell class="py-1 font-medium">{{ item.name }}</TableCell>
              <TableCell
                class="py-1 text-center font-medium"
                :class="item.color"
              >
                {{ item.current }}
              </TableCell>
              <TableCell class="text-muted-foreground py-1 text-center text-xs">
                {{ item.perLevel }}
              </TableCell>
              <TableCell class="text-muted-foreground py-1 text-center text-xs">
                {{ item.level18 }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
