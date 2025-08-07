import { access, readFile, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { Champion } from '@/types/champion';

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败: HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await writeFile(savePath, new Uint8Array(buffer));
}

/**
 * 获取英雄列表数据（优先从本地读取）
 */
export async function getChampionList(
  version: string,
  dataDir: string
): Promise<Champion> {
  const localPath = join(dataDir, 'champion.json');
  if (await fileExists(localPath)) {
    console.log('从本地读取英雄列表...');
    const data = await readFile(localPath, 'utf-8');
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
