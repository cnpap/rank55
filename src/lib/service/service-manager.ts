import { BanPickService } from './ban-pick-service';
import { AutoActionService } from './auto-action-service';
import { GameflowService } from './gameflow-service';
import { SessionStorageService } from './session-storage-service';
import { GamePhaseManager } from './game-phase-manager';
import { RiotApiService } from './riot-api-service';
import { SummonerService } from './summoner-service';
import { RoomService } from './room-service';
import { FriendService } from './friend-service';
import { SimpleSgpApi } from '../sgp/sgp-api';
import { SgpMatchService } from '../sgp/sgp-match-service';

/**
 * 全局服务实例
 * 直接创建和导出服务实例，避免循环依赖问题
 */

// 基础服务实例
export const gameflowService = new GameflowService();
export const sessionStorageService = new SessionStorageService();
export const riotApiService = new RiotApiService();
export const summonerService = new SummonerService();
export const roomService = new RoomService();
export const friendService = new FriendService();
export const sgpApi = new SimpleSgpApi();

// 依赖其他服务的实例
export const banPickService = new BanPickService();
export const gamePhaseManager = new GamePhaseManager();
export const autoActionService = new AutoActionService();
export const sgpMatchService = new SgpMatchService(sgpApi);

/**
 * 服务管理器类（保留用于向后兼容）
 * @deprecated 建议直接使用导出的服务实例
 */
class ServiceManager {
  private static instance: ServiceManager;

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public get banPickService(): BanPickService {
    return banPickService;
  }

  public get autoActionService(): AutoActionService {
    return autoActionService;
  }

  public get gameflowService(): GameflowService {
    return gameflowService;
  }

  public get sessionStorageService(): SessionStorageService {
    return sessionStorageService;
  }

  public get gamePhaseManager(): GamePhaseManager {
    return gamePhaseManager;
  }

  public get riotApiService(): RiotApiService {
    return riotApiService;
  }

  public get summonerService(): SummonerService {
    return summonerService;
  }

  public get sgpApi(): SimpleSgpApi {
    return sgpApi;
  }

  public get roomService(): RoomService {
    return roomService;
  }

  public get friendService(): FriendService {
    return friendService;
  }

  public get sgpMatchService(): SgpMatchService {
    return sgpMatchService;
  }
}

export { ServiceManager };
