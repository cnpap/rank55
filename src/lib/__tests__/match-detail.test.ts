import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { SummonerService } from '../service/summoner-service';
import { LCUClientInterface } from '../client/interface';
import { testDataLoader } from '../data-loader';
import {
  formatGameDuration,
  formatNumber,
  getMapName,
  getQueueName,
} from '../rank-helpers';

describe('MatchDetail', () => {
  let lcuClient: LCUClientInterface;
  let summonerService: SummonerService;

  // 测试获取单局详细数据（真实LOL）
  describe('GetMatchDetail - Real LOL', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取单局详细数据', async () => {
      // 先获取当前召唤师信息
      const summoner = await summonerService.getCurrentSummoner();
      if (!summoner) {
        console.log('⏭️ 无法获取召唤师信息');
        return;
      }

      const displayName = summoner.displayName || summoner.gameName || '';
      console.log(`👤 当前召唤师: ${displayName} (PUUID: ${summoner.puuid})`);

      // 获取最近1场比赛记录
      const matchHistory = await summonerService.getMatchHistory(
        summoner.puuid,
        0,
        0
      );

      if (
        !matchHistory?.games?.games ||
        matchHistory.games.games.length === 0
      ) {
        console.log('⏭️ 当前召唤师没有游戏记录');
        return;
      }

      // 获取最近一局的GameID
      const latestGame = matchHistory.games.games[0];
      const gameID = latestGame.gameId;

      console.log(`🎮 获取最近一局详细数据 (GameID: ${gameID})`);

      // 获取单局详细数据
      const matchDetail = await summonerService.getMatchDetail(gameID);

      // 验证数据结构
      expect(matchDetail).toBeDefined();
      expect(matchDetail).not.toBeNull();

      // 显示详细的对战信息
      await printMatchDetailInfo(matchDetail, summoner, summonerService);

      console.log('✅ 单局详细数据查询测试通过');
    });
  });
});

