import { SummonerData } from '@/types/summoner';
import { LCUClientInterface } from '../client/interface';
import { RankedStats } from '@/types/ranked-stats';
import { BaseService } from './base-service';

export class SummonerService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取当前召唤师信息
  async getCurrentSummoner(): Promise<SummonerData> {
    const data = await this.makeRequest<SummonerData>(
      'GET',
      '/lol-summoner/v1/current-summoner'
    );
    return data;
  }

  // 通过召唤师ID获取召唤师信息
  async getSummonerByID(summonerID: number): Promise<SummonerData> {
    const endpoint = `/lol-summoner/v1/summoners/${summonerID}`;
    const data = await this.makeRequest<SummonerData>('GET', endpoint);
    return data;
  }

  // 通过召唤师 accountId 获取召唤师信息
  async getSummonerByAccountID(accountID: number): Promise<SummonerData> {
    const endpoint = `/lol-summoner/v1/summoners/account/${accountID}`;
    const data = await this.makeRequest<SummonerData>('GET', endpoint);
    return data;
  }

  // 获取排位统计
  async getRankedStats(puuid: string): Promise<RankedStats> {
    const endpoint = `/lol-ranked/v1/ranked-stats/${puuid}`;
    const data = await this.makeRequest<RankedStats>('GET', endpoint);
    return data;
  }

  // 获取指定玩家的排位统计（通过PUUID）
  async getPlayerRankedInfo(puuid: string): Promise<[string, string, number]> {
    try {
      const rankedStats = await this.getRankedStats(puuid);

      // 优先显示单双排位，其次是灵活排位
      const soloQueue = rankedStats.queueMap?.RANKED_SOLO_5x5;
      const flexQueue = rankedStats.queueMap?.RANKED_FLEX_SR;

      if (soloQueue && this.isPlayerRanked(soloQueue)) {
        const tierName = soloQueue.tier;
        const rankName = soloQueue.division;
        return [tierName, rankName, soloQueue.leaguePoints];
      } else if (flexQueue && this.isPlayerRanked(flexQueue)) {
        const tierName = flexQueue.tier;
        const rankName = flexQueue.division;
        return [tierName, rankName, flexQueue.leaguePoints];
      } else {
        return ['未知', '', 0];
      }
    } catch (error) {
      return ['段位获取失败', '', 0];
    }
  }

  // 辅助方法：判断是否已定级
  private isPlayerRanked(stats: any): boolean {
    return (
      stats.tier &&
      stats.tier !== 'UNRANKED' &&
      stats.tier !== '' &&
      stats.tier !== 'NONE'
    );
  }
}
