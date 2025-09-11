import { OpggDataApi } from './opgg';
import {
  ModeType,
  OpggARAMBalance,
  OpggARAMChampionSummary,
  OpggArenaChampionSummary,
  OpggArenaModeChampion,
  OpggNormalModeChampion,
  OpggRankedChampionsSummary,
  PositionType,
  RegionType,
  TierType,
  Versions,
} from './opgg/types';

/**
 * OP.GG 数据服务
 * 提供英雄数据、版本信息等功能
 */
export class OpggService {
  private api: OpggDataApi;

  constructor() {
    this.api = new OpggDataApi();
  }

  /**
   * 获取版本信息
   * @param region 地区
   * @param mode 游戏模式
   * @param signal 取消信号
   * @returns 版本列表
   */
  async getVersions(
    region: RegionType = 'global',
    mode: ModeType = 'ranked',
    signal?: AbortSignal
  ): Promise<Versions> {
    return await this.api.getVersions({ region, mode, signal });
  }

  /**
   * 获取英雄排行榜数据
   * @param options 查询选项
   * @returns 英雄排行榜数据
   */
  async getChampionsTier(options: {
    region?: RegionType;
    mode?: ModeType;
    tier?: TierType;
    version?: string;
    signal?: AbortSignal;
  }): Promise<
    | OpggRankedChampionsSummary
    | OpggArenaChampionSummary
    | OpggARAMChampionSummary
  > {
    const {
      region = 'global',
      mode = 'ranked',
      tier = 'platinum_plus',
      version,
      signal,
    } = options;

    return await this.api.getChampionsTier({
      region,
      mode,
      tier,
      version,
      signal,
    });
  }

  /**
   * 获取单个英雄详细数据
   * @param options 查询选项
   * @returns 英雄详细数据
   */
  async getChampion(options: {
    id: number;
    region?: RegionType;
    mode?: ModeType;
    tier?: TierType;
    position?: PositionType;
    version?: string;
    signal?: AbortSignal;
  }): Promise<OpggNormalModeChampion | OpggArenaModeChampion> {
    const {
      id,
      region = 'global',
      mode = 'ranked',
      tier = 'platinum_plus',
      position = 'all',
      version,
      signal,
    } = options;

    return await this.api.getChampion({
      id,
      region,
      mode,
      tier,
      position,
      version,
      signal,
    });
  }

  /**
   * 获取 ARAM 平衡性数据
   * @returns ARAM 平衡性数据
   */
  async getARAMBalance(): Promise<OpggARAMBalance> {
    return await this.api.getARAMBalance();
  }

  /**
   * 获取最新版本号
   * @param region 地区
   * @param mode 游戏模式
   * @returns 最新版本号
   */
  async getLatestVersion(
    region: RegionType = 'global',
    mode: ModeType = 'ranked'
  ): Promise<string> {
    const versions = await this.getVersions(region, mode);
    return versions.data[0] || '';
  }

  /**
   * 获取指定英雄在所有位置的数据
   * @param championId 英雄ID
   * @param options 查询选项
   * @returns 英雄在各位置的数据
   */
  async getChampionAllPositions(
    championId: number,
    options: {
      region?: RegionType;
      tier?: TierType;
      version?: string;
      signal?: AbortSignal;
    } = {}
  ): Promise<{
    top?: OpggNormalModeChampion;
    jungle?: OpggNormalModeChampion;
    mid?: OpggNormalModeChampion;
    adc?: OpggNormalModeChampion;
    support?: OpggNormalModeChampion;
  }> {
    const positions: PositionType[] = [
      'top',
      'jungle',
      'mid',
      'adc',
      'support',
    ];
    const results: any = {};

    for (const position of positions) {
      try {
        const data = await this.getChampion({
          id: championId,
          position,
          mode: 'ranked',
          ...options,
        });
        results[position] = data;
      } catch (error) {
        // 某些英雄在某些位置可能没有数据，忽略错误
        console.warn(
          `Failed to get data for champion ${championId} at position ${position}:`,
          error
        );
      }
    }

    return results;
  }
}
