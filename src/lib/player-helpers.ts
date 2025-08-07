import { toast } from 'vue-sonner';
import {
  isRanked,
  getTierName,
  getRankName,
  getRankImageUrl,
  getQueueTypeName,
} from './rank-helpers';
import type { SummonerData } from '@/types/summoner';
import type { Queue, RankedStats } from '@/types/ranked-stats';

/**
 * 复制文本到剪贴板的通用函数
 * @param text 要复制的文本
 * @param successMessage 成功提示消息
 * @param errorMessage 失败提示消息
 */
export async function copyToClipboard(
  text: string,
  successMessage: string = '已复制到剪贴板',
  errorMessage: string = '复制失败，请重试'
): Promise<void> {
  try {
    // 使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        toast.success(successMessage);
      } else {
        throw new Error('复制命令执行失败');
      }
    }
  } catch (error) {
    console.error('复制失败:', error);
    toast.error(errorMessage);
  }
}

/**
 * 获取玩家的完整显示名称（包含标签）
 * @param summonerData 召唤师数据
 * @param fallbackName 备用名称
 * @returns 格式化的玩家名称
 */
export function getPlayerDisplayName(
  summonerData: SummonerData | null | undefined,
  fallbackName?: string
): string {
  if (!summonerData) {
    return fallbackName || '未知玩家';
  }

  // 如果有 gameName 和 tagLine，组合显示
  if (summonerData.gameName && summonerData.tagLine) {
    return `${summonerData.gameName}#${summonerData.tagLine}`;
  }

  // 否则使用其他可用的名称字段
  return (
    summonerData.displayName ||
    summonerData.gameName ||
    summonerData.internalName ||
    fallbackName ||
    '未知玩家'
  );
}

/**
 * 获取玩家名称（不包含标签）
 * @param summonerData 召唤师数据
 * @param fallbackName 备用名称
 * @returns 玩家名称（不含标签）
 */
export function getPlayerName(
  summonerData: SummonerData | null | undefined,
  fallbackName?: string
): string {
  if (!summonerData) {
    return fallbackName || '未知玩家';
  }

  if (summonerData.gameName) {
    return summonerData.gameName;
  }

  return (
    summonerData.displayName ||
    summonerData.internalName ||
    fallbackName ||
    '未知玩家'
  );
}

/**
 * 获取玩家标签部分
 * @param summonerData 召唤师数据
 * @returns 标签部分（包含#号）
 */
export function getPlayerTagLine(
  summonerData: SummonerData | null | undefined
): string {
  return summonerData?.tagLine ? `#${summonerData.tagLine}` : '';
}

/**
 * 从参与者身份信息中提取玩家名称
 * @param identity 参与者身份信息
 * @returns 格式化的玩家名称
 */
export function extractPlayerNameFromIdentity(identity: any): string {
  if (!identity?.player) {
    return '未知玩家';
  }

  const player = identity.player;

  // 优先使用 gameName + tagLine 组合
  if (player.gameName && player.tagLine) {
    return `${player.gameName}#${player.tagLine}`;
  }

  // 回退到 summonerName
  if (player.summonerName) {
    return player.summonerName;
  }

  return '未知玩家';
}

/**
 * 排位信息处理接口
 */
export interface ProcessedRankInfo {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
  iconUrl: string;
  queueName: string;
}

/**
 * 处理单个排位队列信息
 * @param queue 排位队列数据
 * @param queueType 队列类型
 * @returns 处理后的排位信息
 */
export function processRankInfo(
  queue: Queue | undefined,
  queueType: string
): ProcessedRankInfo {
  if (!queue) {
    return {
      tier: '未定级',
      division: '',
      lp: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      iconUrl: getRankImageUrl('IRON'), // 使用黑铁图标
      queueName: getQueueTypeName(queueType),
    };
  }

  const totalGames = queue.wins + queue.losses;
  const winRate =
    totalGames > 0 ? Math.round((queue.wins / totalGames) * 100) : 0;

  // 如果是定级中或者没有段位，使用黑铁图标
  const displayTier = queue.tier || 'IRON';
  const iconUrl = getRankImageUrl(displayTier);

  return {
    tier: getTierName(queue.tier) || '定级中',
    division: queue.division,
    lp: queue.leaguePoints,
    wins: queue.wins,
    losses: queue.losses,
    winRate,
    iconUrl,
    queueName: getQueueTypeName(queueType),
  };
}

/**
 * 获取玩家的单双排和灵活排位信息
 * @param rankedStats 排位统计数据
 * @returns 包含单双排和灵活排位信息的数组
 */
export function getPlayerRankInfos(
  rankedStats: RankedStats | null | undefined
): ProcessedRankInfo[] {
  if (!rankedStats) {
    return [
      processRankInfo(undefined, 'RANKED_SOLO_5x5'),
      processRankInfo(undefined, 'RANKED_FLEX_SR'),
    ];
  }

  const soloQueue = rankedStats.queues?.find(
    q => q.queueType === 'RANKED_SOLO_5x5'
  );
  const flexQueue = rankedStats.queues?.find(
    q => q.queueType === 'RANKED_FLEX_SR'
  );

  return [
    processRankInfo(soloQueue, 'RANKED_SOLO_5x5'),
    processRankInfo(flexQueue, 'RANKED_FLEX_SR'),
  ];
}

/**
 * 格式化排位显示文本
 * @param tier 段位
 * @param division 分段
 * @param leaguePoints LP点数
 * @returns 格式化的排位文本
 */
export function formatRankDisplay(
  tier: string | undefined,
  division: string | undefined,
  leaguePoints: number | undefined
): string {
  if (!tier || tier === '未定级') {
    return '未定级';
  }

  const tierName = getTierName(tier);
  const divisionName = division ? ` ${getRankName(division)}` : '';
  const lpText = leaguePoints && leaguePoints > 0 ? ` ${leaguePoints}LP` : '';

  return `${tierName}${divisionName}${lpText}`;
}

/**
 * 从 queueMap 格式的排位数据中获取排位信息
 * @param rankedStats 包含 queueMap 的排位数据
 * @param queueType 队列类型
 * @returns 排位信息对象
 */
export function getRankInfoFromQueueMap(
  rankedStats: any,
  queueType: 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR'
): { tier: string; division: string; leaguePoints: number } {
  if (!rankedStats?.queueMap) {
    return { tier: '未定级', division: '', leaguePoints: 0 };
  }

  const queue = rankedStats.queueMap[queueType];

  if (queue && isRanked(queue)) {
    return {
      tier: queue.tier,
      division: queue.division,
      leaguePoints: queue.leaguePoints,
    };
  }

  return { tier: '未定级', division: '', leaguePoints: 0 };
}
