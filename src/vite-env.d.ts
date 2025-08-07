/// <reference types="vite/client" />

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
        body?: any
      ) => Promise<any>;
      lcuIsConnected: () => Promise<boolean>;
    };
  }
}

export {};

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
