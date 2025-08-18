import { contextBridge, ipcRenderer } from 'electron';

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
  lcuRequest: (method: 'GET' | 'POST', endpoint: string, body?: any) =>
    ipcRenderer.invoke('lcu-request', method, endpoint, body),
  lcuIsConnected: () => ipcRenderer.invoke('lcu-is-connected'),

  // 新增：获取 LCU 凭据信息
  getLcuCredentials: () => ipcRenderer.invoke('lcu-get-credentials'),
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
        body?: any
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
    };
  }
}
