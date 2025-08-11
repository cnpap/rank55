import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { SummonerService } from '../service/summoner-service';
import { LCUClientInterface } from '../client/interface';
import { testDataLoader } from '../data-loader';
import {
  formatGameDuration,
  formatNumber,
  getQueueName,
} from '../rank-helpers';

describe('MatchHistory', () => {
  let lcuClient: LCUClientInterface;
  let summonerService: SummonerService;

  // 测试获取战绩（真实LOL）
  describe('GetMatchHistory - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取战绩历史', async () => {
      // 先获取当前召唤师信息
      const summoner = await summonerService.getCurrentSummoner();
      if (!summoner) {
        console.log('⏭️ 无法获取召唤师信息');
        return;
      }

      const displayName = summoner.displayName || summoner.gameName || '';
      console.log(`👤 当前召唤师: ${displayName} (PUUID: ${summoner.puuid})`);

      // 使用PUUID获取最近20场比赛记录
      const matchHistory = await summonerService.getMatchHistory(
        summoner.puuid,
        0,
        19
      );

      // 验证数据结构
      expect(matchHistory).toBeDefined();
      expect(matchHistory).not.toBeNull();

      console.log('🎮 战绩统计:');
      if (matchHistory.games) {
        console.log(`   - 总游戏数: ${matchHistory.games.gameCount}`);
        console.log(
          `   - 返回游戏数: ${matchHistory.games.games?.length || 0}`
        );
        console.log(`   - 开始日期: ${matchHistory.games.gameBeginDate}`);
        console.log(`   - 结束日期: ${matchHistory.games.gameEndDate}`);

        if (
          !matchHistory.games.games ||
          matchHistory.games.games.length === 0
        ) {
          console.log('ℹ️ 当前召唤师没有游戏记录');
        } else {
          // 显示详细的中文战绩表格
          await printMatchHistoryTable(matchHistory, summoner);
        }
      }

      console.log('✅ 战绩查询测试通过');
    });
  });
});

// 打印中文战绩表格
async function printMatchHistoryTable(
  matchHistory: any,
  summoner: any
): Promise<void> {
  console.log('\n📊 ==================== 详细战绩表格 ====================');
  console.log(
    '序号 | 结果   | 英雄名称     | KDA      | 补刀 | 金币   | 伤害     | 时长   | 队列类型'
  );
  console.log(
    '-----|--------|-------------|----------|------|--------|----------|--------|----------'
  );

  // 收集所有英雄ID，批量获取名称
  const allChampionIds = new Set<number>();
  for (const game of matchHistory.games.games) {
    if (game.participants) {
      for (const participant of game.participants) {
        allChampionIds.add(participant.championId);
      }
    }

    // 收集禁用英雄ID
    if (game.teams) {
      for (const team of game.teams) {
        if (team.bans) {
          for (const ban of team.bans) {
            if (ban.championId && ban.championId !== -1) {
              allChampionIds.add(ban.championId);
            }
          }
        }
      }
    }
  }

  // 批量获取英雄名称
  const championNames = await testDataLoader.getChampionNames(
    Array.from(allChampionIds)
  );

  for (let i = 0; i < matchHistory.games.games.length; i++) {
    const game = matchHistory.games.games[i];

    // 通过summonerId找到当前玩家的参与者ID
    let currentParticipantID = 0;
    if (game.participantIdentities) {
      for (const identity of game.participantIdentities) {
        if (identity.player?.summonerId === summoner.accountId) {
          currentParticipantID = identity.participantId;
          break;
        }
      }
    }

    // 找到对应的参与者数据
    let currentPlayer: any = null;
    if (game.participants) {
      for (const participant of game.participants) {
        if (participant.participantId === currentParticipantID) {
          currentPlayer = participant;
          break;
        }
      }
    }

    if (!currentPlayer) {
      console.log(
        `${String(i + 1).padStart(2)} | 未知   | 未知        | 数据缺失 | 未知 | 未知   | 未知     | ${formatGameDuration(game.gameDuration)} | ${getQueueName(game.queueId)}`
      );
      continue;
    }

    // 格式化数据
    const result = currentPlayer.stats?.win ? '✅胜利' : '❌败北';
    const championName =
      championNames.get(String(currentPlayer.championId)) ||
      `英雄${currentPlayer.championId}`;
    const kda = `${currentPlayer.stats?.kills || 0}/${currentPlayer.stats?.deaths || 0}/${currentPlayer.stats?.assists || 0}`;
    const cs =
      (currentPlayer.stats?.totalMinionsKilled || 0) +
      (currentPlayer.stats?.neutralMinionsKilled || 0);
    const gold = formatNumber(currentPlayer.stats?.goldEarned || 0);
    const damage = formatNumber(
      currentPlayer.stats?.totalDamageDealtToChampions || 0
    );
    const duration = formatGameDuration(game.gameDuration);
    const queueName = getQueueName(game.queueId);

    console.log(
      `${String(i + 1).padStart(2)} | ${result} | ${championName.padEnd(11)} | ${kda.padEnd(8)} | ${String(cs).padStart(4)} | ${gold.padEnd(6)} | ${damage.padEnd(8)} | ${duration} | ${queueName}`
    );

    // 显示该局比赛的详细信息
    await printMatchDetails(game, summoner, championNames, i + 1);
  }

  console.log('=========================================================');

  // 显示统计信息
  await printMatchStatistics(matchHistory, summoner, championNames);
}

