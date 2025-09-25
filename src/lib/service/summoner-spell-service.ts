import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

export interface SummonerSpell {
  id: number;
  name: string;
  description: string;
  tooltip: string;
  maxrank: number;
  cooldown: number[];
  cooldownBurn: string;
  cost: number[];
  costBurn: string;
  datavalues: any;
  effect: number[][];
  effectBurn: string[];
  vars: any[];
  key: string;
  summonerLevel: number;
  modes: string[];
  costType: string;
  maxammo: string;
  range: number[];
  rangeBurn: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  resource: string;
}

export interface SummonerSpellSelection {
  spell1Id: number;
  spell2Id: number;
}

export class SummonerSpellService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取所有可用的召唤师技能
  async getAvailableSummonerSpells(): Promise<SummonerSpell[]> {
    return this.makeRequest(
      'GET',
      '/lol-game-data/assets/v1/summoner-spells.json'
    );
  }

  // 设置召唤师技能
  async setSummonerSpells(spell1Id: number, spell2Id: number): Promise<void> {
    // 同时设置两个召唤师技能
    await this.makeRequest(
      'PATCH',
      `/lol-champ-select/v1/session/my-selection`,
      {
        body: {
          spell1Id: spell1Id,
          spell2Id: spell2Id,
        },
      }
    );
  }
}
