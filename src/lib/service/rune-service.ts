import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

export class RuneService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 获取当前天赋页面列表
  async getRunePages(): Promise<any[]> {
    return this.makeRequest('GET', '/lol-perks/v1/pages');
  }

  // 获取当前选中的天赋页面
  async getCurrentRunePage(): Promise<any> {
    return this.makeRequest('GET', '/lol-perks/v1/currentpage');
  }

  // 根据ID获取特定天赋页面
  async getRunePageById(pageId: number): Promise<any> {
    return this.makeRequest('GET', `/lol-perks/v1/pages/${pageId}`);
  }

  // 创建新的天赋页面
  async createRunePage(runePage: any): Promise<any> {
    return this.makeRequest('POST', '/lol-perks/v1/pages', runePage);
  }

  // 更新天赋页面
  async updateRunePage(pageId: number, runePage: any): Promise<any> {
    return this.makeRequest('PUT', `/lol-perks/v1/pages/${pageId}`, runePage);
  }

  // 删除天赋页面
  async deleteRunePage(pageId: number): Promise<void> {
    return this.makeRequest('DELETE', `/lol-perks/v1/pages/${pageId}`);
  }

  // 设置当前天赋页面
  async setCurrentRunePage(pageId: number): Promise<void> {
    return this.makeRequest('PUT', '/lol-perks/v1/currentpage', { id: pageId });
  }

  // 获取所有可用的天赋数据
  async getAvailableRunes(): Promise<any[]> {
    return this.makeRequest('GET', '/lol-perks/v1/perks');
  }

  // 获取天赋样式（天赋系）
  async getRuneStyles(): Promise<any[]> {
    return this.makeRequest('GET', '/lol-perks/v1/styles');
  }

  // 验证天赋页面配置是否有效
  async validateRunePage(runePage: any): Promise<any> {
    return this.makeRequest('POST', '/lol-perks/v1/pages/validate', runePage);
  }

  // 获取推荐天赋配置（基于英雄和位置）
  async getRecommendedRunes(
    championId: number,
    position?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('championId', championId.toString());
    if (position) {
      params.append('position', position);
    }
    return this.makeRequest(
      'GET',
      `/lol-perks/v1/recommended-pages-map?${params.toString()}`
    );
  }

  // 快速设置天赋页面（创建或更新）
  async setRunePage(
    name: string,
    primaryStyleId: number,
    subStyleId: number,
    selectedPerkIds: number[]
  ): Promise<any> {
    const runePage = {
      name,
      primaryStyleId,
      subStyleId,
      selectedPerkIds,
      current: true,
    };

    // 先尝试获取当前页面，如果存在则更新，否则创建新的
    try {
      const currentPage = await this.getCurrentRunePage();
      if (currentPage && currentPage.id) {
        return this.updateRunePage(currentPage.id, runePage);
      }
    } catch (error) {
      // 如果获取当前页面失败，直接创建新页面
    }

    return this.createRunePage(runePage);
  }

  // 复制天赋页面
  async duplicateRunePage(pageId: number, newName?: string): Promise<any> {
    const originalPage = await this.getRunePageById(pageId);
    const duplicatedPage = {
      ...originalPage,
      name: newName || `${originalPage.name} - 副本`,
      current: false,
    };
    delete duplicatedPage.id; // 移除ID，让服务器分配新的ID
    return this.createRunePage(duplicatedPage);
  }

  // 重置天赋页面为默认配置
  async resetRunePageToDefault(pageId: number): Promise<any> {
    // 获取默认天赋配置（通常是第一个天赋系的基础配置）
    const styles = await this.getRuneStyles();
    if (styles.length === 0) {
      throw new Error('无法获取天赋系数据');
    }

    const primaryStyle = styles[0];
    const subStyle = styles[1] || styles[0];

    // 构建基础天赋配置（选择每个槽位的第一个天赋）
    const selectedPerkIds: number[] = [];

    // 主要天赋系的天赋选择
    if (primaryStyle.slots) {
      primaryStyle.slots.forEach((slot: any) => {
        if (slot.perks && slot.perks.length > 0) {
          selectedPerkIds.push(slot.perks[0].id);
        }
      });
    }

    // 次要天赋系的天赋选择（通常选择前两个槽位）
    if (subStyle.slots && subStyle.slots.length >= 2) {
      for (let i = 0; i < 2; i++) {
        if (subStyle.slots[i].perks && subStyle.slots[i].perks.length > 0) {
          selectedPerkIds.push(subStyle.slots[i].perks[0].id);
        }
      }
    }

    const defaultRunePage = {
      name: '默认天赋',
      primaryStyleId: primaryStyle.id,
      subStyleId: subStyle.id,
      selectedPerkIds,
      current: true,
    };

    return this.updateRunePage(pageId, defaultRunePage);
  }
}
