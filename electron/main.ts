import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import log from 'electron-log';
import { LCUClient } from '../src/lib/client/lcu-client';
import { UpdateManager } from './updater';
import { RequestOptions } from '../src/lib/client/interface';
import {
  registerRank55Protocol,
  registerRank55ProtocolPrivileges,
} from './protocol-handler';
import { pinyin } from 'pinyin-pro';

// 配置日志
log.transports.file.level = 'info';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let lcuClient: LCUClient | null = null;

// 改进开发模式检测
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const isDev = !!VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development';

console.log('Electron main process started');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDev:', isDev);
console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// 存储主窗口引用
let mainWindow: BrowserWindow | null = null;
let championSelectorWindow: BrowserWindow | null = null;

// 创建更新管理器
const updateManager = new UpdateManager(isDev);

// 注册自定义协议权限
registerRank55ProtocolPrivileges();

// 获取或重新创建 LCU 客户端
async function ensureLCUClient(): Promise<LCUClient> {
  if (!lcuClient) {
    lcuClient = await LCUClient.create();
  }
  return lcuClient;
}

// 生成拼音和简写拼音
function generatePinyin(text: string): { full: string; short: string } {
  // 获取完整拼音（不带音调）
  const fullPinyin = pinyin(text, { toneType: 'none', type: 'array' }).join('');

  // 获取简写拼音（首字母）
  const shortPinyin = pinyin(text, { pattern: 'first', toneType: 'none' });

  return {
    full: fullPinyin.toLowerCase().replace(/\s+/g, ''), // 去除所有空格
    short: shortPinyin.toLowerCase().replace(/\s+/g, ''), // 去除所有空格
  };
}

// 处理英雄数据，添加拼音查询字段
function processChampionsWithPinyin(champions: any[]): any[] {
  return champions.map(champion => {
    // 生成 name 的拼音
    const namePinyin = generatePinyin(champion.name);

    // 生成 description 的拼音
    const descriptionPinyin = generatePinyin(champion.description);

    // 创建 query 字段，包含 id、name、description、alias 以及拼音
    const queryParts = [
      champion.id,
      champion.name,
      champion.description,
      champion.alias,
      namePinyin.short,
      namePinyin.full,
      descriptionPinyin.short,
      descriptionPinyin.full,
    ];

    return {
      ...champion,
      query: queryParts.join(','),
    };
  });
}

// ===== 注册所有IPC处理器 =====
// 这些必须在 app.whenReady() 之前注册

// 通用IPC处理器
ipcMain.handle('open-external', async (event, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error('Failed to open external URL:', error);
    throw error;
  }
});

// 窗口控制 IPC 处理器
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// 更新相关 IPC 处理器（保留以备需要）
ipcMain.handle('update-check', async () => {
  await updateManager.checkForUpdatesOnStartup();
});

ipcMain.handle('update-download', async () => {
  await updateManager.downloadUpdate();
});

ipcMain.handle('update-install', () => {
  updateManager.quitAndInstall();
});

ipcMain.handle('update-get-status', () => {
  return updateManager.getUpdateStatus();
});

// LCU 相关处理程序
ipcMain.handle(
  'lcu-request',
  async (
    _,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ) => {
    try {
      const client = await ensureLCUClient();
      return await client.makeRequest(method, endpoint, options);
    } catch (error) {
      console.error('LCU 请求失败:', error);
      // 如果请求失败，尝试重新初始化客户端
      lcuClient = null;
      throw error;
    }
  }
);

// Riot 相关处理程序
ipcMain.handle(
  'riot-request',
  async (
    _,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: RequestOptions
  ) => {
    try {
      const client = await ensureLCUClient();
      return await client.makeRiotRequest(method, endpoint, options);
    } catch (error) {
      console.error('Riot 请求失败:', error);
      // 如果请求失败，尝试重新初始化客户端
      lcuClient = null;
      throw error;
    }
  }
);

// LCU 二进制请求处理程序
ipcMain.handle(
  'lcu-binary-request',
  async (
    _,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: RequestOptions,
    retryCount?: number
  ) => {
    try {
      const client = await ensureLCUClient();
      return await client.makeBinaryRequest(
        method,
        endpoint,
        options,
        retryCount
      );
    } catch (error) {
      console.error('LCU 二进制请求失败:', error);
      // 如果请求失败，尝试重新初始化客户端
      lcuClient = null;
      throw error;
    }
  }
);

ipcMain.handle('lcu-is-connected', async () => {
  try {
    const client = await ensureLCUClient();
    return await client.isConnected();
  } catch (error) {
    console.error('检查 LCU 连接状态失败:', error);
    return false;
  }
});