// 打印单局详细对战信息
async function printMatchDetailInfo(
  matchDetail: any,
  summoner: any,
  summonerService: SummonerService
): Promise<void> {
  console.log(
    '\n🏆 ==================== 单局详细对战信息 ===================='
  );
  console.log(`🎮 游戏ID: ${matchDetail.gameId}`);
  console.log(`⏱️ 游戏时长: ${formatGameDuration(matchDetail.gameDuration)}`);
  console.log(`🗺️ 地图: ${getMapName(matchDetail.mapId)}`);
  console.log(`🎯 队列类型: ${getQueueName(matchDetail.queueId)}`);

  if (matchDetail.gameCreationDate) {
    const date = new Date(matchDetail.gameCreationDate);
    console.log(`📅 游戏时间: ${date.toLocaleString('zh-CN')}`);
  }

  // 找到当前玩家
  let currentParticipantID = 0;
  if (matchDetail.participantIdentities) {
    for (const identity of matchDetail.participantIdentities) {
      if (identity.player?.summonerId === summoner.accountId) {
        currentParticipantID = identity.participantId;
        break;
      }
    }
  }

  let currentPlayer: any = null;
  if (matchDetail.participants) {
    for (const participant of matchDetail.participants) {
      if (participant.participantId === currentParticipantID) {
        currentPlayer = participant;
        break;
      }
    }
  }

  if (currentPlayer) {
    console.log('\n👤 ==================== 个人数据 ====================');
    const result = currentPlayer.stats?.win ? '✅胜利' : '❌败北';
    console.log(`🏆 比赛结果: ${result}`);

    // 获取英雄名称
    const championName = await testDataLoader.getChampionName(
      currentPlayer.championId
    );
    console.log(
      `🦸 使用英雄: ${championName} (ID: ${currentPlayer.championId}, 等级 ${currentPlayer.stats?.champLevel || 0})`
    );

    const kills = currentPlayer.stats?.kills || 0;
    const deaths = currentPlayer.stats?.deaths || 0;
    const assists = currentPlayer.stats?.assists || 0;
    const kda = (kills + assists) / Math.max(deaths, 1);

    console.log(`⚔️ KDA: ${kills}/${deaths}/${assists} (${kda.toFixed(2)})`);
    console.log(
      `💰 金币: ${formatNumber(currentPlayer.stats?.goldEarned || 0)} (花费: ${formatNumber(currentPlayer.stats?.goldSpent || 0)})`
    );
    console.log(
      `🗡️ 补刀: ${currentPlayer.stats?.totalMinionsKilled || 0} (野怪: ${currentPlayer.stats?.neutralMinionsKilled || 0})`
    );
    console.log(
      `💥 伤害: ${formatNumber(currentPlayer.stats?.totalDamageDealt || 0)} (对英雄: ${formatNumber(currentPlayer.stats?.totalDamageDealtToChampions || 0)})`
    );
    console.log(
      `🛡️ 承受伤害: ${formatNumber(currentPlayer.stats?.totalDamageTaken || 0)} (减伤: ${formatNumber(currentPlayer.stats?.damageSelfMitigated || 0)})`
    );
    console.log(
      `👁️ 视野得分: ${currentPlayer.stats?.visionScore || 0} (插眼: ${currentPlayer.stats?.wardsPlaced || 0}, 排眼: ${currentPlayer.stats?.wardsKilled || 0})`
    );

    // 显示装备信息（包含中文名称）
    const items = [
      currentPlayer.stats?.item0,
      currentPlayer.stats?.item1,
      currentPlayer.stats?.item2,
      currentPlayer.stats?.item3,
      currentPlayer.stats?.item4,
      currentPlayer.stats?.item5,
      currentPlayer.stats?.item6,
    ].filter(item => item && item !== 0);

    if (items.length > 0) {
      console.log('🎒 装备:');
      const itemNames = await testDataLoader.getItemNames(items);
      for (const itemId of items) {
        const itemName = itemNames.get(String(itemId)) || `装备${itemId}`;
        console.log(`   - ${itemName} (ID: ${itemId})`);
      }
    } else {
      console.log('🎒 装备: 无');
    }

    // 显示多杀
    const stats = currentPlayer.stats;
    if (stats?.pentaKills > 0) {
      console.log(`🔥 五杀: ${stats.pentaKills}次`);
    } else if (stats?.quadraKills > 0) {
      console.log(`🔥 四杀: ${stats.quadraKills}次`);
    } else if (stats?.tripleKills > 0) {
      console.log(`🔥 三杀: ${stats.tripleKills}次`);
    } else if (stats?.doubleKills > 0) {
      console.log(`🔥 双杀: ${stats.doubleKills}次`);
    }
  }

  // 收集所有英雄ID和装备ID，批量获取名称
  const allChampionIds = new Set<number>();
  const allItemIds = new Set<number>();

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

  // 批量获取名称
  const championNames = await testDataLoader.getChampionNames(
    Array.from(allChampionIds)
  );

  // 批量获取所有玩家的段位信息
  const playerRanks = new Map<string, [string, string, number]>();
  console.log('\n🔍 正在获取所有玩家段位信息...');

  if (matchDetail.participantIdentities) {
    for (const identity of matchDetail.participantIdentities) {
      if (identity.player?.puuid) {
        try {
          const rankInfo = await summonerService.getPlayerRankedInfo(
            identity.player.puuid
          );
          playerRanks.set(identity.player.puuid, rankInfo);
        } catch (error) {
          console.log(
            `⚠️ 获取玩家 ${identity.player.summonerName || identity.player.gameName} 段位失败: ${error}`
          );
          playerRanks.set(identity.player.puuid, ['获取失败', '', 0]);
        }
      }
    }
  }

  // 显示所有玩家信息
  console.log('\n👥 ==================== 所有玩家数据 ====================');
  console.log(
    '队伍 | 玩家名称     | 段位         | 英雄名称     | KDA      | 伤害   | 补刀 | 金币   '
  );
  console.log(
    '-----|-------------|-------------|-------------|----------|--------|------|--------'
  );

  if (matchDetail.participants) {
    for (const participant of matchDetail.participants) {
      // 找到对应的玩家信息
      let playerName = '未知玩家';
      let playerPuuid = '';
      if (matchDetail.participantIdentities) {
        for (const identity of matchDetail.participantIdentities) {
          if (identity.participantId === participant.participantId) {
            playerPuuid = identity.player?.puuid || '';
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

      const teamColor = participant.teamId === 200 ? '🔴红' : '🔵蓝';
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

      // 获取段位信息
      const rankInfo = playerRanks.get(playerPuuid) || '未知段位';

      // 格式化输出，确保对齐
      console.log(
        `${teamColor} | ${playerName.padEnd(11)} | ${rankInfo[0].padEnd(11)} | ${rankInfo[1].padEnd(11)} | ${championName.padEnd(11)} | ${kda.padEnd(8)} | ${damage.padEnd(6)} | ${String(cs).padStart(4)} | ${gold.padEnd(6)}`
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
            console.log(`    - ${bannedChampionName} (ID: ${ban.championId})`);
          }
        }
      }
    }
  }

  console.log('=========================================================');
}
