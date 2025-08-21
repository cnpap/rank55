import type { SummonerData } from '@/types/summoner';
import type { LocalSearchResult } from '@/lib/composables/useMatchHistoryState';
import { RiotApiService } from '@/lib/service/riot-api-service';
import { SgpMatchService } from './sgp/sgp-match-service';
import { SummonerService } from './service/summoner-service';

/**
 * 战绩数据加载服务
 */
export class MatchDataLoader {
  private summonerService: SummonerService;
  private sgpMatchService: SgpMatchService;

  constructor(
    summonerService: SummonerService,
    sgpMatchService: SgpMatchService
  ) {
    this.summonerService = summonerService;
    this.sgpMatchService = sgpMatchService;
  }

  /**
   * 根据PUUID加载召唤师数据
   */
  async loadSummonerData(
    puuid: string,
    currentUser: SummonerData,
    serverId: string
  ): Promise<SummonerData> {
    if (puuid === currentUser?.puuid) {
      return currentUser as SummonerData;
    } else {
      const summoners = await this.sgpMatchService.getSummonersByPuuids(
        [puuid],
        serverId
      );

      const firstSummoner = summoners[0];
      return {
        gameName: '',
        tagLine: '',
        displayName: '',
        internalName: firstSummoner.internalName,
        summonerLevel: 0,
        profileIconId: firstSummoner.profileIconId,
        puuid: firstSummoner.puuid,
      } as SummonerData;
    }
  }

  /**
   * 加载完整的战绩数据
   */
  async loadCompleteMatchData(
    serverId: string,
    puuid: string,
    pageSize: number,
    currentUser: SummonerData
  ): Promise<LocalSearchResult> {
    try {
      // 获取召唤师数据
      const summoner = await this.loadSummonerData(
        puuid,
        currentUser,
        serverId
      );

      // 获取排位数据
      const stats = await this.summonerService.getRankedStats(puuid);

      // 获取战绩数据
      const sgpResult = await this.sgpMatchService.getServerMatchHistory(
        serverId,
        puuid,
        0,
        pageSize
      );

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
    tag: string = 'all'
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
