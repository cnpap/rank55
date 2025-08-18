import axios, { AxiosInstance } from 'axios';
import { MatchHistorySgp } from '../../types/match-history-sgp';
import serverConfig from '../../../public/config/league-servers.json';

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
    this._http = axios.create({
      headers: {
        'User-Agent':
          'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)',
      },
      timeout: 12500,
    });
  }

  setEntitlementToken(token: string | null) {
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
    if (!this._entitlementToken) {
      throw new Error('JWT token未设置');
    }

    const sgpServer = this._getSgpServer(sgpServerId);
    if (!sgpServer.matchHistory) {
      throw new Error(`服务器 ${sgpServerId} 不支持战绩查询`);
    }

    console.log('SGP API请求:', {
      serverId: sgpServerId,
      serverUrl: sgpServer.matchHistory,
      playerPuuid: playerPuuid.substring(0, 8) + '...',
      start,
      count,
      tag,
    });

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
        baseURL: sgpServer.matchHistory,
        headers: {
          Authorization: `Bearer ${this._entitlementToken}`,
        },
        params,
      }
    );

    return response.data;
  }

  /**
   * 获取可用的服务器列表
   * @returns 服务器ID数组
   */
  getAvailableServers(): string[] {
    return Object.keys(this._sgpServerConfig.servers);
  }

  /**
   * 检查服务器是否支持战绩查询
   * @param sgpServerId SGP服务器ID
   * @returns 是否支持
   */
  isMatchHistorySupported(sgpServerId: string): boolean {
    const server = this._sgpServerConfig.servers[sgpServerId.toUpperCase()];
    return !!(server && server.matchHistory);
  }
}
