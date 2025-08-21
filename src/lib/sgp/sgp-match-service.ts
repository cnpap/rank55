import { SimpleSgpApi } from './sgp-api';
import { BaseService } from '../service/base-service';
import { Game, MatchHistorySgp } from '@/types/match-history-sgp';

interface SgpMatchHistoryResult {
  games: Game[];
  totalCount: number;
  startIndex: number;
  endIndex: number;
  serverId: string;
}

interface MatchHistoryOptions {
  serverId: string;
  tag?: string; // 添加tag选项
}

export class SgpMatchService extends BaseService {
  private _sgpApi: SimpleSgpApi;

  constructor(sgpApi: SimpleSgpApi, lcuClient?: any) {
    super(lcuClient);
    this._sgpApi = sgpApi;
  }

  /**
   * 从LCU获取entitlement token
   */
  private async _getEntitlementToken(): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ accessToken: string }>(
        'GET',
        '/entitlements/v1/token'
      );
      console.log('获取到的token响应:', {
        hasAccessToken: !!response.accessToken,
        tokenLength: response.accessToken?.length || 0,
        tokenPrefix: response.accessToken?.substring(0, 20) + '...',
      });
      return response.accessToken;
    } catch (error) {
      console.warn('获取entitlement token失败:', error);
      return null;
    }
  }

  /**
   * 自动推断当前用户的服务器ID
   */
  async _inferCurrentUserServerId(): Promise<string | undefined> {
    try {
      // 前端环境：通过 electronAPI 获取凭据
      if (
        typeof window !== 'undefined' &&
        window.electronAPI &&
        window.electronAPI.getLcuCredentials
      ) {
        const credentials = await window.electronAPI.getLcuCredentials();
        const serverId = this._sgpApi.inferSgpServerId(
          credentials.region,
          credentials.rsoPlatformId
        );

        if (serverId) {
          console.log('前端环境自动推断的服务器ID:', {
            serverId,
            region: credentials.region,
            rsoPlatformId: credentials.rsoPlatformId,
          });
        }

        return serverId;
      }

      // Node.js 环境：直接使用 LCUClient
      if (this.client) {
        const credentials = this.client.getCredentials();
        const serverId = this._sgpApi.inferSgpServerId(
          credentials.region,
          credentials.rsoPlatformId
        );

        if (serverId) {
          console.log('Node.js环境自动推断的服务器ID:', {
            serverId,
            region: credentials.region,
            rsoPlatformId: credentials.rsoPlatformId,
          });
        }

        return serverId;
      }

      console.warn('无法获取 LCU 凭据信息');
      return undefined;
    } catch (error) {
      console.warn('推断服务器ID失败:', error);
      return undefined;
    }
  }

  /**
   * 获取战绩数据
   * @param playerPuuid 玩家PUUID
   * @param start 开始索引
   * @param count 数量
   * @param options 查询选项
   * @returns 战绩数据
   */
  async getMatchHistory(
    playerPuuid: string,
    start: number = 0,
    count: number = 20,
    options: MatchHistoryOptions
  ): Promise<SgpMatchHistoryResult> {
    // 获取token
    const token = await this._getEntitlementToken();
    if (!token) {
      throw new Error('无法获取认证token');
    }

    // 确定使用的服务器ID
    let serverId = options.serverId;

    // 如果仍然没有服务器ID，抛出错误
    if (!serverId) {
      throw new Error(
        '无法确定服务器ID。请手动指定serverId参数，或确保LCU客户端已连接且isCurrentUser=true'
      );
    }

    // 检查服务器是否支持战绩查询
    if (!this._sgpApi.isMatchHistorySupported(serverId)) {
      throw new Error(`服务器 ${serverId} 不支持战绩查询`);
    }

    console.log('SGP战绩查询:', {
      serverId,
      playerPuuid: playerPuuid.substring(0, 8) + '...',
      start,
      count,
      tokenPrefix: token.substring(0, 20) + '...',
    });

    this._sgpApi.setEntitlementToken(token);

    try {
      const response: MatchHistorySgp = await this._sgpApi.getMatchHistory(
        serverId,
        playerPuuid,
        start,
        count,
        options.tag // 传递tag参数
      );

      console.log('SGP API详细响应:', {
        gameCount: response.games.length,
        serverId,
      });

      const result: SgpMatchHistoryResult = {
        games: response.games,
        totalCount: response.games.length,
        startIndex: start,
        endIndex: start + count - 1,
        serverId,
      };

      console.log('处理后的结果:', {
        gamesFound: result.games.length,
        totalCount: result.totalCount,
        serverId: result.serverId,
      });

      return result;
    } catch (error: any) {
      console.error('SGP API调用详细错误:', {
        serverId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers ? Object.keys(error.config.headers) : [],
      });
      throw error;
    }
  }

  async getServerMatchHistory(
    serverId: string,
    playerPuuid: string,
    start: number = 0,
    count: number = 20,
    tag?: string
  ): Promise<SgpMatchHistoryResult> {
    return this.getMatchHistory(playerPuuid, start, count, {
      serverId,
      tag,
    });
  }

  getAvailableServers(): string[] {
    return this._sgpApi.getAvailableServers();
  }
}
