import { PlayerAccountAlias } from '@/types/player-account-alias';
import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';
import { SummonerLedge } from '@/types/summoner';

/**
 * Riot API 服务类
 * 处理与 Riot Games API 相关的请求
 */
export class RiotApiService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  /**
   * 根据游戏名称和标签查找玩家账户别名
   * @param gameName 游戏名称
   * @param tagLine 标签（可选，如果不提供会从 gameName 中解析 # 号分割的部分）
   * @returns Promise<PlayerAccountAlias>
   */
  async lookupPlayerAccount(
    gameName: string,
    tagLine?: string
  ): Promise<PlayerAccountAlias> {
    if (!tagLine) {
      // # 号分割
      const parts = gameName.split('#');
      if (parts.length !== 2) {
        throw new Error('游戏名称格式错误，应包含 # 号和标签');
      }
      gameName = parts[0].trim();
      tagLine = parts[1].trim();
      console.log(
        `lookupPlayerAccount 输入: gameName=${gameName}, tagLine=${tagLine}`
      );
    }
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

  /**
   * 批量查询召唤师信息
   * @param puuids 召唤师 PUUID 列表
   * @returns Promise<any>
   */
  async getSummonersByPuuids(puuids: string[]): Promise<SummonerLedge[]> {
    try {
      const endpoint = '/summoner-ledge/v1/regions/cq100/summoners/puuids';
      const data = await this.makeRiotRequest<SummonerLedge[]>(
        'POST',
        endpoint,
        {
          body: puuids,
        }
      );
      return data;
    } catch (error: any) {
      if (error.message.includes('404')) {
        throw new Error(`批量查询召唤师失败: 端点不存在`);
      }
      if (error.message.includes('500')) {
        throw new Error(`批量查询召唤师失败: 服务器错误`);
      }
      if (error.message.includes('400')) {
        throw new Error(`批量查询召唤师失败: 无效的 PUUID 列表`);
      }
      throw new Error(`批量查询召唤师失败: ${error}`);
    }
  }
}
