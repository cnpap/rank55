import { LCUClientInterface } from './client/interface';
import { LCUClient } from './client/lcu-client';
import { SummonerService } from './service/summoner-service';

export async function createLCUClient() {
  return await LCUClient.create();
}

export function createSummonerService(client: LCUClientInterface) {
  return new SummonerService(client);
}
