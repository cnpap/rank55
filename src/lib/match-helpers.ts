import type { Game, Participant, Team } from '@/types/match-history-sgp';
import type { SummonerData } from '@/types/summoner';
import { GAME_MODE_TAGS } from '@/types/match-history-ui';

/**
 * KDA 数据接口
 */
export interface KDAData {
  kills: number;
  deaths: number;
  assists: number;
  ratio: number;
}

/**
 * 玩家统计数据接口
 */
export interface PlayerStats {
  level: number;
  cs: number;
  gold: number;
  damage: number;
  damageTaken: number;
  items: number[];
}

/**
 * 处理后的玩家数据接口
 */
export interface ProcessedPlayer {
  participantId: number;
  playerName: string;
  playerPuuid: string;
  championId: number;
  championName: string;
  teamId: number;
  rankInfo: [string, string, number];
  kda: KDAData;
  spells: [number, number];
  runes: [number, number]; // [主要天赋系, 次要天赋系]
  stats: PlayerStats;
}

/**
 * 队伍统计数据接口
 */
export interface TeamStats {
  dragonKills: number;
  baronKills: number;
  towerKills: number;
  inhibitorKills: number;
}

/**
 * 禁用英雄数据接口
 */
export interface BanData {
  championId: number;
  championName: string;
}

/**
 * 处理后的队伍数据接口
 */
export interface ProcessedTeam {
  teamId: number;
  teamName: string;
  teamColor: string;
  win: boolean;
  players: ProcessedPlayer[];
  teamStats: TeamStats;
  bans: BanData[];
}

/**
 * 简要比赛数据接口（用于 BriefMatchHistory）
 */
export interface BriefMatchData {
  gameId: number;
  championId: number;
  result: 'victory' | 'defeat';
  queueType: string;
  duration: string;
  createdAt: string;
  kda: KDAData;
  spells: [number, number];
  runes: [number, number];
}

/**
 * 计算 KDA 比率
 * @param kills 击杀数
 * @param deaths 死亡数
 * @param assists 助攻数
 * @returns KDA 数据对象
 */
export function calculateKDA(
  kills: number,
  deaths: number,
  assists: number
): KDAData {
  const ratio = deaths > 0 ? (kills + assists) / deaths : kills + assists;

  return {
    kills,
    deaths,
    assists,
    ratio: Math.round(ratio * 100) / 100, // 保留两位小数
  };
}

/**
 * 收集玩家装备
 * @param participant SGP 参与者数据
 * @returns 装备ID数组（过滤掉空装备）
 */
export function collectPlayerItems(participant: Participant): number[] {
  const items = [
    participant?.item0,
    participant?.item1,
    participant?.item2,
    participant?.item3,
    participant?.item4,
    participant?.item5,
    participant?.item6,
  ].filter(item => item && item !== 0) as number[];

  return items;
}

/**
 * 计算补刀数（小兵 + 野怪）
 * @param participant SGP 参与者数据
 * @returns 总补刀数
 */
export function calculateCS(participant: Participant): number {
  const minionsKilled = participant?.totalMinionsKilled || 0;
  const neutralMinionsKilled = participant?.neutralMinionsKilled || 0;
  return minionsKilled + neutralMinionsKilled;
}

/**
 * 获取玩家天赋信息
 * @param participant SGP 参与者数据
 * @returns [主要天赋系, 次要天赋系]
 */
export function getPlayerRunes(participant: Participant): [number, number] {
  const styles = participant?.perks?.styles || [];
  const primaryStyle =
    styles.find(style => style.selections?.length > 0)?.style || 0;
  const subStyle =
    styles.find((style, index) => index > 0 && style.selections?.length > 0)
      ?.style || 0;
  return [primaryStyle, subStyle];
}

/**
 * 查找指定召唤师在比赛中的参与者数据
 * @param game SGP 比赛数据
 * @param summoner 召唤师数据
 * @returns 参与者数据，如果未找到则返回 null
 */
export function findPlayerInGame(
  game: Game,
  summoner: SummonerData
): Participant | null {
  // SGP 数据结构中，参与者信息直接在 game.json.participants 中
  if (game.json?.participants && summoner) {
    for (const participant of game.json.participants) {
      // SGP 使用 puuid 进行匹配
      if (participant.puuid === summoner.puuid) {
        return participant;
      }
    }
  }

  return null;
}

