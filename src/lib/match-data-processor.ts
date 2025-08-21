import type { Game } from '@/types/match-history-sgp';
import type { SummonerData } from '@/types/summoner';
import type {
  ProcessedMatch,
  MatchPlayer,
  MatchTeam,
} from '@/types/match-history-ui';
import { formatGameDuration, getQueueName } from '@/lib/rank-helpers';

/**
 * 战绩数据处理服务
 * 负责将原始游戏数据转换为UI所需的ProcessedMatch格式
 */
export class MatchDataProcessor {
  /**
   * 处理单个玩家的数据
   */
  private static processPlayer(
    participant: any,
    currentSummonerPuuid: string,
    championNames: Map<string, string>
  ): MatchPlayer {
    const kills = participant.kills;
    const deaths = participant.deaths;
    const assists = participant.assists;
    const kda = (kills + assists) / Math.max(deaths, 1);

    const cs =
      participant.totalMinionsKilled +
      participant.totalAllyJungleMinionsKilled +
      participant.totalEnemyJungleMinionsKilled;

    const items = [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
      participant.item6,
    ].filter(item => item && item !== 0) as number[];

    const championName =
      championNames.get(String(participant.championId)) ||
      participant.championName ||
      `英雄${participant.championId}`;

    const displayName =
      participant.riotIdGameName && participant.riotIdTagline
        ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
        : participant.summonerName || 'Unknown';

    return {
      puuid: participant.puuid,
      riotIdGameName: participant.riotIdGameName || '',
      riotIdTagline: participant.riotIdTagline || '',
      displayName,
      championId: participant.championId,
      championName,
      teamId: participant.teamId,
      teamPosition:
        participant.teamPosition || participant.individualPosition || 'UNKNOWN',
      isCurrentPlayer: participant.puuid === currentSummonerPuuid,
      kda: {
        kills,
        deaths,
        assists,
        ratio: kda,
      },
      stats: {
        level: participant.champLevel,
        cs,
        gold: participant.goldEarned,
        damage: participant.totalDamageDealtToChampions,
        damageTaken: participant.totalDamageTaken,
      },
      items,
      spells: [participant.spell1Id, participant.spell2Id],
      runes: [
        participant.perks?.styles?.[0]?.style || 0,
        participant.perks?.styles?.[1]?.style || 0,
      ],
    };
  }

  /**
   * 处理队伍数据
   */
  private static processTeams(
    gameInfo: any,
    allPlayers: MatchPlayer[]
  ): [MatchTeam, MatchTeam] {
    const blueTeam: MatchTeam = {
      teamId: 100,
      win: gameInfo.teams.find((t: any) => t.teamId === 100)?.win || false,
      players: allPlayers.filter(p => p.teamId === 100),
    };

    const redTeam: MatchTeam = {
      teamId: 200,
      win: gameInfo.teams.find((t: any) => t.teamId === 200)?.win || false,
      players: allPlayers.filter(p => p.teamId === 200),
    };

    return [blueTeam, redTeam];
  }

  /**
   * 将原始游戏数据转换为ProcessedMatch数组
   */
  static processMatchHistory(
    matchHistory: Game[],
    currentSummoner: SummonerData,
    championNames: Map<string, string>,
    expandedMatches: Set<number>
  ): ProcessedMatch[] {
    if (!matchHistory || !currentSummoner) {
      return [];
    }

    const processedMatches: ProcessedMatch[] = [];

    for (const game of matchHistory) {
      const gameInfo = game.json;

      // 找到当前玩家的参与者数据
      const currentPlayer = gameInfo.participants.find(
        (participant: any) => participant.puuid === currentSummoner.puuid
      );

      if (!currentPlayer) continue;

      // 处理当前玩家数据
      const kills = currentPlayer.kills;
      const deaths = currentPlayer.deaths;
      const assists = currentPlayer.assists;
      const kda = (kills + assists) / Math.max(deaths, 1);

      const cs =
        currentPlayer.totalMinionsKilled +
        currentPlayer.totalAllyJungleMinionsKilled +
        currentPlayer.totalEnemyJungleMinionsKilled;

      const items = [
        currentPlayer.item0,
        currentPlayer.item1,
        currentPlayer.item2,
        currentPlayer.item3,
        currentPlayer.item4,
        currentPlayer.item5,
        currentPlayer.item6,
      ].filter(item => item && item !== 0) as number[];

      const championName =
        championNames.get(String(currentPlayer.championId)) ||
        currentPlayer.championName ||
        `英雄${currentPlayer.championId}`;

      // 处理所有玩家信息
      const allPlayers: MatchPlayer[] = gameInfo.participants.map(
        (participant: any) =>
          this.processPlayer(participant, currentSummoner.puuid, championNames)
      );

      // 按队伍分组
      const [blueTeam, redTeam] = this.processTeams(gameInfo, allPlayers);

      processedMatches.push({
        gameId: gameInfo.gameId,
        championId: currentPlayer.championId,
        championName,
        result: currentPlayer.win ? 'victory' : 'defeat',
        queueType: getQueueName(gameInfo.queueId),
        queueId: gameInfo.queueId,
        duration: formatGameDuration(gameInfo.gameDuration),
        createdAt: gameInfo.gameCreation,
        kda: {
          kills,
          deaths,
          assists,
          ratio: kda,
        },
        stats: {
          cs,
          gold: currentPlayer.goldEarned,
          damage: currentPlayer.totalDamageDealtToChampions,
          damageTaken: currentPlayer.totalDamageTaken,
          level: currentPlayer.champLevel,
        },
        items,
        spells: [currentPlayer.spell1Id, currentPlayer.spell2Id],
        runes: [
          currentPlayer.perks?.styles?.[0]?.style || 0,
          currentPlayer.perks?.styles?.[1]?.style || 0,
        ],
        expanded: expandedMatches.has(gameInfo.gameId),
        teams: [blueTeam, redTeam],
        allPlayers,
      });
    }

    return processedMatches;
  }
}
