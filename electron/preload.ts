import { contextBridge, ipcRenderer } from 'electron';
import { RequestOptions } from '../src/lib/client/interface';

console.log('Preload script loaded');

// 暴露受保护的方法，允许渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // 窗口控制方法
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // LCU 相关方法
  lcuRequest: (
    method: 'GET' | 'POST',
    endpoint: string,
    options?: RequestOptions
  ) => ipcRenderer.invoke('lcu-request', method, endpoint, options),
  // Riot 相关方法
  riotRequest: (
    method: 'GET' | 'POST',
    endpoint: string,
    options?: RequestOptions
  ) => ipcRenderer.invoke('riot-request', method, endpoint, options),
  lcuBinaryRequest: (
    method: 'GET' | 'POST',
    endpoint: string,
    options?: RequestOptions
  ) => ipcRenderer.invoke('lcu-binary-request', method, endpoint, options),
  lcuIsConnected: () => ipcRenderer.invoke('lcu-is-connected'),

  // 新增：获取 LCU 凭据信息
  getLcuCredentials: () => ipcRenderer.invoke('lcu-get-credentials'),

  // 英雄选择器窗口相关方法
  openChampionSelectorWindow: () =>
    ipcRenderer.invoke('open-champion-selector-window'),
  closeChampionSelectorWindow: () =>
    ipcRenderer.invoke('close-champion-selector-window'),
});

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => Promise<void>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
      lcuRequest: (
        method: 'GET' | 'POST',
        endpoint: string,
        options?: RequestOptions
      ) => Promise<any>;
      riotRequest: (
        method: 'GET' | 'POST',
        endpoint: string,
        options?: RequestOptions
      ) => Promise<any>;
      lcuIsConnected: () => Promise<boolean>;
      // 新增类型声明
      getLcuCredentials: () => Promise<{
        port: number;
        token: string;
        region?: string;
        rsoPlatformId?: string;
        locale?: string;
        serverHost?: string;
      }>;
      // 英雄选择器窗口相关方法
      openChampionSelectorWindow: () => Promise<void>;
      closeChampionSelectorWindow: () => Promise<void>;
    };
  }
}
