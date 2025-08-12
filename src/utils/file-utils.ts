import { Champion } from '@/types/champion';

// 动态导入 Node.js 模块
async function getNodeModules() {
  if (typeof window !== 'undefined') {
    throw new Error('File operations are not available in browser environment');
  }

  const fs = await import('fs/promises');
  const fsSync = await import('fs');
  const path = await import('path');

  return { fs, fsSync, path };
}

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const { fs, fsSync } = await getNodeModules();
    await fs.access(filePath, fsSync.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * 下载图片文件
 */
export async function downloadImage(
  url: string,
  savePath: string
): Promise<void> {
  const { fs } = await getNodeModules();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(savePath, new Uint8Array(buffer));
}

/**
 * 获取英雄列表数据（优先从本地读取）
 */
export async function getChampionList(
  version: string,
  dataDir: string
): Promise<Champion> {
  const { fs, path } = await getNodeModules();

  const localPath = path.join(dataDir, 'champion.json');
  if (await fileExists(localPath)) {
    console.log('从本地读取英雄列表...');
    const data = await fs.readFile(localPath, 'utf-8');
    return JSON.parse(data);
  }

  console.log('从网络获取英雄列表...');
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取英雄列表失败: ${response.statusText}`);
  }
  return response.json();
}
