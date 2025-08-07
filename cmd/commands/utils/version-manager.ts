import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { resolve, join, dirname } from 'path';
import { constants } from 'fs';

/**
 * 版本管理器 - 负责缓存和获取版本信息
 */
export class VersionManager {
  private baseDir: string;
  private versionFile: string;

  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
    this.versionFile = join(this.baseDir, 'versions.json');
  }

  /**
   * 缓存版本信息到本地文件
   */
  async cacheVersions(): Promise<void> {
    console.log('正在缓存版本信息...');

    try {
      // 获取版本信息
      const response = await fetch(
        'https://ddragon.leagueoflegends.com/api/versions.json'
      );
      if (!response.ok) {
        throw new Error(`获取版本信息失败: ${response.statusText}`);
      }

      const versions: string[] = await response.json();

      // 确保基础目录存在
      await mkdir(dirname(this.versionFile), { recursive: true });

      // 保存版本文件
      await writeFile(
        this.versionFile,
        JSON.stringify(versions, null, 2),
        'utf-8'
      );

      console.log(`版本信息已缓存到: ${this.versionFile}`);
    } catch (error) {
      throw new Error(
        `缓存版本信息失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 从本地缓存获取最新版本
   */
  async getLatestVersionFromLocal(): Promise<string> {
    try {
      // 检查版本文件是否存在
      await access(this.versionFile, constants.F_OK);

      // 读取版本文件
      const data = await readFile(this.versionFile, 'utf-8');
      const versions: string[] = JSON.parse(data);

      if (versions.length === 0) {
        throw new Error('版本文件为空');
      }

      return versions[0];
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error('本地版本文件不存在，请先运行缓存命令');
      }
      throw new Error(
        `读取本地版本失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 从网络获取最新版本（不缓存）
   */
  async getLatestVersionFromNetwork(): Promise<string> {
    const response = await fetch(
      'https://ddragon.leagueoflegends.com/api/versions.json'
    );
    if (!response.ok) {
      throw new Error(`获取版本信息失败: ${response.statusText}`);
    }
    const versions: string[] = await response.json();
    return versions[0];
  }

  /**
   * 检查本地版本文件是否存在
   */
  async hasLocalVersions(): Promise<boolean> {
    try {
      await access(this.versionFile, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取版本信息（优先使用本地缓存，如果不存在则从网络获取并缓存）
   */
  async getLatestVersion(): Promise<string> {
    if (await this.hasLocalVersions()) {
      try {
        return await this.getLatestVersionFromLocal();
      } catch (error) {
        console.warn(
          '读取本地版本失败，将从网络获取:',
          error instanceof Error ? error.message : '未知错误'
        );
      }
    }

    // 如果本地版本不存在或读取失败，从网络获取并缓存
    await this.cacheVersions();
    return await this.getLatestVersionFromLocal();
  }
}
