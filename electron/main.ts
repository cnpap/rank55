import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import log from 'electron-log';
import { LCUClient } from '../src/lib/client/lcu-client';
import { UpdateManager } from './updater';

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

// 创建更新管理器
const updateManager = new UpdateManager(isDev);

// 获取或重新创建 LCU 客户端
async function ensureLCUClient(): Promise<LCUClient> {
  if (!lcuClient) {
    lcuClient = await LCUClient.create();
  }
  return lcuClient;
}

// 初始化 LCU 客户端
async function initializeLCUClient() {
  try {
    lcuClient = await LCUClient.create();
    console.log('LCU 客户端初始化成功');
  } catch (error) {
    console.log('LCU 客户端初始化失败:', error);
    lcuClient = null;
  }
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
    body?: any
  ) => {
    try {
      const client = await ensureLCUClient();

      if (method === 'GET') {
        return await client.get(endpoint);
      } else if (method === 'POST') {
        return await client.post(endpoint, body);
      } else if (method === 'PATCH') {
        return await client.patch(endpoint, body);
      } else if (method === 'DELETE') {
        return await client.delete(endpoint);
      }
    } catch (error) {
      console.error('LCU 请求失败:', error);
      // 如果请求失败，尝试重新初始化客户端
      lcuClient = null;
      throw error;
    }
  }
);

ipcMain.handle('lcu-is-connected', async () => {
  try {
    if (!lcuClient) {
      await initializeLCUClient();
    }

    if (lcuClient) {
      return await lcuClient.isConnected();
    }

    return false;
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
  createWindow();

  // 尝试初始化 LCU 客户端
  initializeLCUClient();

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
