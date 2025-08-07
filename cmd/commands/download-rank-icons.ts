import { Command } from 'commander';
import { resolve, join } from 'path';
import { mkdir } from 'fs/promises';
import { VersionManager } from './utils/version-manager';
import { fileExists, downloadImage } from '../../src/utils/file-utils';
import { SpellData } from '@/types/spell';
import { RuneData } from '@/types/rune';

// 段位数据
const RANK_DATA = [
  {
    id: '0',
    name: '王者',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Challenger.png',
  },
  {
    id: '5',
    name: '宗师',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Grandmaster.png',
  },
  {
    id: '6',
    name: '大师',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Master.png',
  },
  {
    id: '10',
    name: '钻石',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Diamond.png',
  },
  {
    id: '15',
    name: '翡翠',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Emerald.png',
  },
  {
    id: '20',
    name: '铂金',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Platinum.png',
  },
  {
    id: '30',
    name: '黄金',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Gold.png',
  },
  {
    id: '40',
    name: '白银',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Silver.png',
  },
  {
    id: '50',
    name: '黄铜',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Bronze.png',
  },
  {
    id: '80',
    name: '黑铁',
    icon: 'https://down.qq.com/lolapp/lol/rankedicons/Season_2022_Iron.png',
  },
];

// Mini 版本段位数据
const RANK_MINI_DATA = [
  {
    id: '0',
    name: '王者',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/challenger.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '5',
    name: '宗师',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/grandmaster.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '6',
    name: '大师',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/master.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '10',
    name: '钻石',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/diamond.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '15',
    name: '翡翠',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/emerald.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '20',
    name: '铂金',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/platinum.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '30',
    name: '黄金',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/gold.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '40',
    name: '白银',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/silver.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '50',
    name: '黄铜',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/bronze.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
  {
    id: '80',
    name: '黑铁',
    icon: 'https://opgg-static.akamaized.net/images/medals_mini/iron.png?image=q_auto:good,f_webp,w_48&v=1753485429',
  },
];

// 符文数据
const RUNE_DATA = [
  {
    name: '精密',
    id: '8000',
    tone: 'tone1',
    icon: 'https://lol.qq.com/act/a20170926preseason/img/runeBuilder/runes/precision/icon-p-36x36.png',
  },
  {
    name: '主宰',
    id: '8100',
    tone: 'tone2',
    icon: 'https://lol.qq.com/act/a20170926preseason/img/runeBuilder/runes/domination/icon-d-36x36.png',
  },
  {
    name: '巫术',
    id: '8200',
    tone: 'tone3',
    icon: 'https://lol.qq.com/act/a20170926preseason/img/runeBuilder/runes/sorcery/icon-s-36x36.png',
  },
  {
    name: '坚决',
    id: '8400',
    tone: 'tone4',
    icon: 'https://lol.qq.com/act/a20170926preseason/img/runeBuilder/runes/resolve/icon-r-36x36.png',
  },
  {
    name: '启迪',
    id: '8300',
    tone: 'tone5',
    icon: 'https://lol.qq.com/act/a20170926preseason/img/runeBuilder/runes/inspiration/icon-i-36x36.png',
  },
];

// 天赋树映射
const RUNE_TREE_MAP: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};

// 获取天赋数据
async function getRunesReforgedData(version: string): Promise<RuneData[]> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/runesReforged.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取天赋数据失败: ${response.statusText}`);
  }
  return response.json();
}

// 获取召唤师技能数据
async function getSummonerSpellsData(version: string): Promise<SpellData> {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/summoner.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取召唤师技能数据失败: ${response.statusText}`);
  }
  return response.json();
}

/**
 * download-rank-icons 命令实现
 */
