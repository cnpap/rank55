import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { SummonerService } from '../service/summoner-service';
import { LCUClientInterface } from '../client/interface';
import fs from 'fs/promises';
import path from 'path';
import { testDataLoader } from '../data-loader';
import {
  formatGameDuration,
  formatNumber,
  getQueueName,
} from '../rank-helpers';

// 创建测试数据目录路径
const TEST_DATA_DIR = path.join(__dirname, 'test-data');

// 确保测试数据目录存在
async function ensureTestDataDir() {
  try {
    await fs.access(TEST_DATA_DIR);
  } catch {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  }
}

describe('MatchDetailedStats', () => {
  let lcuClient: LCUClientInterface;
  let summonerService: SummonerService;

  // 测试获取战绩详细统计（真实LOL）
  describe('GetMatchDetailedStats - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取战绩详细统计数据', async () => {
      if (!lcuClient) return;

      console.log('=== 开始测试真实LOL客户端战绩详细统计 ===');

      const isConnected = await lcuClient.isConnected();
      if (!isConnected) {
        console.log('⏭️ LOL客户端未连接');
        return;
      }

      console.log('🔗 成功连接到LOL客户端');

      // 先获取当前召唤师信息
      const summoner = await summonerService.getCurrentSummoner();
      if (!summoner) {
        console.log('⏭️ 无法获取召唤师信息');
        return;
      }

      const displayName = summoner.displayName || summoner.gameName || '';
      console.log(`👤 当前召唤师: ${displayName} (PUUID: ${summoner.puuid})`);

      // 使用PUUID获取最近5场比赛记录
      const matchHistory = await summonerService.getMatchHistory(
        summoner.puuid,
        0,
        4
      );

      // 验证数据结构
      expect(matchHistory).toBeDefined();
      expect(matchHistory).not.toBeNull();

      if (
        !matchHistory.games ||
        !matchHistory.games.games ||
        matchHistory.games.games.length === 0
      ) {
        console.log('ℹ️ 当前召唤师没有游戏记录');
        return;
      }

      // 确保测试数据目录存在
      await ensureTestDataDir();

      // 保存战绩数据到测试数据文件夹
      const filename = path.join(TEST_DATA_DIR, 'match_detailed_stats.json');
      await fs.writeFile(filename, JSON.stringify(matchHistory, null, 2));
      console.log(`💾 战绩详细统计数据已保存到: ${filename}`);

      // 显示详细的伤害统计数据
      await printDetailedMatchStats(matchHistory, summoner, summonerService);

      console.log('✅ 战绩详细统计测试通过');
    });
  });
});

