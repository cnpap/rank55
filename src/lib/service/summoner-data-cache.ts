import type { SummonerData } from '@/types/summoner';
import type { RankedStats } from '@/types/ranked-stats';
import { summonerService } from './service-manager';

export interface CachedSummonerData {
  summonerData?: SummonerData;
  rankedStats?: RankedStats;
  isLoadingSummonerData?: boolean;
  isLoadingRankedStats?: boolean;
  summonerDataLoadedAt?: number;
  rankedStatsLoadedAt?: number;
  error?: string;
}

/**
 * 召唤师数据缓存服务
 * 用于在不同阶段（房间、选英雄、游戏开始）之间共享已加载的召唤师数据
 * 避免重复加载同一个召唤师的数据
 */
export class SummonerDataCache {
  private cache = new Map<number, CachedSummonerData>();

  // 缓存过期时间（5分钟）
  private readonly CACHE_EXPIRE_TIME = 10 * 60 * 1000;

  /**
   * 获取召唤师数据（优先从缓存获取）
   */
  async getSummonerData(summonerId: number): Promise<SummonerData | null> {
    const cached = this.cache.get(summonerId);

    // 如果缓存中有数据且未过期，直接返回
    if (cached?.summonerData && this.isSummonerDataValid(cached)) {
      console.log(`📋 从缓存获取召唤师数据: ${summonerId}`);
      return cached.summonerData;
    }

    // 如果正在加载中，等待加载完成
    if (cached?.isLoadingSummonerData) {
      console.log(`⏳ 召唤师数据加载中，等待完成: ${summonerId}`);
      return await this.waitForSummonerDataLoad(summonerId);
    }

    // 开始加载数据
    return await this.loadSummonerData(summonerId);
  }

  /**
   * 获取排位统计数据（优先从缓存获取）
   */
  async getRankedStats(
    summonerId: number,
    puuid: string
  ): Promise<RankedStats | null> {
    const cached = this.cache.get(summonerId);

    // 如果缓存中有数据且未过期，直接返回
    if (cached?.rankedStats && this.isRankedStatsValid(cached)) {
      console.log(`📋 从缓存获取排位统计: ${summonerId}`);
      return cached.rankedStats;
    }

    // 如果正在加载中，等待加载完成
    if (cached?.isLoadingRankedStats) {
      console.log(`⏳ 排位统计加载中，等待完成: ${summonerId}`);
      return await this.waitForRankedStatsLoad(summonerId);
    }

    // 开始加载数据
    return await this.loadRankedStats(summonerId, puuid);
  }