// 打印单局比赛的详细信息
async function printMatchDetails(
  game: any,
  summoner: any,
  championNames: Map<string, string>,
  gameIndex: number
): Promise<void> {
  console.log(`\n   🔍 第${gameIndex}局详细信息:`);

  // 找到当前玩家的参与者ID
  let currentParticipantID = 0;
  if (game.participantIdentities) {
    for (const identity of game.participantIdentities) {
      if (identity.player?.summonerId === summoner.accountId) {
        currentParticipantID = identity.participantId;
        break;
      }
    }
  }

  // 找到当前玩家的数据
  let currentPlayer: any = null;
  if (game.participants) {
    for (const participant of game.participants) {
      if (participant.participantId === currentParticipantID) {
        currentPlayer = participant;
        break;
      }
    }
  }

  if (currentPlayer) {
    const championName =
      championNames.get(String(currentPlayer.championId)) ||
      `英雄${currentPlayer.championId}`;
    const kda = `${currentPlayer.stats?.kills || 0}/${currentPlayer.stats?.deaths || 0}/${currentPlayer.stats?.assists || 0}`;
    const damage = formatNumber(
      currentPlayer.stats?.totalDamageDealtToChampions || 0
    );
    const cs =
      (currentPlayer.stats?.totalMinionsKilled || 0) +
      (currentPlayer.stats?.neutralMinionsKilled || 0);
    const gold = formatNumber(currentPlayer.stats?.goldEarned || 0);
    const teamColor = currentPlayer.teamId === 200 ? '🔴红方' : '🔵蓝方';
    const result = currentPlayer.stats?.win ? '✅胜利' : '❌败北';

    console.log(`   👤 你的表现: ${teamColor} ${result}`);
    console.log(`   🦸 英雄: ${championName}`);
    console.log(`   ⚔️ KDA: ${kda}`);
    console.log(`   💥 伤害: ${damage}`);
    console.log(`   💰 补刀: ${cs}`);
    console.log(`   🏆 金币: ${gold}`);
  }

  // 显示Ban/Pick信息
  if (game.teams) {
    console.log('\n   🚫 Ban/Pick 信息:');
    for (const team of game.teams) {
      const teamColor = team.teamId === 200 ? '🔴红方' : '🔵蓝方';
      const result = team.win === 'Win' ? '胜利' : '败北';

      console.log(`   ${teamColor} (${result}):`);

      if (team.bans && team.bans.length > 0) {
        let banStr = '   禁用: ';
        for (const ban of team.bans) {
          if (ban.championId && ban.championId !== -1) {
            const bannedChampionName =
              championNames.get(String(ban.championId)) ||
              `英雄${ban.championId}`;
            banStr += `${bannedChampionName}, `;
          }
        }
        console.log(banStr.slice(0, -2)); // 移除最后的逗号和空格
      }
    }
  }
}

