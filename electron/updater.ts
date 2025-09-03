import { app, BrowserWindow, dialog } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import log from 'electron-log';

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseName?: string;
  releaseDate?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond?: number;
}

export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null;
  private updateWindow: BrowserWindow | null = null;
  private isDev: boolean;
  private updateStatus: UpdateStatus = 'not-available';
  private updateInfo: UpdateInfo | null = null;
  private downloadProgress: UpdateProgress | null = null;
  private isUpdating = false;
  private shouldAllowAppStart = false;

  constructor(isDev: boolean) {
    this.isDev = isDev;
    this.setupAutoUpdater();
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  // 创建更新进度窗口 - 修复菜单栏和高度问题
  private createUpdateWindow() {
    if (this.updateWindow) {
      this.updateWindow.focus();
      return;
    }

    this.updateWindow = new BrowserWindow({
      width: 400,
      height: 200, // 增加高度
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: true,
      alwaysOnTop: false,
      frame: false, // 移除标题栏和菜单栏
      autoHideMenuBar: true, // 隐藏菜单栏
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // 简化的HTML内容 - 调整高度和布局
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 160px; /* 调整高度 */
          }
          .title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 15px;
            text-align: center;
            color: #2563eb;
          }
          .progress-container {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            overflow: hidden;
            margin-bottom: 12px;
          }
          .progress-bar {
            height: 100%;
            background: #2563eb;
            width: 0%;
            transition: width 0.3s ease;
          }
          .progress-text {
            font-size: 13px;
            color: #6b7280;
            text-align: center;
            margin-bottom: 8px;
          }
          .speed-text {
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
            margin-bottom: 12px;
          }
          .actions {
            text-align: center;
          }
          .btn {
            padding: 8px 16px;
            margin: 0 5px;
            border: 1px solid #d1d5db;
            background: white;
            cursor: pointer;
            font-size: 12px;
          }
          .btn:hover {
            background: #f9fafb;
          }
          .close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            border: none;
            background: #ef4444;
            color: white;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .close-btn:hover {
            background: #dc2626;
          }
        </style>
      </head>
      <body>
        <button class="close-btn" onclick="window.close()">×</button>
        <div class="title">正在下载更新...</div>
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <div class="progress-text" id="progressText">准备下载...</div>
        <div class="speed-text" id="speedText"></div>
        <div class="actions">
          <button class="btn" onclick="window.close()">后台下载</button>
        </div>
      </body>
      </html>
    `;

    this.updateWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );
    this.updateWindow.show();

    this.updateWindow.on('closed', () => {
      this.updateWindow = null;
    });
  }

  // 更新进度窗口内容
  private updateProgressWindow(progress: UpdateProgress) {
    if (!this.updateWindow) return;

    const percent = Math.round(progress.percent);
    const transferred = this.formatBytes(progress.transferred);
    const total = this.formatBytes(progress.total);
    const speed = progress.bytesPerSecond
      ? this.formatBytes(progress.bytesPerSecond) + '/s'
      : '';

    this.updateWindow.webContents.executeJavaScript(`
      document.getElementById('progressBar').style.width = '${percent}%';
      document.getElementById('progressText').textContent = '${percent}% (${transferred} / ${total})';
      document.getElementById('speedText').textContent = '下载速度: ${speed}';
    `);
  }

  // 格式化字节数
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private setupAutoUpdater() {
    if (this.isDev) return;

    // 配置自动更新器 - 使用 US3
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://rank55.com/',
      channel: 'latest',
      updaterCacheDirName: 'lol-frontend-updater',
    });

    // 优化下载配置
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    // 配置代理和网络优化
    this.configureNetworkOptimization();

    // 更新事件处理
    autoUpdater.on('checking-for-update', () => {
      log.info('正在检查更新...');
      this.updateStatus = 'checking';
      this.shouldAllowAppStart = false;
    });

    autoUpdater.on('update-available', info => {
      log.info('发现新版本:', info.version);
      log.info('更新包大小:', this.formatBytes(info.files?.[0]?.size || 0));
      this.updateStatus = 'available';
      this.shouldAllowAppStart = false; // 发现更新时不允许启动
      this.updateInfo = {
        version: info.version,
        releaseNotes: info.releaseNotes?.toString(),
        releaseName: info.releaseName || undefined,
        releaseDate: info.releaseDate,
      };

      // 强制下载更新，不给用户选择
      log.info('强制下载更新...');
      this.createUpdateWindow();
      autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-not-available', info => {
      log.info('当前已是最新版本:', info.version);
      this.updateStatus = 'not-available';
      this.shouldAllowAppStart = true;
      this.allowAppToStart();
    });

    autoUpdater.on('error', err => {
      log.error('更新检查失败:', err);
      this.updateStatus = 'error';
      this.shouldAllowAppStart = false; // 检查失败时不允许启动

      // 关闭更新窗口
      if (this.updateWindow) {
        this.updateWindow.close();
      }

      // 分析错误原因并显示详细信息
      let errorMessage = '未知错误';
      let errorDetail = err.message;

      if (
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNREFUSED')
      ) {
        errorMessage = '网络连接失败';
        errorDetail = '无法连接到 UCloud US3 更新服务器，请检查网络连接';
      } else if (err.message.includes('ETIMEDOUT')) {
        errorMessage = '连接超时';
        errorDetail = '连接 UCloud US3 更新服务器超时，请稍后重试';
      } else if (err.message.includes('CERT') || err.message.includes('SSL')) {
        errorMessage = 'SSL证书错误';
        errorDetail = 'UCloud US3 服务器证书验证失败';
      } else if (err.message.includes('404')) {
        errorMessage = '更新文件不存在';
        errorDetail = 'UCloud US3 服务器上找不到更新文件';
      } else if (err.message.includes('403')) {
        errorMessage = '访问被拒绝';
        errorDetail = '没有权限访问 UCloud US3 更新服务器';
      }

      // 更新失败时，强制退出应用
      dialog.showMessageBoxSync({
        type: 'error',
        title: '更新检查失败',
        message: `${errorMessage}，应用将退出`,
        detail: `错误详情：${errorDetail}\n\n请检查网络连接后重新启动应用`,
        buttons: ['确定'],
        defaultId: 0,
      });

      log.error('更新检查失败，应用退出');
      app.quit();
    });

    autoUpdater.on('download-progress', progressObj => {
      this.updateStatus = 'downloading';
      this.downloadProgress = {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      };

      // 更新进度窗口
      this.updateProgressWindow(this.downloadProgress);

      const percent = Math.round(progressObj.percent);
      const speed = progressObj.bytesPerSecond
        ? this.formatBytes(progressObj.bytesPerSecond) + '/s'
        : '';
      log.info(
        `下载进度: ${percent}%, 速度: ${speed}, 已下载: ${this.formatBytes(progressObj.transferred)}/${this.formatBytes(progressObj.total)}`
      );
    });

    autoUpdater.on('update-downloaded', info => {
      log.info('更新下载完成:', info.version);
      this.updateStatus = 'downloaded';

      // 关闭更新窗口
      if (this.updateWindow) {
        this.updateWindow.close();
      }

      // 下载完成后，强制重启安装
      dialog.showMessageBoxSync({
        type: 'info',
        title: '更新下载完成',
        message: `新版本 ${info.version} 已下载完成`,
        detail: '应用将立即重启以安装更新',
        buttons: ['确定'],
        defaultId: 0,
      });

      // 强制重启安装
      autoUpdater.quitAndInstall(false, true);
    });
  }

  // 配置网络优化
  private configureNetworkOptimization() {
    // 设置请求超时和重试
    autoUpdater.requestHeaders = {
      'Cache-Control': 'no-cache',
      'User-Agent': `${app.getName()}/${app.getVersion()}`,
    };
  }

  private allowAppToStart() {
    this.isUpdating = false;
    // 关闭更新窗口
    if (this.updateWindow) {
      this.updateWindow.close();
    }
    // 如果有主窗口，确保它可见
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  async checkForUpdatesOnStartup(): Promise<boolean> {
    if (this.isDev) {
      log.info('开发模式，跳过更新检查');
      return true;
    }

    try {
      log.info('启动时检查更新...');
      this.shouldAllowAppStart = false;

      // 创建Promise来等待更新检查结果
      const updateCheckPromise = new Promise<boolean>(resolve => {
        let resolved = false;

        // 设置事件监听器来处理更新检查结果
        const handleUpdateNotAvailable = () => {
          if (!resolved) {
            resolved = true;
            log.info('确认无更新，允许应用启动');
            this.shouldAllowAppStart = true;
            resolve(true);
          }
        };

        const handleUpdateAvailable = () => {
          if (!resolved) {
            resolved = true;
            log.info('发现更新，阻止应用启动');
            resolve(false);
          }
        };

        const handleError = (error: Error) => {
          if (!resolved) {
            resolved = true;
            log.error('更新检查失败:', error);
            this.updateStatus = 'error';

            dialog.showMessageBoxSync({
              type: 'error',
              title: '更新检查失败',
              message: '更新检查失败，应用将退出',
              detail: error.message,
              buttons: ['确定'],
              defaultId: 0,
            });

            app.quit();
            resolve(false);
          }
        };

        // 临时事件监听器
        autoUpdater.once('update-not-available', handleUpdateNotAvailable);
        autoUpdater.once('update-available', handleUpdateAvailable);
        autoUpdater.once('error', handleError);

        // 设置超时
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            log.error('更新检查超时，应用将退出');

            // 移除事件监听器
            autoUpdater.removeListener(
              'update-not-available',
              handleUpdateNotAvailable
            );
            autoUpdater.removeListener(
              'update-available',
              handleUpdateAvailable
            );
            autoUpdater.removeListener('error', handleError);

            dialog.showMessageBoxSync({
              type: 'error',
              title: '更新检查超时',
              message: '更新检查超时，应用将退出',
              detail: '请检查网络连接后重新启动应用',
              buttons: ['确定'],
              defaultId: 0,
            });

            app.quit();
            resolve(false);
          }
        }, 15000);
      });

      // 开始检查更新
      await autoUpdater.checkForUpdatesAndNotify();

      // 等待更新检查结果
      return await updateCheckPromise;
    } catch (error) {
      log.error('启动时更新检查失败:', error);
      this.updateStatus = 'error';

      dialog.showMessageBoxSync({
        type: 'error',
        title: '更新检查失败',
        message: '更新检查失败，应用将退出',
        detail: error instanceof Error ? error.message : '未知错误',
        buttons: ['确定'],
        defaultId: 0,
      });

      app.quit();
      return false;
    }
  }

  shouldAllowAppToStart(): boolean {
    return this.shouldAllowAppStart;
  }

  async downloadUpdate(): Promise<void> {
    if (this.isDev || this.updateStatus !== 'available') return;

    try {
      this.createUpdateWindow();
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('下载更新失败:', error);
      this.updateStatus = 'error';
    }
  }

  quitAndInstall(): void {
    if (this.isDev || this.updateStatus !== 'downloaded') return;

    log.info('用户确认安装更新，重启应用...');
    autoUpdater.quitAndInstall(false, true);
  }

  getUpdateStatus() {
    return {
      status: this.updateStatus,
      updateInfo: this.updateInfo,
      progress: this.downloadProgress,
    };
  }
}