  /**
   * 批量获取召唤师数据
   */
  async batchGetSummonerData(
    summonerIds: number[]
  ): Promise<Map<number, SummonerData | null>> {
    const results = new Map<number, SummonerData | null>();

    // 并行加载所有召唤师数据
    const promises = summonerIds.map(async summonerId => {
      try {
        const data = await this.getSummonerData(summonerId);
        results.set(summonerId, data);
      } catch (error) {
        console.warn(`批量获取召唤师数据失败: ${summonerId}`, error);
        results.set(summonerId, null);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 批量获取排位统计数据
   */
  async batchGetRankedStats(
    requests: Array<{ summonerId: number; puuid: string }>
  ): Promise<Map<number, RankedStats | null>> {
    const results = new Map<number, RankedStats | null>();

    // 并行加载所有排位统计
    const promises = requests.map(async ({ summonerId, puuid }) => {
      try {
        const stats = await this.getRankedStats(summonerId, puuid);
        results.set(summonerId, stats);
      } catch (error) {
        console.warn(`批量获取排位统计失败: ${summonerId}`, error);
        results.set(summonerId, null);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 检查是否有缓存的召唤师数据
   */
  hasSummonerData(summonerId: number): boolean {
    const cached = this.cache.get(summonerId);
    return !!(cached?.summonerData && this.isSummonerDataValid(cached));
  }

  /**
   * 检查是否有缓存的排位统计数据
   */
  hasRankedStats(summonerId: number): boolean {
    const cached = this.cache.get(summonerId);
    return !!(cached?.rankedStats && this.isRankedStatsValid(cached));
  }

  /**
   * 清除指定召唤师的缓存
   */
  clearSummonerCache(summonerId: number): void {
    this.cache.delete(summonerId);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalCached: number;
    withSummonerData: number;
    withRankedStats: number;
  } {
    const totalCached = this.cache.size;
    let withSummonerData = 0;
    let withRankedStats = 0;

    for (const cached of this.cache.values()) {
      if (cached.summonerData) withSummonerData++;
      if (cached.rankedStats) withRankedStats++;
    }

    return { totalCached, withSummonerData, withRankedStats };
  }

  // 私有方法

  private async loadSummonerData(
    summonerId: number
  ): Promise<SummonerData | null> {
    // 标记为加载中
    const cached = this.cache.get(summonerId) || {};
    cached.isLoadingSummonerData = true;
    this.cache.set(summonerId, cached);

    try {
      console.log(`🔄 开始加载召唤师数据: ${summonerId}`);
      const summonerData = await summonerService.getSummonerByID(summonerId);

      // 更新缓存
      cached.summonerData = summonerData;
      cached.summonerDataLoadedAt = Date.now();
      cached.isLoadingSummonerData = false;
      cached.error = undefined;
      this.cache.set(summonerId, cached);

      console.log(`✅ 召唤师数据加载完成: ${summonerId}`);
      return summonerData;
    } catch (error) {
      console.warn(`❌ 召唤师数据加载失败: ${summonerId}`, error);

      // 更新错误状态
      cached.isLoadingSummonerData = false;
      cached.error = error instanceof Error ? error.message : '加载失败';
      this.cache.set(summonerId, cached);

      return null;
    }
  }

  private async loadRankedStats(
    summonerId: number,
    puuid: string
  ): Promise<RankedStats | null> {
    // 标记为加载中
    const cached = this.cache.get(summonerId) || {};
    cached.isLoadingRankedStats = true;
    this.cache.set(summonerId, cached);

    try {
      console.log(`🔄 开始加载排位统计: ${summonerId}`);
      const rankedStats = await summonerService.getRankedStats(puuid);

      // 更新缓存
      cached.rankedStats = rankedStats;
      cached.rankedStatsLoadedAt = Date.now();
      cached.isLoadingRankedStats = false;
      cached.error = undefined;
      this.cache.set(summonerId, cached);

      console.log(`✅ 排位统计加载完成: ${summonerId}`);
      return rankedStats;
    } catch (error) {
      console.warn(`❌ 排位统计加载失败: ${summonerId}`, error);

      // 更新错误状态
      cached.isLoadingRankedStats = false;
      cached.error = error instanceof Error ? error.message : '加载失败';
      this.cache.set(summonerId, cached);

      return null;
    }
  }

  private async waitForSummonerDataLoad(
    summonerId: number
  ): Promise<SummonerData | null> {
    // 等待加载完成，最多等待10秒
    const maxWaitTime = 10000;
    const checkInterval = 100;
    let waitedTime = 0;

    while (waitedTime < maxWaitTime) {
      const cached = this.cache.get(summonerId);
      if (!cached?.isLoadingSummonerData) {
        return cached?.summonerData || null;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    console.warn(`⏰ 等待召唤师数据加载超时: ${summonerId}`);
    return null;
  }

  private async waitForRankedStatsLoad(
    summonerId: number
  ): Promise<RankedStats | null> {
    // 等待加载完成，最多等待10秒
    const maxWaitTime = 10000;
    const checkInterval = 100;
    let waitedTime = 0;

    while (waitedTime < maxWaitTime) {
      const cached = this.cache.get(summonerId);
      if (!cached?.isLoadingRankedStats) {
        return cached?.rankedStats || null;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    console.warn(`⏰ 等待排位统计加载超时: ${summonerId}`);
    return null;
  }

  private isSummonerDataValid(cached: CachedSummonerData): boolean {
    if (!cached.summonerDataLoadedAt) return false;
    return Date.now() - cached.summonerDataLoadedAt < this.CACHE_EXPIRE_TIME;
  }

  private isRankedStatsValid(cached: CachedSummonerData): boolean {
    if (!cached.rankedStatsLoadedAt) return false;
    return Date.now() - cached.rankedStatsLoadedAt < this.CACHE_EXPIRE_TIME;
  }
}

// 创建全局单例实例
export const summonerDataCache = new SummonerDataCache();
