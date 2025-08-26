import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

/**
 * 静态资源访问服务
 * 提供访问 LOL 客户端静态资源的方法，仅支持玩家头像和英雄头像
 */
export class AssetService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  /**
   * 获取玩家头像
   * @param profileIconId 头像ID
   * @returns Promise<Buffer> 返回图片二进制数据
   */
  async getProfileIcon(profileIconId: number): Promise<Buffer> {
    return this.makeBinaryRequest(
      'GET',
      `/lol-game-data/assets/v1/profile-icons/${profileIconId}.jpg`
    );
  }

  /**
   * 获取英雄头像
   * @param championId 英雄ID
   * @returns Promise<Buffer> 返回图片二进制数据
   */
  async getChampionIcon(championId: number): Promise<Buffer> {
    return this.makeBinaryRequest(
      'GET',
      `/lol-game-data/assets/v1/champion-icons/${championId}.png`
    );
  }

  /**
   * 将Buffer转换为Base64数据URL
   * @param buffer 图片Buffer数据
   * @param mimeType MIME类型，如 'image/jpeg', 'image/png'
   * @returns string Base64数据URL
   */
  static bufferToDataUrl(
    buffer: Buffer,
    mimeType: string = 'image/jpeg'
  ): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }
}
