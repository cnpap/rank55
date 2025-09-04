import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';
import {
  LolGameDataChampionSummary,
  LolGameDataItems,
  LolGameDataPerk,
  LolGameDataSpell,
} from '@/types/lol-game-data';

/**
 * LOL静态资源服务类
 */
export class LOLStaticAssetsService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  async getSummonerSpells() {
    return this.makeRequest<LolGameDataSpell>(
      'GET',
      '/lol-game-data/assets/v1/summoner-spells.json'
    );
  }

  async getPerkstyles() {
    return this.makeRequest<LolGameDataPerk>(
      'GET',
      '/lol-game-data/assets/v1/perkstyles.json'
    );
  }

  async getItems() {
    return this.makeRequest<LolGameDataItems>(
      'GET',
      '/lol-game-data/assets/v1/items.json'
    );
  }

  async getChampionSummary() {
    return this.makeRequest<LolGameDataChampionSummary>(
      'GET',
      '/lol-game-data/assets/v1/champion-summary.json'
    );
  }

  async getMaps() {
    return this.makeRequest<any>('GET', '/lol-game-data/assets/v1/maps.json');
  }

  async getPerks() {
    return this.makeRequest<any>('GET', '/lol-game-data/assets/v1/perks.json');
  }

  async getQueues() {
    return this.makeRequest<any>('GET', '/lol-game-data/assets/v1/queues.json');
  }

  async getMapAssets() {
    return this.makeRequest<any>(
      'GET',
      '/lol-game-data/assets/v1/map-assets/map-assets.json'
    );
  }

  async getChampDetails(champId: number) {
    return this.makeRequest<any>(
      'GET',
      `/lol-game-data/assets/v1/champions/${champId}.json`
    );
  }

  async getAugments() {
    return this.makeRequest<any>(
      'GET',
      '/lol-game-data/assets/v1/cherry-augments.json'
    );
  }

  async getStrawberryHub() {
    return this.makeRequest<any>(
      'GET',
      '/lol-game-data/assets/v1/strawberry-hub.json'
    );
  }
}