/**
 * 处理单场比赛的简要数据
 * @param game SGP 比赛数据
 * @param summoner 召唤师数据
 * @param formatGameDuration 游戏时长格式化函数
 * @returns 简要比赛数据，如果玩家不在比赛中则返回 null
 */
export function processBriefMatch(
  game: Game,
  summoner: SummonerData,
  formatGameDuration: (seconds: number) => string
): BriefMatchData | null {
  const currentPlayer = findPlayerInGame(game, summoner);

  if (!currentPlayer) {
    return null;
  }

  const kills = currentPlayer.kills || 0;
  const deaths = currentPlayer.deaths || 0;
  const assists = currentPlayer.assists || 0;
  const kda = calculateKDA(kills, deaths, assists);

  // 获取队列类型
  const queueId = game.json.queueId;
  const queueKey = `q_${queueId}` as keyof typeof GAME_MODE_TAGS;
  const queueType = GAME_MODE_TAGS[queueKey] || '未知模式';

  return {
    gameId: game.json.gameId,
    championId: currentPlayer.championId,
    result: currentPlayer.win ? 'victory' : 'defeat',
    queueType,
    duration: formatGameDuration(game.json.gameDuration),
    createdAt: game.json.gameCreation.toString(),
    kda,
    spells: [currentPlayer.spell1Id, currentPlayer.spell2Id],
    runes: getPlayerRunes(currentPlayer),
  };
}

/**
 * 处理玩家数据
 * @param participant SGP 参与者数据
 * @param championNames 英雄名称映射
 * @param playerRanks 玩家段位信息映射
 * @returns 处理后的玩家数据
 */
export function processPlayer(
  participant: Participant,
  championNames: Map<string, string>,
  playerRanks: Map<string, [string, string, number]>
): ProcessedPlayer {
  // SGP 数据中玩家信息直接在 participant 中
  const playerName =
    participant.riotIdGameName || participant.summonerName || '未知玩家';
  const playerPuuid = participant.puuid || '';

  // 计算 KDA
  const kills = participant.kills || 0;
  const deaths = participant.deaths || 0;
  const assists = participant.assists || 0;
  const kda = calculateKDA(kills, deaths, assists);

  // 收集装备
  const items = collectPlayerItems(participant);

  // 获取段位信息
  const rankInfo = playerRanks.get(playerPuuid) || ['获取中...', '', 0];

  return {
    participantId: participant.participantId,
    playerName,
    playerPuuid,
    championId: participant.championId,
    championName:
      championNames.get(String(participant.championId)) ||
      `英雄${participant.championId}`,
    teamId: participant.teamId,
    rankInfo,
    kda,
    spells: [participant.spell1Id, participant.spell2Id],
    runes: getPlayerRunes(participant),
    stats: {
      level: participant.champLevel || 0,
      cs: calculateCS(participant),
      gold: participant.goldEarned || 0,
      damage: participant.totalDamageDealtToChampions || 0,
      damageTaken: participant.totalDamageTaken || 0,
      items,
    },
  };
}

/**
 * 处理队伍禁用英雄
 * @param team SGP 队伍数据
 * @param championNames 英雄名称映射
 * @returns 禁用英雄数组
 */
export function processTeamBans(
  team: Team,
  championNames: Map<string, string>
): BanData[] {
  return (team.bans || [])
    .filter(ban => ban.championId && ban.championId !== -1)
    .map(ban => ({
      championId: ban.championId,
      championName:
        championNames.get(String(ban.championId)) || `英雄${ban.championId}`,
    }));
}

/**
 * 获取队伍统计数据
 * @param team SGP 队伍数据
 * @returns 队伍统计数据
 */
export function getTeamStats(team: Team): TeamStats {
  return {
    dragonKills: team.objectives?.dragon?.kills || 0,
    baronKills: team.objectives?.baron?.kills || 0,
    towerKills: team.objectives?.tower?.kills || 0,
    inhibitorKills: team.objectives?.inhibitor?.kills || 0,
  };
}

/**
 * 获取队伍显示信息
 * @param teamId 队伍ID
 * @returns 队伍名称和颜色
 */
export function getTeamDisplayInfo(teamId: number): {
  name: string;
  color: string;
} {
  return {
    name: teamId === 100 ? '蓝方' : '红方',
    color: teamId === 100 ? 'blue' : 'red',
  };
}

