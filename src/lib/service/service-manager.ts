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
