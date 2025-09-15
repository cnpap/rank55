import { Position } from '@/lib/service/opgg/types';

export interface Spell {
  id: number;
  name: string;
  description: string;
  summonerLevel: number;
  cooldown: number;
  gameModes: string[];
  iconPath: string;
}

export type LolGameDataSpell = Spell[];

export interface Style {
  id: number;
  name: string;
  tooltip: string;
  iconPath: string;
}

export interface LolGameDataPerk {
  schemaVersion: number;
  styles: Style[];
}

export interface Item {
  id: number;
  name: string;
  description: string;
  active: boolean;
  inStore: boolean;
  from: number[];
  to: number[];
  categories: string[];
  maxStacks: number;
  requiredChampion: string;
  requiredAlly: string;
  requiredBuffCurrencyName: string;
  requiredBuffCurrencyCost: number;
  specialRecipe: number;
  isEnchantment: boolean;
  price: number;
  priceTotal: number;
  displayInItemSets: boolean;
  iconPath: string;
}

export type LolGameDataItems = Item[];

export interface ChampionSummary {
  id: number;
  name: string;
  description: string;
  query: string;
  alias: string;
  contentId: string;
  squarePortraitPath: string;
  positions: Position[];
  roles: string[];
}

export type LolGameDataChampionSummary = ChampionSummary[];