/**
 * 处理比赛详情数据，转换为前端展示格式
 * @param matchDetail SGP 比赛数据
 * @param championNames 英雄名称映射
 * @param playerRanks 玩家段位信息映射
 * @returns 处理后的队伍数据数组
 */
export function processMatchDetail(
  matchDetail: Game,
  championNames: Map<string, string>,
  playerRanks: Map<string, [string, string, number]>
): ProcessedTeam[] {
  const teams: ProcessedTeam[] = [];

  if (!matchDetail.json?.teams) {
    return teams;
  }

  for (const team of matchDetail.json.teams) {
    const teamPlayers: ProcessedPlayer[] = [];
    const { name: teamName, color: teamColor } = getTeamDisplayInfo(
      team.teamId
    );

    // 获取该队伍的所有玩家
    if (matchDetail.json.participants) {
      const teamParticipants = matchDetail.json.participants.filter(
        p => p.teamId === team.teamId
      );

      for (const participant of teamParticipants) {
        const processedPlayer = processPlayer(
          participant,
          championNames,
          playerRanks
        );

        teamPlayers.push(processedPlayer);
      }
    }

    // 处理禁用英雄
    const bans = processTeamBans(team, championNames);

    teams.push({
      teamId: team.teamId,
      teamName,
      teamColor,
      win: team.win,
      players: teamPlayers,
      teamStats: getTeamStats(team),
      bans,
    });
  }

  // 确保蓝方在前，红方在后
  return teams.sort((a, b) => a.teamId - b.teamId);
}

/**
 * 收集比赛中所有的英雄ID
 * @param matchDetail SGP 比赛数据
 * @returns 英雄ID集合
 */
export function collectAllChampionIds(matchDetail: Game): Set<number> {
  const allChampionIds = new Set<number>();

  // 收集参与者的英雄ID
  if (matchDetail.json?.participants) {
    for (const participant of matchDetail.json.participants) {
      allChampionIds.add(participant.championId);
    }
  }

  // 收集禁用英雄ID
  if (matchDetail.json?.teams) {
    for (const team of matchDetail.json.teams) {
      if (team.bans) {
        for (const ban of team.bans) {
          if (ban.championId && ban.championId !== -1) {
            allChampionIds.add(ban.championId);
          }
        }
      }
    }
  }

  return allChampionIds;
}

/**
 * 收集比赛中所有的装备ID
 * @param matchDetail SGP 比赛数据
 * @returns 装备ID集合
 */
export function collectAllItemIds(matchDetail: Game): Set<number> {
  const allItemIds = new Set<number>();

  if (matchDetail.json?.participants) {
    for (const participant of matchDetail.json.participants) {
      const items = collectPlayerItems(participant);
      items.forEach(item => allItemIds.add(item));
    }
  }

  return allItemIds;
}

/**
 * MVP分数数据接口
 */
export interface MVPScoreData {
  participant: Participant;
  kda: number;
  normalizedDamageDealt: number;
  normalizedDamageTaken: number;
  mvpScore: number;
}

/**
 * 计算KDA值（处理死亡为0的情况）
 * @param kills 击杀数
 * @param deaths 死亡数
 * @param assists 助攻数
 * @returns KDA值
 */
export function calculateKDAValue(
  kills: number,
  deaths: number,
  assists: number
): number {
  if (deaths === 0) {
    return (kills + assists) * 1.5; // 社区常见调整，避免无限高
  }
  return (kills + assists) / deaths;
}

/**
 * 计算综合MVP分数
 * @param game SGP 比赛数据
 * @returns 所有玩家的MVP分数数据数组
 */
