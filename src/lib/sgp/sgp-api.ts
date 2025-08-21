import axios, { AxiosInstance } from 'axios';
import { MatchHistorySgp } from '../../types/match-history-sgp';
import serverConfig from '../../../public/config/league-servers.json';
import { SummonerLedge } from '@/types/summoner';

interface SgpServer {
  matchHistory: string | null;
  common: string | null;
}

interface SgpServersConfig {
  version: number;
  lastUpdate: number;
  servers: {
    [region: string]: SgpServer;
  };
}

export class SimpleSgpApi {
  private _http: AxiosInstance;
  private _entitlementToken: string | null = null;
  private _sgpServerConfig: SgpServersConfig;

  constructor(config?: SgpServersConfig) {
    // 如果没有传入配置，使用默认导入的配置
    this._sgpServerConfig = config || (serverConfig as SgpServersConfig);
    this._http = axios.create();
  }

  setEntitlementToken(token: string) {
    this._entitlementToken = token;
  }

  /**
   * 根据LCU客户端参数自动推断SGP服务器ID（仅支持腾讯服务器）
   * @param region LCU客户端的region参数
   * @param rsoPlatformId LCU客户端的rsoPlatformId参数
   * @returns SGP服务器ID，如果无法推断则返回null
   */
  inferSgpServerId(
    region?: string,
    rsoPlatformId?: string
  ): string | undefined {
    // 腾讯服务器：region为'TENCENT'，rsoPlatformId为具体服务器标识
    if (region === 'TENCENT' && rsoPlatformId) {
      const sgpServerId = `TENCENT_${rsoPlatformId}`;
      if (this._sgpServerConfig.servers[sgpServerId]) {
        return sgpServerId;
      }
    }

    console.warn('无法从LCU参数推断SGP服务器ID（仅支持腾讯服务器）:', {
      region,
      rsoPlatformId,
    });
    return;
  }

  /**
   * 对于腾讯系, 仅保留其 rsoPlatformId
   * @param sgpServerId
   */
  private _getSubId(sgpServerId: string) {
    if (sgpServerId.startsWith('TENCENT')) {
      const [_, rsoPlatformId] = sgpServerId.split('_');
      return rsoPlatformId;
    }

    return sgpServerId;
  }

  /**
   * 获取SGP服务器配置
   * @param sgpServerId SGP服务器ID
   * @returns SGP服务器配置
   */
  private _getSgpServer(sgpServerId: string): SgpServer {
    const sgpServer = this._sgpServerConfig.servers[sgpServerId.toUpperCase()];
    if (!sgpServer) {
      throw new Error(`未知的SGP服务器ID: ${sgpServerId}`);
    }
    return sgpServer;
  }

  /**
   * 获取战绩数据
   * @param sgpServerId SGP服务器ID
   * @param playerPuuid 玩家PUUID
   * @param start 开始索引
   * @param count 数量
   * @param tag 游戏模式标签过滤
   * @returns 战绩数据
   */
  async getMatchHistory(
    sgpServerId: string,
    playerPuuid: string,
    start: number,
    count: number,
    tag?: string
  ): Promise<MatchHistorySgp> {
    const sgpServer = this._getSgpServer(sgpServerId);
    const params: any = {
      startIndex: start,
      count,
    };

    // 添加tag参数（如果提供）
    if (tag && tag !== 'all') {
      params.tag = tag;
    }

    const response = await this._http.get<MatchHistorySgp>(
      `/match-history-query/v1/products/lol/player/${playerPuuid}/SUMMARY`,
      {
        baseURL: sgpServer.matchHistory!,
        headers: {
          Authorization: `Bearer ${this._entitlementToken}`,
        },
        params,
      }
    );

    return response.data;
  }

  /**
   * 批量查询召唤师信息
   * @param puuids 召唤师 PUUID 列表
   * @returns Promise<any>
   */
  async getSummonersByPuuids(
    puuids: string[],
    sgpServerId: string
  ): Promise<SummonerLedge[]> {
    try {
      const sgpServer = this._getSgpServer(sgpServerId);
      const subId = this._getSubId(sgpServerId);
      const response = await this._http.post<SummonerLedge[]>(
        `/summoner-ledge/v1/regions/${subId.toLocaleLowerCase()}/summoners/puuids`,
        puuids,
        {
          baseURL: sgpServer.matchHistory!,
          headers: {
            Authorization: `Bearer ${this._entitlementToken}`,
          },
        }
      );
      return response.data;
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

  /**
   * 获取可用的服务器列表
   * @returns 服务器ID数组
   */
  getAvailableServers(): string[] {
    return Object.keys(this._sgpServerConfig.servers);
  }
}