// ===== 窗口创建函数 =====
function createWindow() {
  console.log('Creating window...');

  // 在开发环境下禁用安全警告
  if (isDev) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      webSecurity: !isDev,
      allowRunningInsecureContent: false,
    },
    show: false, // 初始时隐藏窗口，等更新检查完成后再显示
    autoHideMenuBar: true,
    // 隐藏默认标题栏
    frame: false,
    // 允许自定义标题栏区域可拖拽
    titleBarStyle: 'hidden',
  });

  console.log('Window created');
  console.log('Preload path:', join(__dirname, 'preload.js'));

  // 设置更新管理器的主窗口引用
  updateManager.setMainWindow(mainWindow);

  // 开发环境加载开发服务器，生产环境加载构建后的文件
  if (VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // 开发模式直接显示窗口
    mainWindow.show();
    // 只在开发模式下打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    // 使用正确的路径
    const indexPath = join(__dirname, '..', 'dist', 'index.html');
    console.log('Loading file:', indexPath);
    mainWindow.loadFile(indexPath);

    // 生产环境下，添加快捷键打开开发者工具
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow!.webContents.openDevTools();
        event.preventDefault();
      }
    });
  }

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 添加错误处理
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    }
  );

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

// ===== 应用生命周期 =====
app.whenReady().then(async () => {
  console.log('App ready, creating window...');

  // 注册自定义协议处理器
  registerRank55Protocol(ensureLCUClient);

  createWindow();

  // 在生产环境下，先检查更新再决定是否显示窗口
  if (!isDev) {
    console.log('生产环境，开始检查更新...');
    // 隐藏窗口直到更新检查完成
    if (mainWindow) {
      mainWindow.hide();
    }

    // 等待更新检查完成，只有在没有更新时才启动应用
    const shouldStart = await updateManager.checkForUpdatesOnStartup();

    if (shouldStart && mainWindow && !mainWindow.isVisible()) {
      console.log('没有更新，显示主窗口');
      mainWindow.show();
    } else if (!shouldStart) {
      console.log('检测到更新或发生错误，应用将不会启动');
      // 如果有更新，应用会自动重启；如果有错误，应用会退出
      // 这里不需要额外操作
    }
  } else {
    // 开发环境直接显示窗口
    if (mainWindow) {
      mainWindow.show();
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 在现有的 IPC 处理器后面添加

// LCU 凭据获取处理器
ipcMain.handle('lcu-get-credentials', async () => {
  try {
    const client = await ensureLCUClient();
    return client.getCredentials();
  } catch (error) {
    console.error('获取 LCU 凭据失败:', error);
    throw error;
  }
});

// 处理英雄数据拼音
ipcMain.handle('process-champions-pinyin', async (event, champions: any[]) => {
  try {
    console.log(`开始处理 ${champions.length} 个英雄的拼音数据...`);
    const processedChampions = processChampionsWithPinyin(champions);
    console.log(`拼音处理完成，共处理 ${processedChampions.length} 个英雄`);
    return processedChampions;
  } catch (error) {
    console.error('处理英雄拼音数据失败:', error);
    throw error;
  }
});

// 英雄选择器窗口相关处理器
ipcMain.handle(
  'open-champion-selector-window',
  async (event, position?: string, type?: 'ban' | 'pick') => {
    if (championSelectorWindow) {
      championSelectorWindow.focus();
      // 如果窗口已存在，通过IPC发送新的参数
      if (position && type) {
        championSelectorWindow.webContents.send('champion-selector-params', {
          position,
          type,
        });
      }
      return;
    }

    championSelectorWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      parent: mainWindow || undefined,
      modal: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js'),
        sandbox: false,
        webSecurity: !isDev,
        allowRunningInsecureContent: false,
      },
      autoHideMenuBar: true,
      frame: false,
      titleBarStyle: 'hidden',
    });

    // 加载英雄选择器页面
    const routePath =
      position && type
        ? `/champion-selector/${position}/${type}`
        : '/champion-selector/top/ban';

    if (VITE_DEV_SERVER_URL) {
      championSelectorWindow.loadURL(`${VITE_DEV_SERVER_URL}#${routePath}`);
    } else {
      const indexPath = join(__dirname, '..', 'dist', 'index.html');
      championSelectorWindow.loadFile(indexPath, {
        hash: routePath.substring(1),
      });
    }

    championSelectorWindow.on('closed', () => {
      // 通知主窗口窗口已关闭（使用通用事件）
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('window-closed', {
          windowType: 'champion-selector',
          windowId: 'champion-selector-window',
        });
      }
      championSelectorWindow = null;
    });

    // 窗口准备好后发送参数
    championSelectorWindow.webContents.once('did-finish-load', () => {
      if (position && type) {
        championSelectorWindow?.webContents.send('champion-selector-params', {
          position,
          type,
        });
      }
    });

    championSelectorWindow.show();
  }
);

ipcMain.handle('close-champion-selector-window', () => {
  if (championSelectorWindow) {
    championSelectorWindow.close();
    championSelectorWindow = null;
  }
});