export function calculateMVPScores(game: Game): MVPScoreData[] {
  const participants = game.json?.participants;
  if (!participants || participants.length === 0) return [];

  // 计算团队平均数据
  const totalDamageDealt = participants.reduce(
    (sum, p) => sum + (p.totalDamageDealtToChampions || 0),
    0
  );
  const totalDamageTaken = participants.reduce(
    (sum, p) => sum + (p.totalDamageTaken || 0),
    0
  );
  const totalGold = participants.reduce(
    (sum, p) => sum + (p.goldEarned || 0),
    0
  );
  const totalCS = participants.reduce(
    (sum, p) =>
      sum + ((p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0)),
    0
  );

  const avgDamageDealt = totalDamageDealt / participants.length;
  const avgDamageTaken = totalDamageTaken / participants.length;
  const avgGold = totalGold / participants.length;
  const avgCS = totalCS / participants.length;

  // 为每个玩家计算MVP分数
  const mvpScores: MVPScoreData[] = participants.map(participant => {
    const kills = participant.kills || 0;
    const deaths = participant.deaths || 0;
    const assists = participant.assists || 0;
    const damageDealt = participant.totalDamageDealtToChampions || 0;
    const damageTaken = participant.totalDamageTaken || 0;
    const gold = participant.goldEarned || 0;
    const cs =
      (participant.totalMinionsKilled || 0) +
      (participant.neutralMinionsKilled || 0);
    const killParticipation = participant.challenges?.killParticipation || 0;

    // 计算KDA（降低权重）
    const kda = calculateKDAValue(kills, deaths, assists);

    // 规范化各项数据
    const normalizedDamageDealt =
      avgDamageDealt > 0 ? damageDealt / avgDamageDealt : 0;
    const normalizedDamageTaken =
      avgDamageTaken > 0 ? damageTaken / avgDamageTaken : 0;
    const normalizedGold = avgGold > 0 ? gold / avgGold : 0;
    const normalizedCS = avgCS > 0 ? cs / avgCS : 0;

    // 计算MVP分数（重新平衡的公式）
    // 降低KDA权重，增加伤害输出、经济发育、参团率的重要性
    const mvpScore =
      0.25 * Math.min(kda, 8) + // KDA权重降低，并设置上限避免极端值
      0.35 * normalizedDamageDealt + // 纯伤害输出权重增加
      0.15 * normalizedGold + // 经济发育
      0.1 * normalizedCS + // 补刀发育
      0.1 * (killParticipation * 2) + // 参团率（0-1转换为0-2）
      0.05 * Math.min(normalizedDamageTaken, 2.0); // 承伤能力（坦克加分）

    return {
      participant,
      kda,
      normalizedDamageDealt,
      normalizedDamageTaken,
      mvpScore,
    };
  });

  return mvpScores;
}

/**
 * 计算比赛中的MVP玩家（基于综合分数）
 * @param game SGP 比赛数据
 * @returns MVP玩家数据，如果没有参与者则返回null
 */
export function findMVPPlayer(game: Game): Participant | null {
  const mvpScores = calculateMVPScores(game);
  if (mvpScores.length === 0) return null;

  // 找到分数最高的玩家
  const bestScore = mvpScores.reduce((best, current) => {
    return current.mvpScore > best.mvpScore ? current : best;
  });

  return bestScore.participant;
}

/**
 * 计算比赛中的MVP玩家（基于KDA最高，保留旧版本兼容性）
 * @param game SGP 比赛数据
 * @returns MVP玩家数据，如果没有参与者则返回null
 */
export function findMVPPlayerByKDA(game: Game): Participant | null {
  const participants = game.json?.participants;
  if (!participants || participants.length === 0) return null;

  let bestPlayer = participants[0];
  let bestKDA =
    (bestPlayer.kills + bestPlayer.assists) / Math.max(bestPlayer.deaths, 1);

  for (const participant of participants) {
    const kda =
      (participant.kills + participant.assists) /
      Math.max(participant.deaths, 1);
    if (kda > bestKDA) {
      bestKDA = kda;
      bestPlayer = participant;
    }
  }

  return bestPlayer;
}

/**
 * 检查指定玩家是否是比赛MVP
 * @param game SGP 比赛数据
 * @param puuid 玩家PUUID
 * @returns 是否为MVP
 */
export function isPlayerMVP(game: Game, puuid: string): boolean {
  const mvpPlayer = findMVPPlayer(game);
  return mvpPlayer?.puuid === puuid;
}

/**
 * 获取玩家的MVP分数数据
 * @param game SGP 比赛数据
 * @param puuid 玩家PUUID
 * @returns 玩家的MVP分数数据，如果未找到则返回null
 */
export function getPlayerMVPScore(
  game: Game,
  puuid: string
): MVPScoreData | null {
  const mvpScores = calculateMVPScores(game);
  return mvpScores.find(score => score.participant.puuid === puuid) || null;
}
