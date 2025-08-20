import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { SummonerService } from '../service/summoner-service';
import { LCUClientInterface } from '../client/interface';

describe('SummonerService - Riot API', () => {
  let lcuClient: LCUClientInterface;
  let summonerService: SummonerService;

  // 测试查找玩家账户别名（Riot API）
  describe('LookupPlayerAccount - Riot API', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        summonerService = new SummonerService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过 Riot API 测试: ${error}`);
        return;
      }
    });

    it('应该能够根据游戏名称和标签查找玩家账户', async () => {
      try {
        // 查找玩家账户别名（Riot API 调用）
        const accountInfo = await summonerService.lookupPlayerAccount(
          '认真努力不放弃',
          '43614'
        );

        expect(accountInfo).toBeDefined();
        expect(accountInfo).not.toBeNull();

        // 输出账户信息
        console.log('📊 通过 Riot API 查找到的玩家账户信息:');
        console.log(`   - 返回数据:`, JSON.stringify(accountInfo, null, 2));

        console.log('✅ Riot API 查找玩家账户别名测试通过');
      } catch (error: any) {
        console.log(`⚠️ Riot API 查找玩家账户失败: ${error.message}`);
        throw error;
      }
    });
  });
});
