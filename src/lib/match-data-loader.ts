import type { SummonerData } from '@/types/summoner';
import type { LocalSearchResult } from '@/lib/composables/useMatchHistoryState';
import { SgpMatchService } from './sgp/sgp-match-service';
import { SummonerService } from './service/summoner-service';

/**
 * 战绩数据加载服务
 */
export class MatchDataLoader {
  private summonerService: SummonerService;
  private sgpMatchService: SgpMatchService;
  private clientUser: SummonerData;
  private clientServerId: string;
  private serverId: string;

  constructor(
    summonerService: SummonerService,
    sgpMatchService: SgpMatchService,
    clientUser: SummonerData,
    clientServerId: string,
    serverId: string
  ) {
    this.summonerService = summonerService;
    this.sgpMatchService = sgpMatchService;
    this.clientUser = clientUser;
    this.clientServerId = clientServerId;
    this.serverId = serverId;
  }

  private eqServerId() {
    return this.serverId === this.clientServerId;
  }

  /**
   * 根据PUUID加载召唤师数据
   */
  async loadSummonerData(puuid: string): Promise<SummonerData> {
    if (puuid === this.clientUser.puuid) {
      return this.clientUser;
    } else {
      const summoners = await this.sgpMatchService.getSummonersByPuuids(
        [puuid],
        this.serverId
      );
      if (summoners.length === 0) {
        throw new Error('未找到该召唤师');
      }
      const firstSummoner = summoners[0];
      return {
        gameName: '',
        tagLine: '',
        displayName: '',
        internalName: firstSummoner.internalName,
        summonerLevel: firstSummoner.level,
        profileIconId: firstSummoner.profileIconId,
        puuid: firstSummoner.puuid,
      } as SummonerData;
    }
  }

  /**
   * 加载完整的战绩数据
   */
  async loadCompleteMatchData(
    puuid: string,
    pageSize: number
  ): Promise<LocalSearchResult> {
    try {
      // 获取召唤师数据
      const summoner = await this.loadSummonerData(puuid);

      // 获取排位数据
      const stats = await this.summonerService.getRankedStats(puuid);

      // 获取战绩数据
      const sgpResult = await this.sgpMatchService.getServerMatchHistory(
        this.serverId,
        puuid,
        0,
        pageSize,
        'q_420'
      );
      const participant = sgpResult.games[0].json.participants.find(
        (p: any) => p.puuid === puuid
      );
      summoner.gameName = participant!.riotIdGameName;
      summoner.tagLine = participant!.riotIdTagline;

      return {
        summoner,
        rankedStats: stats,
        matchHistory: sgpResult.games,
        totalCount: sgpResult.totalCount,
        error: undefined,
      };
    } catch (error: any) {
      throw new Error(error.message || '获取数据失败');
    }
  }

  /**
   * 加载分页战绩数据
   */
  async loadMatchHistoryPage(
    serverId: string,
    puuid: string,
    currentPage: number,
    pageSize: number,
    tag: string = 'q_420'
  ): Promise<{ games: any[]; totalCount: number }> {
    const startIndex = (currentPage - 1) * pageSize;

    return await this.sgpMatchService.getServerMatchHistory(
      serverId,
      puuid,
      startIndex,
      pageSize,
      tag
    );
  }
}