// 打印详细的伤害统计数据
async function printDetailedMatchStats(
  matchHistory: any,
  summoner: any,
  summonerService: SummonerService
): Promise<void> {
  console.log('\n📊 ==================== 详细伤害统计 ====================');

  // 收集所有英雄ID和装备ID，批量获取名称
  const allChampionIds = new Set<number>();
  const allItemIds = new Set<number>();

  // 首先获取所有对局的详细数据
  const detailedMatches: any[] = [];

  for (let i = 0; i < matchHistory.games.games.length; i++) {
    const game = matchHistory.games.games[i];
    const gameID = game.gameId;

    console.log(`🔄 正在获取第 ${i + 1} 局详细数据 (GameID: ${gameID})...`);

    try {
      // 获取单局详细数据 - 这是关键修复
      const matchDetail = await summonerService.getMatchDetail(gameID);
      detailedMatches.push(matchDetail);

      // 收集英雄和装备ID
      if (matchDetail.participants) {
        for (const participant of matchDetail.participants) {
          allChampionIds.add(participant.championId);

          // 收集装备ID
          const items = [
            participant.stats?.item0,
            participant.stats?.item1,
            participant.stats?.item2,
            participant.stats?.item3,
            participant.stats?.item4,
            participant.stats?.item5,
            participant.stats?.item6,
          ].filter(item => item && item !== 0);

          items.forEach(item => allItemIds.add(item));
        }
      }

      // 收集禁用英雄ID
      if (matchDetail.teams) {
        for (const team of matchDetail.teams) {
          if (team.bans) {
            for (const ban of team.bans) {
              if (ban.championId && ban.championId !== -1) {
                allChampionIds.add(ban.championId);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`❌ 获取第 ${i + 1} 局详细数据失败: ${error}`);
      continue;
    }
  }

  // 批量获取名称
  const championNames = await testDataLoader.getChampionNames(
    Array.from(allChampionIds)
  );
  const itemNames = await testDataLoader.getItemNames(Array.from(allItemIds));

  // 遍历每场详细比赛数据
  for (let i = 0; i < detailedMatches.length; i++) {
    const matchDetail = detailedMatches[i];

    // 找到当前玩家的参与者ID
    let currentParticipantID = 0;
    if (matchDetail.participantIdentities) {
      for (const identity of matchDetail.participantIdentities) {
        if (identity.player?.summonerId === summoner.accountId) {
          currentParticipantID = identity.participantId;
          break;
        }
      }
    }

    // 找到对应的参与者数据
    let currentPlayer: any = null;
    if (matchDetail.participants) {
      for (const participant of matchDetail.participants) {
        if (participant.participantId === currentParticipantID) {
          currentPlayer = participant;
          break;
        }
      }
    }

    if (!currentPlayer) {
      console.log(`第 ${i + 1} 局: 未找到玩家数据`);
      continue;
    }

    // 获取英雄名称
    const championName =
      championNames.get(String(currentPlayer.championId)) ||
      `英雄${currentPlayer.championId}`;

    // 获取游戏模式
    const queueName = getQueueName(matchDetail.queueId);
    const result = currentPlayer.stats?.win ? '✅胜利' : '❌败北';

    // 打印比赛基本信息
    console.log(
      `\n🎮 第 ${i + 1} 局: ${championName} - ${queueName} - ${result} - ${formatGameDuration(matchDetail.gameDuration)}`
    );

    // 确保获取所有参与者数据
    const allParticipants = matchDetail.participants || [];

    // 获取当前玩家所在队伍的所有成员
    const teamMembers = allParticipants.filter(
      (p: any) => p.teamId === currentPlayer.teamId
    );

    // 获取敌方队伍的所有成员
    const enemyTeamMembers = allParticipants.filter(
      (p: any) => p.teamId !== currentPlayer.teamId
    );

    // 计算队伍总伤害
    const teamTotalDamage = teamMembers.reduce(
      (sum: number, p: any) =>
        sum + (p.stats?.totalDamageDealtToChampions || 0),
      0
    );

    // 计算队伍总承受伤害
    const teamTotalDamageTaken = teamMembers.reduce(
      (sum: number, p: any) => sum + (p.stats?.totalDamageTaken || 0),
      0
    );

    // 计算队伍总经济
    const teamTotalGold = teamMembers.reduce(
      (sum: number, p: any) => sum + (p.stats?.goldEarned || 0),
      0
    );

    // 计算队伍总击杀数和总死亡数
    const teamTotalKills = teamMembers.reduce(
      (sum: number, p: any) => sum + (p.stats?.kills || 0),
      0
    );

    const teamTotalDeaths = teamMembers.reduce(
      (sum: number, p: any) => sum + (p.stats?.deaths || 0),
      0
    );

    // 计算敌方队伍总击杀数（应该等于我方总死亡数）
    const enemyTotalKills = enemyTeamMembers.reduce(
      (sum: number, p: any) => sum + (p.stats?.kills || 0),
      0
    );

    // 计算当前玩家参与击杀数（击杀+助攻）
    const playerKillParticipation =
      (currentPlayer.stats?.kills || 0) + (currentPlayer.stats?.assists || 0);

    // 计算参团率 (确保不超过100%)
    const killParticipationRate =
      teamTotalKills > 0
        ? Math.min(100, (playerKillParticipation / teamTotalKills) * 100)
        : 0;

    // 打印伤害统计
    console.log('\n💥 伤害统计:');

    // 各项伤害
    const physicalDamage =
      currentPlayer.stats?.physicalDamageDealtToChampions || 0;
    const magicDamage = currentPlayer.stats?.magicDamageDealtToChampions || 0;
    const trueDamage = currentPlayer.stats?.trueDamageDealtToChampions || 0;
    const totalDamage = currentPlayer.stats?.totalDamageDealtToChampions || 0;

    // 各项承受伤害
    const physicalDamageTaken = currentPlayer.stats?.physicalDamageTaken || 0;
    const magicDamageTaken = currentPlayer.stats?.magicalDamageTaken || 0;
    const trueDamageTaken = currentPlayer.stats?.trueDamageTaken || 0;
    const totalDamageTaken = currentPlayer.stats?.totalDamageTaken || 0;

    // 打印伤害详情 - 修复队伍占比计算
    console.log(
      `   总伤害: ${formatNumber(totalDamage)} (队伍占比: ${teamTotalDamage > 0 ? ((totalDamage / teamTotalDamage) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 物理伤害: ${formatNumber(physicalDamage)} (${totalDamage > 0 ? ((physicalDamage / totalDamage) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 魔法伤害: ${formatNumber(magicDamage)} (${totalDamage > 0 ? ((magicDamage / totalDamage) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 真实伤害: ${formatNumber(trueDamage)} (${totalDamage > 0 ? ((trueDamage / totalDamage) * 100).toFixed(1) : '0.0'}%)`
    );

    // 打印承受伤害详情 - 修复队伍占比计算
    console.log(`\n🛡️ 承受伤害统计:`);
    console.log(
      `   总承受伤害: ${formatNumber(totalDamageTaken)} (队伍占比: ${teamTotalDamageTaken > 0 ? ((totalDamageTaken / teamTotalDamageTaken) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 承受物理伤害: ${formatNumber(physicalDamageTaken)} (${totalDamageTaken > 0 ? ((physicalDamageTaken / totalDamageTaken) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 承受魔法伤害: ${formatNumber(magicDamageTaken)} (${totalDamageTaken > 0 ? ((magicDamageTaken / totalDamageTaken) * 100).toFixed(1) : '0.0'}%)`
    );
    console.log(
      `   - 承受真实伤害: ${formatNumber(trueDamageTaken)} (${totalDamageTaken > 0 ? ((trueDamageTaken / totalDamageTaken) * 100).toFixed(1) : '0.0'}%)`
    );

    // 打印参团率
    console.log(`\n👥 参团统计:`);
    console.log(
      `   参团率: ${killParticipationRate.toFixed(1)}% (参与${playerKillParticipation}/${teamTotalKills}次击杀)`
    );
    console.log(
      `   全局击杀: 我方${teamTotalKills}次 / 敌方${enemyTotalKills}次`
    );
    console.log(`   全局阵亡: 我方${teamTotalDeaths}次`);

    // 打印经济占比 - 修复队伍占比计算
    const goldEarned = currentPlayer.stats?.goldEarned || 0;
    console.log(`\n💰 经济统计:`);
    console.log(
      `   获得金币: ${formatNumber(goldEarned)} (队伍占比: ${teamTotalGold > 0 ? ((goldEarned / teamTotalGold) * 100).toFixed(1) : '0.0'}%)`
    );

    // 打印其他有用的统计数据
    console.log(`\n📈 其他统计:`);
    console.log(`   视野得分: ${currentPlayer.stats?.visionScore || 0}`);
    console.log(
      `   控制时间: ${(currentPlayer.stats?.timeCCingOthers || 0).toFixed(1)}秒`
    );
    console.log(
      `   自我减伤: ${formatNumber(currentPlayer.stats?.damageSelfMitigated || 0)}`
    );
    console.log(
      `   治疗量: ${formatNumber(currentPlayer.stats?.totalHeal || 0)}`
    );

    // 显示所有玩家信息
    console.log('\n👥 ==================== 所有玩家数据 ====================');
    console.log(
      '队伍 | 玩家名称     | 英雄名称     | KDA      | 伤害   | 补刀 | 金币   | 装备'
    );
    console.log(
      '-----|-------------|-------------|----------|--------|------|--------|--------'
    );

    // 确保获取所有参与者数据
    if (allParticipants.length > 0) {
      // 先显示蓝队玩家
      const blueTeamMembers = allParticipants.filter(
        (p: any) => p.teamId === 100
      );
      for (const participant of blueTeamMembers) {
        // 找到对应的玩家信息
        let playerName = '未知玩家';
        if (matchDetail.participantIdentities) {
          for (const identity of matchDetail.participantIdentities) {
            if (identity.participantId === participant.participantId) {
              // 优先使用 gameName + tagLine，然后是 summonerName
              if (identity.player?.gameName && identity.player?.tagLine) {
                playerName = `${identity.player.gameName}#${identity.player.tagLine}`;
              } else if (identity.player?.summonerName) {
                playerName = identity.player.summonerName;
              } else if (identity.player?.displayName) {
                playerName = identity.player.displayName;
              }
              break;
            }
          }
        }

        const teamColor = '🔵蓝';
        const championName =
          championNames.get(String(participant.championId)) ||
          `英雄${participant.championId}`;
        const kda = `${participant.stats?.kills || 0}/${participant.stats?.deaths || 0}/${participant.stats?.assists || 0}`;
        const damage = formatNumber(
          participant.stats?.totalDamageDealtToChampions || 0
        );
        const cs =
          (participant.stats?.totalMinionsKilled || 0) +
          (participant.stats?.neutralMinionsKilled || 0);
        const gold = formatNumber(participant.stats?.goldEarned || 0);

        // 获取装备信息
        const items = [
          participant.stats?.item0,
          participant.stats?.item1,
          participant.stats?.item2,
          participant.stats?.item3,
          participant.stats?.item4,
          participant.stats?.item5,
          participant.stats?.item6,
        ].filter(item => item && item !== 0);

        const itemsStr =
          items.length > 0
            ? items
                .map(item => itemNames.get(String(item)) || `装备${item}`)
                .join(',')
            : '无';

        // 格式化输出，确保对齐
        console.log(
          `${teamColor} | ${playerName.padEnd(11)} | ${championName.padEnd(11)} | ${kda.padEnd(8)} | ${damage.padEnd(6)} | ${String(cs).padStart(4)} | ${gold.padEnd(6)} | ${itemsStr}`
        );
      }

      // 再显示红队玩家
      const redTeamMembers = allParticipants.filter(
        (p: any) => p.teamId === 200
      );
      for (const participant of redTeamMembers) {
        // 找到对应的玩家信息
        let playerName = '未知玩家';
        if (matchDetail.participantIdentities) {
          for (const identity of matchDetail.participantIdentities) {
            if (identity.participantId === participant.participantId) {
              // 优先使用 gameName + tagLine，然后是 summonerName
              if (identity.player?.gameName && identity.player?.tagLine) {
                playerName = `${identity.player.gameName}#${identity.player.tagLine}`;
              } else if (identity.player?.summonerName) {
                playerName = identity.player.summonerName;
              } else if (identity.player?.displayName) {
                playerName = identity.player.displayName;
              }
              break;
            }
          }
        }

        const teamColor = '🔴红';
        const championName =
          championNames.get(String(participant.championId)) ||
          `英雄${participant.championId}`;
        const kda = `${participant.stats?.kills || 0}/${participant.stats?.deaths || 0}/${participant.stats?.assists || 0}`;
        const damage = formatNumber(
          participant.stats?.totalDamageDealtToChampions || 0
        );
        const cs =
          (participant.stats?.totalMinionsKilled || 0) +
          (participant.stats?.neutralMinionsKilled || 0);
        const gold = formatNumber(participant.stats?.goldEarned || 0);

        // 获取装备信息
        const items = [
          participant.stats?.item0,
          participant.stats?.item1,
          participant.stats?.item2,
          participant.stats?.item3,
          participant.stats?.item4,
          participant.stats?.item5,
          participant.stats?.item6,
        ].filter(item => item && item !== 0);

        const itemsStr =
          items.length > 0
            ? items
                .map(item => itemNames.get(String(item)) || `装备${item}`)
                .join(',')
            : '无';

        // 格式化输出，确保对齐
        console.log(
          `${teamColor} | ${playerName.padEnd(11)} | ${championName.padEnd(11)} | ${kda.padEnd(8)} | ${damage.padEnd(6)} | ${String(cs).padStart(4)} | ${gold.padEnd(6)} | ${itemsStr}`
        );
      }
    }

    // 显示队伍统计
    console.log('\n🏆 ==================== 队伍统计 ====================');
    if (matchDetail.teams) {
      for (const team of matchDetail.teams) {
        const teamColor = team.teamId === 200 ? '🔴红方' : '🔵蓝方';
        const result = team.win === 'Win' ? '胜利' : '败北';

        console.log(`${teamColor} (${result}):`);
        console.log(
          `  🐉 小龙: ${team.dragonKills || 0} | 🦅 大龙: ${team.baronKills || 0} | 🏰 防御塔: ${team.towerKills || 0} | 🚫 水晶: ${team.inhibitorKills || 0}`
        );

        if (team.bans && team.bans.length > 0) {
          console.log('  🚫 禁用英雄:');
          for (const ban of team.bans) {
            if (ban.championId && ban.championId !== -1) {
              const bannedChampionName =
                championNames.get(String(ban.championId)) ||
                `英雄${ban.championId}`;
              console.log(
                `    - ${bannedChampionName} (ID: ${ban.championId})`
              );
            }
          }
        }
      }
    }
  }

  console.log('\n=========================================================');
}
