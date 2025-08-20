import { SummonerData } from '@/types/summoner';
import { LCUClientInterface } from '../client/interface';
import { RankedStats } from '@/types/ranked-stats';
import { Game, MatchHistory } from '@/types/match-history';
import { BaseService } from './base-service';
import { PlayerAccountAlias } from '@/types/player-account-alias';

export class SummonerService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取比赛详细数据
  async getMatchDetail(gameID: number): Promise<Game> {
    const endpoint = `/lol-match-history/v1/games/${gameID}`;
    const data = await this.makeRequest<Game>('GET', endpoint);
    return data;
  }

  // 获取当前召唤师信息
  async getCurrentSummoner(): Promise<SummonerData> {
    const data = await this.makeRequest<SummonerData>(
      'GET',
      '/lol-summoner/v1/current-summoner'
    );
    return data;
  }

  // 根据名称获取召唤师信息
  async getSummonerByName(name: string): Promise<SummonerData> {
    try {
      const endpoint = `/lol-summoner/v1/summoners?name=${encodeURIComponent(name)}`;
      const data = await this.makeRequest<SummonerData>('GET', endpoint);
      return data;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`根据名称获取召唤师失败: 召唤师不存在`);
      }
      if (error.message.includes('500')) {
        throw new Error(`根据名称获取召唤师失败: 服务器错误`);
      }
      if (error.message.includes('402')) {
        throw new Error(`根据名称获取召唤师失败: 无效的召唤师名称`);
      }
      throw new Error(`根据名称获取召唤师失败: ${error}`);
    }
  }

  // 通过召唤师ID获取召唤师信息
  async getSummonerByID(summonerID: number): Promise<SummonerData> {
    const endpoint = `/lol-summoner/v1/summoners/${summonerID}`;
    const data = await this.makeRequest<SummonerData>('GET', endpoint);
    return data;
  }

  // 获取比赛历史 - 使用PUUID
  async getMatchHistory(
    puuid: string,
    beginIndex: number,
    endIndex: number
  ): Promise<MatchHistory> {
    try {
      console.log('getMatchHistory', puuid, beginIndex, endIndex);
      const endpoint = `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=${beginIndex}&endIndex=${endIndex}`;
      const data = await this.makeRequest<MatchHistory>('GET', endpoint);
      return data;
    } catch (error) {
      throw new Error(`获取比赛历史失败: ${error}`);
    }
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
        return ['未定级', '', 0];
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

  // 根据游戏名称和标签查找玩家账户别名
  async lookupPlayerAccount(
    gameName: string,
    tagLine: string
  ): Promise<PlayerAccountAlias> {
    try {
      const endpoint = '/player-account/aliases/v1/lookup';
      const data = await this.makeRiotRequest<PlayerAccountAlias>(
        'GET',
        endpoint,
        {
          params: { gameName, tagLine },
        }
      );
      return data;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`查找玩家账户失败: 玩家不存在`);
      }
      if (error.message.includes('500')) {
        throw new Error(`查找玩家账户失败: 服务器错误`);
      }
      if (error.message.includes('400')) {
        throw new Error(`查找玩家账户失败: 无效的游戏名称或标签`);
      }
      throw new Error(`查找玩家账户失败: ${error}`);
    }
  }
}
