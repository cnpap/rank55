/// <reference types="vite/client" />

import { LCUCredentials } from './types/lcu';

declare global {
  interface Window {
    runtime: {
      WindowMinimise: () => void;
      WindowToggleMaximise: () => void;
      Quit: () => void;
    };
    electronAPI: {
      openExternal: (url: string) => Promise<void>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
      // 新增 LCU 相关方法
      lcuRequest: (
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        endpoint: string,
        options: RequestOptions = {}
      ) => Promise<any>;
      riotRequest: (
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        endpoint: string,
        options: RequestOptions = {}
      ) => Promise<any>;
      lcuBinaryRequest: (
        method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        endpoint: string,
        options: RequestOptions = {},
        retryCount?: number
      ) => Promise<Buffer>;
      lcuIsConnected: () => Promise<boolean>;
      // 新增：获取 LCU 凭据信息
      getLcuCredentials: () => Promise<LCUCredentials>;
      // 英雄选择器窗口相关方法
      openChampionSelectorWindow: (
        position?: string,
        type?: 'ban' | 'pick'
      ) => Promise<void>;
      onChampionSelectorParams: (
        callback: (params: { position: string; type: 'ban' | 'pick' }) => void
      ) => void;
      removeChampionSelectorParamsListener: () => void;
      closeChampionSelectorWindow: () => Promise<void>;
      // 监听英雄选择器窗口关闭事件
      // 通用窗口关闭事件监听
      onWindowClosed: (
        callback: (
          event: any,
          data: { windowType: string; windowId: string }
        ) => void
      ) => void;
      removeWindowClosedListener: (
        callback: (
          event: any,
          data: { windowType: string; windowId: string }
        ) => void
      ) => void;
    };
  }
}

export {};

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