export const downloadRankIconsCommand = new Command('download-rank-icons')
  .description('下载段位图标、符文图标、天赋图标和召唤师技能图标')
  .option('-f, --force', '强制重新下载已存在的文件')
  .option('-r, --ranks-only', '只下载段位图标')
  .option('-u, --runes-only', '只下载符文图标')
  .option('-p, --perks-only', '只下载天赋图标')
  .option('-s, --spells-only', '只下载召唤师技能图标')
  .option('-m, --mini-ranks', '下载 mini 版本的段位图标')
  .action(async (options, command) => {
    try {
      console.log('开始下载图标...');

      const globalOptions = command.parent?.opts() || {};
      const baseDir = resolve(globalOptions.dir || 'public/dynamic');

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;

      // 下载段位图标
      if (!options.runesOnly && !options.perksOnly && !options.spellsOnly) {
        console.log('\n下载段位图标...');
        const rankDir = join(baseDir, 'rank');
        await mkdir(rankDir, { recursive: true });

        // 选择使用哪个数据源
        const rankData = options.miniRanks ? RANK_MINI_DATA : RANK_DATA;
        const versionSuffix = options.miniRanks ? '_mini' : '';

        for (const rank of rankData) {
          const fileName = `${rank.id}${versionSuffix}.png`;
          const savePath = join(rankDir, fileName);

          // 检查文件是否已存在
          if (!options.force && (await fileExists(savePath))) {
            console.log(
              `跳过已存在的段位图标: ${rank.name} (${rank.id}${versionSuffix})`
            );
            skipCount++;
            continue;
          }

          console.log(
            `下载段位图标: ${rank.name} (${rank.id}${versionSuffix})`
          );
          try {
            await downloadImage(rank.icon, savePath);
            successCount++;
          } catch (error) {
            console.log(`下载失败: ${rank.name} - ${error}`);
            failCount++;
          }
        }
      }

      // 下载符文图标
      if (!options.ranksOnly && !options.perksOnly && !options.spellsOnly) {
        console.log('\n下载符文图标...');
        const runeDir = join(baseDir, 'rune');
        await mkdir(runeDir, { recursive: true });

        for (const rune of RUNE_DATA) {
          const fileName = `${rune.id}.png`;
          const savePath = join(runeDir, fileName);

          // 检查文件是否已存在
          if (!options.force && (await fileExists(savePath))) {
            console.log(`跳过已存在的符文图标: ${rune.name} (${rune.id})`);
            skipCount++;
            continue;
          }

          console.log(`下载符文图标: ${rune.name} (${rune.id})`);
          try {
            await downloadImage(rune.icon, savePath);
            successCount++;
          } catch (error) {
            console.log(`下载失败: ${rune.name} - ${error}`);
            failCount++;
          }
        }
      }

      // 下载天赋图标
      if (!options.ranksOnly && !options.runesOnly && !options.spellsOnly) {
        console.log('\n下载天赋图标...');
        const perkDir = join(baseDir, 'perk');
        await mkdir(perkDir, { recursive: true });

        // 获取版本信息
        const versionManager = new VersionManager(baseDir);
        await versionManager.cacheVersions();
        const fullVersion = await versionManager.getLatestVersionFromLocal();
        console.log(`当前版本: ${fullVersion}`);

        try {
          // 获取天赋数据
          const runesData = await getRunesReforgedData(fullVersion);
          console.log(`找到 ${runesData.length} 个天赋树`);

          for (const runeTree of runesData) {
            const treeId = runeTree.id;
            const treeName = RUNE_TREE_MAP[treeId];

            if (!treeName) {
              console.log(`未知的天赋树ID: ${treeId}`);
              continue;
            }

            console.log(`\n处理天赋树: ${runeTree.name} (${treeName})`);

            // 遍历天赋槽位
            for (const slot of runeTree.slots) {
              for (const rune of slot.runes) {
                const runeName = rune.name;
                const fileName = `${rune.id}.png`;
                const savePath = join(perkDir, fileName);

                // 检查文件是否已存在
                if (!options.force && (await fileExists(savePath))) {
                  console.log(`跳过已存在的天赋: ${runeName} (${rune.id})`);
                  skipCount++;
                  continue;
                }

                console.log(`下载天赋: ${runeName} (${rune.id})`);
                try {
                  // 直接使用API返回的icon字段构建完整URL
                  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
                  await downloadImage(imageUrl, savePath);
                  successCount++;
                } catch (error) {
                  console.log(`下载失败: ${runeName} - ${error}`);
                  failCount++;
                }
              }
            }
          }
        } catch (error) {
          console.error('获取天赋数据失败:', error);
          failCount++;
        }
      }

      // 下载召唤师技能图标
      if (!options.ranksOnly && !options.runesOnly && !options.perksOnly) {
        console.log('\n下载召唤师技能图标...');
        const spellDir = join(baseDir, 'spell');
        await mkdir(spellDir, { recursive: true });

        // 获取版本信息
        const versionManager = new VersionManager(baseDir);
        await versionManager.cacheVersions();
        const fullVersion = await versionManager.getLatestVersionFromLocal();
        console.log(`当前版本: ${fullVersion}`);

        try {
          // 获取召唤师技能数据
          const summonerData = await getSummonerSpellsData(fullVersion);
          const spells = Object.values(summonerData.data);
          console.log(`找到 ${spells.length} 个召唤师技能`);

          for (const spell of spells) {
            const spellName = spell.name;
            const spellId = spell.key;
            const fileName = `${spellId}.png`;
            const savePath = join(spellDir, fileName);

            // 检查文件是否已存在
            if (!options.force && (await fileExists(savePath))) {
              console.log(`跳过已存在的召唤师技能: ${spellName} (${spellId})`);
              skipCount++;
              continue;
            }

            console.log(`下载召唤师技能: ${spellName} (${spellId})`);
            try {
              // 构建召唤师技能图标URL
              const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${fullVersion}/img/spell/${spell.image.full}`;
              await downloadImage(imageUrl, savePath);
              successCount++;
            } catch (error) {
              console.log(`下载失败: ${spellName} - ${error}`);
              failCount++;
            }
          }
        } catch (error) {
          console.error('获取召唤师技能数据失败:', error);
          failCount++;
        }
      }

      console.log(`\n下载完成!`);
      console.log(`成功下载: ${successCount} 个`);
      console.log(`跳过已存在: ${skipCount} 个`);
      console.log(`下载失败: ${failCount} 个`);
      console.log(`保存目录: ${baseDir}`);
    } catch (error) {
      console.error('下载图标失败:', error);
      process.exit(1);
    }
  });
