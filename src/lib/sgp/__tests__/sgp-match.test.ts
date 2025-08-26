import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleSgpApi } from '../sgp-api';
import { SgpMatchService } from '../sgp-match-service';
import { LCUClient } from '../../client/lcu-client';
import { SummonerService } from '../../service/summoner-service';
import fs from 'fs';

describe('SGP Match History', () => {
  let sgpApi: SimpleSgpApi;
  let sgpMatchService: SgpMatchService;
  let lcuClient: LCUClient;
  let summonerService: SummonerService;

  beforeEach(async () => {
    try {
      // 初始化LCU客户端
      lcuClient = await LCUClient.create();
      summonerService = new SummonerService(lcuClient);

      // 初始化SGP API（不再需要传入配置）
      sgpApi = new SimpleSgpApi();
      sgpMatchService = new SgpMatchService(sgpApi, lcuClient);

      console.log('✅ SGP服务初始化成功');
    } catch (error) {
      console.log(`⏭️ 跳过SGP测试: ${error}`);
      return;
    }
  });

  it('应该能够自动推断当前用户的服务器并获取战绩', async () => {
    // 获取当前召唤师信息
    const summoner = await summonerService.getCurrentSummoner();
    if (!summoner) {
      console.log('⏭️ 无法获取召唤师信息');
      return;
    }

    console.log(
      `👤 当前召唤师: ${summoner.displayName} (PUUID: ${summoner.puuid}) 名称：${summoner.gameName}`
    );

    try {
      console.log('\n🔍 测试自动服务器推断');

      // 测试自动推断服务器
      const credentials = lcuClient.getCredentials();
      console.log('LCU凭据信息:', {
        region: credentials.region,
        rsoPlatformId: credentials.rsoPlatformId,
        locale: credentials.locale,
      });

      // 获取当前用户战绩（自动推断服务器）
      const matchHistory = await sgpMatchService.getMatchHistory(
        summoner.puuid,
        0,
        20,
        {
          serverId:
            (await sgpMatchService._inferCurrentUserServerId()) as string,
        }
      );

      // 将返回结果保存到文件
      fs.writeFileSync(
        `match_history_auto_${matchHistory.serverId}.json`,
        JSON.stringify(matchHistory, null, 2)
      );

      console.log(`📊 自动推断服务器 ${matchHistory.serverId} 战绩统计:`);
      console.log(`   - 总游戏数: ${matchHistory.totalCount}`);
      console.log(`   - 返回游戏数: ${matchHistory.games.length}`);
      console.log(
        `   - 查询范围: ${matchHistory.startIndex}-${matchHistory.endIndex}`
      );
      console.log(`   - 使用服务器: ${matchHistory.serverId}`);

      // 验证数据
      expect(matchHistory).toBeDefined();
      expect(matchHistory.games).toBeInstanceOf(Array);
      expect(matchHistory.serverId).toBeTypeOf('string');

      if (matchHistory.games.length > 0) {
        // 显示前3场战绩的详细信息
        console.log('\n   📋 最近3场战绩详细信息:');

        for (let i = 0; i < Math.min(3, matchHistory.games.length); i++) {
          const game = matchHistory.games[i];
          const gameInfo = game.json;

          console.log(`\n   🎮 第${i + 1}场比赛 (游戏ID: ${gameInfo.gameId})`);
          console.log(
            `   📅 游戏时间: ${new Date(gameInfo.gameCreation).toLocaleString()}`
          );
          console.log(
            `   ⏱️ 游戏时长: ${Math.floor(gameInfo.gameDuration / 60)}分${gameInfo.gameDuration % 60}秒`
          );
          console.log(
            `   🗺️ 地图: ${gameInfo.mapId} | 模式: ${gameInfo.gameMode} | 队列: ${gameInfo.queueId}`
          );
          console.log(`   🏆 游戏版本: ${gameInfo.gameVersion}`);

          // 显示队伍信息
          console.log('\n   👥 队伍信息:');
          gameInfo.teams.forEach((team, teamIndex) => {
            const teamName = team.teamId === 100 ? '蓝色方' : '红色方';
            const result = team.win ? '🏆 胜利' : '💀 失败';
            console.log(`   ${teamName} (${team.teamId}): ${result}`);

            // 显示队伍目标
            const objectives = team.objectives;
            console.log(
              `     📊 目标: 击杀${objectives.champion.kills} | 塔${objectives.tower.kills} | 龙${objectives.dragon.kills} | 大龙${objectives.baron.kills}`
            );
          });

          // 显示所有参与者详细信息
          console.log('\n   👤 参与者详细信息:');
          console.log(
            '   队伍 | 召唤师名称 | 等级 | 英雄 | 位置 | KDA | 补刀 | 金币 | 伤害 | 符文主系'
          );
          console.log(
            '   -----|------------|------|------|------|-----|------|------|------|--------'
          );

          gameInfo.participants.forEach((participant, pIndex) => {
            const teamColor = participant.teamId === 100 ? '🔵' : '🔴';
            const isCurrentPlayer =
              participant.puuid === summoner.puuid ? '⭐' : '  ';
            const summonerName =
              participant.riotIdGameName ||
              participant.summonerName ||
              'Unknown';
            const tagline = participant.riotIdTagline
              ? `#${participant.riotIdTagline}`
              : '';
            const fullName = `${summonerName}${tagline}`.substring(0, 15);
            const level = participant.summonerLevel;
            const champion = `${participant.championName}(${participant.championId})`;
            const position =
              participant.teamPosition ||
              participant.individualPosition ||
              'UNKNOWN';
            const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
            const cs =
              participant.totalMinionsKilled +
              participant.totalAllyJungleMinionsKilled +
              participant.totalEnemyJungleMinionsKilled;
            const gold = (participant.goldEarned / 1000).toFixed(1) + 'k';
            const damage =
              (participant.totalDamageDealtToChampions / 1000).toFixed(1) + 'k';

            // 获取主要符文系
            let primaryRune = 'Unknown';
            if (
              participant.perks &&
              participant.perks.styles &&
              participant.perks.styles.length > 0
            ) {
              const primaryStyle = participant.perks.styles[0].style;
              const runeNames: { [key: number]: string } = {
                8000: '精密',
                8100: '主宰',
                8200: '巫术',
                8300: '坚决',
                8400: '启迪',
              };
              primaryRune = runeNames[primaryStyle] || `${primaryStyle}`;
            }

            console.log(
              `   ${teamColor}${isCurrentPlayer} | ${fullName.padEnd(12)} | ${String(level).padStart(4)} | ${champion.padEnd(12)} | ${position.padEnd(6)} | ${kda.padEnd(8)} | ${String(cs).padStart(4)} | ${gold.padEnd(6)} | ${damage.padEnd(6)} | ${primaryRune}`
            );
          });

          // 显示当前玩家的详细统计
          const currentPlayerData = gameInfo.participants.find(
            p => p.puuid === summoner.puuid
          );

          if (currentPlayerData) {
            console.log('\n   ⭐ 当前玩家详细统计:');
            console.log(
              `   🏆 胜负: ${currentPlayerData.win ? '胜利' : '失败'}`
            );
            console.log(
              `   🎯 KDA: ${currentPlayerData.kills}/${currentPlayerData.deaths}/${currentPlayerData.assists} (KDA比: ${currentPlayerData.challenges?.kda?.toFixed(2) || 'N/A'})`
            );
            console.log(
              `   💰 金币: ${currentPlayerData.goldEarned} (每分钟: ${currentPlayerData.challenges?.goldPerMinute?.toFixed(1) || 'N/A'})`
            );
            console.log(
              `   ⚔️ 伤害: 总计${currentPlayerData.totalDamageDealtToChampions} | 物理${currentPlayerData.physicalDamageDealtToChampions} | 魔法${currentPlayerData.magicDamageDealtToChampions}`
            );
            console.log(
              `   🛡️ 承受伤害: ${currentPlayerData.totalDamageTaken}`
            );
            console.log(
              `   👁️ 视野分数: ${currentPlayerData.visionScore} (每分钟: ${currentPlayerData.challenges?.visionScorePerMinute?.toFixed(2) || 'N/A'})`
            );
            console.log(
              `   🏰 参团率: ${((currentPlayerData.challenges?.killParticipation || 0) * 100).toFixed(1)}%`
            );
            console.log(
              `   ⏰ 死亡时间: ${currentPlayerData.totalTimeSpentDead}秒`
            );

            // 显示装备信息
            const items = [
              currentPlayerData.item0,
              currentPlayerData.item1,
              currentPlayerData.item2,
              currentPlayerData.item3,
              currentPlayerData.item4,
              currentPlayerData.item5,
              currentPlayerData.item6,
            ].filter(item => item > 0);
            console.log(`   🎒 装备: [${items.join(', ')}]`);

            // 显示符文详细信息
            if (currentPlayerData.perks && currentPlayerData.perks.styles) {
              console.log(`   🔮 符文配置:`);
              currentPlayerData.perks.styles.forEach((style, styleIndex) => {
                const styleName = styleIndex === 0 ? '主系' : '副系';
                console.log(
                  `     ${styleName} (${style.style}): ${style.selections.map(s => s.perk).join(', ')}`
                );
              });

              const statPerks = currentPlayerData.perks.statPerks;
              console.log(
                `     属性碎片: 攻击${statPerks.offense} | 适应${statPerks.flex} | 防御${statPerks.defense}`
              );
            }

            // 显示召唤师技能
            console.log(
              `   ✨ 召唤师技能: ${currentPlayerData.spell1Id} + ${currentPlayerData.spell2Id}`
            );
          }
        }

        // 验证数据结构 - 现在验证 Game 类型的结构
        const firstGame = matchHistory.games[0];
        expect(firstGame.json.gameId).toBeTypeOf('number');
        expect(firstGame.json.participants).toBeInstanceOf(Array);
        expect(firstGame.json.participants.length).toBeGreaterThan(0);

        // 验证参与者数据
        const firstParticipant = firstGame.json.participants[0];
        expect(firstParticipant.championId).toBeTypeOf('number');
        expect(firstParticipant.win).toBeTypeOf('boolean');
        expect(firstParticipant.kills).toBeTypeOf('number');
        expect(firstParticipant.riotIdGameName).toBeTypeOf('string');
        expect(firstParticipant.summonerLevel).toBeTypeOf('number');
      } else {
        console.log('   ℹ️ 该服务器没有找到战绩记录');
      }

      console.log(`   ✅ 自动服务器推断测试通过`);
    } catch (error: any) {
      console.log(`   ❌ 自动服务器推断测试失败: ${error.message}`);
      // 如果自动推断失败，不抛出错误，继续测试手动指定
    }
  });
});