// 打印战绩统计信息
async function printMatchStatistics(
  matchHistory: any,
  summoner: any,
  championNames: Map<string, string>
): Promise<void> {
  let wins = 0,
    losses = 0;
  let totalKills = 0,
    totalDeaths = 0,
    totalAssists = 0;
  let totalCS = 0,
    totalGold = 0,
    totalDamage = 0;
  const championStats = new Map<
    string,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
    }
  >();

  for (const game of matchHistory.games.games) {
    // 找到当前玩家
    let currentParticipantID = 0;
    if (game.participantIdentities) {
      for (const identity of game.participantIdentities) {
        if (identity.player?.summonerId === summoner.accountId) {
          currentParticipantID = identity.participantId;
          break;
        }
      }
    }

    if (game.participants) {
      for (const participant of game.participants) {
        if (participant.participantId === currentParticipantID) {
          const isWin = participant.stats?.win;
          const championId = String(participant.championId);
          const championName =
            championNames.get(championId) || `英雄${championId}`;

          if (isWin) {
            wins++;
          } else {
            losses++;
          }

          const kills = participant.stats?.kills || 0;
          const deaths = participant.stats?.deaths || 0;
          const assists = participant.stats?.assists || 0;

          totalKills += kills;
          totalDeaths += deaths;
          totalAssists += assists;
          totalCS +=
            (participant.stats?.totalMinionsKilled || 0) +
            (participant.stats?.neutralMinionsKilled || 0);
          totalGold += participant.stats?.goldEarned || 0;
          totalDamage += participant.stats?.totalDamageDealtToChampions || 0;

          // 统计英雄数据
          if (!championStats.has(championName)) {
            championStats.set(championName, {
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
            });
          }
          const stats = championStats.get(championName)!;
          stats.games++;
          if (isWin) stats.wins++;
          stats.kills += kills;
          stats.deaths += deaths;
          stats.assists += assists;

          break;
        }
      }
    }
  }

  const totalGames = wins + losses;
  if (totalGames > 0) {
    console.log('\n📈 战绩统计汇总:');
    console.log(
      `   🎯 总场次: ${totalGames}场 (胜利: ${wins}, 失败: ${losses})`
    );
    console.log(`   📊 胜率: ${((wins / totalGames) * 100).toFixed(1)}%`);
    console.log(
      `   ⚔️ 平均KDA: ${(totalKills / totalGames).toFixed(1)}/${(totalDeaths / totalGames).toFixed(1)}/${(totalAssists / totalGames).toFixed(1)} (${((totalKills + totalAssists) / Math.max(totalDeaths, 1)).toFixed(2)})`
    );
    console.log(`   💰 平均补刀: ${(totalCS / totalGames).toFixed(1)}`);
    console.log(
      `   🏆 平均金币: ${formatNumber(Math.floor(totalGold / totalGames))}`
    );
    console.log(
      `   💥 平均伤害: ${formatNumber(Math.floor(totalDamage / totalGames))}`
    );

    // 显示英雄使用统计
    if (championStats.size > 0) {
      console.log('\n🦸 英雄使用统计 (按场次排序):');
      const sortedChampions = Array.from(championStats.entries())
        .sort((a, b) => b[1].games - a[1].games)
        .slice(0, 10); // 只显示前10个最常用的英雄

      console.log('英雄名称     | 场次 | 胜率   | 平均KDA');
      console.log('-------------|------|--------|----------');

      for (const [championName, stats] of sortedChampions) {
        const winRate = ((stats.wins / stats.games) * 100).toFixed(1);
        const avgKDA = (
          (stats.kills + stats.assists) /
          Math.max(stats.deaths, 1)
        ).toFixed(2);
        const avgKills = (stats.kills / stats.games).toFixed(1);
        const avgDeaths = (stats.deaths / stats.games).toFixed(1);
        const avgAssists = (stats.assists / stats.games).toFixed(1);

        console.log(
          `${championName.padEnd(11)} | ${String(stats.games).padStart(4)} | ${winRate.padStart(5)}% | ${avgKills}/${avgDeaths}/${avgAssists} (${avgKDA})`
        );
      }
    }
  }
}
