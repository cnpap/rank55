import { protocol } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile } from 'fs/promises';
import { LCUClient } from '../src/lib/client/lcu-client';
import { BaseService } from '../src/lib/service/base-service';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 协议处理服务类
 * 负责处理 rank55:// 自定义协议的请求
 */
class ProtocolHandlerService extends BaseService {
  constructor(client: LCUClient) {
    super(client);
  }

  /**
   * 处理 LOL 游戏数据资源请求
   * @param fullPath 完整的请求路径
   * @returns Promise<Response | null> 返回响应或 null（表示不匹配）
   */
  async handleLolGameDataRequest(fullPath: string): Promise<Response | null> {
    if (!fullPath.startsWith('/lol-game-data/assets/v1/')) {
      return null;
    }

    try {
      // 直接使用 BaseService 的 makeBinaryRequest 方法
      const buffer = await this.makeBinaryRequest('GET', fullPath);

      // 根据路径推断 MIME 类型
      let mimeType = 'application/octet-stream';
      if (fullPath.includes('.jpg') || fullPath.includes('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (fullPath.includes('.png')) {
        mimeType = 'image/png';
      } else if (fullPath.includes('.gif')) {
        mimeType = 'image/gif';
      } else if (fullPath.includes('.svg')) {
        mimeType = 'image/svg+xml';
      }

      return new Response(buffer, {
        headers: { 'Content-Type': mimeType },
      });
    } catch (error) {
      console.error('LCU API request failed:', error);
      return new Response(null, { status: 404 });
    }
  }

  /**
   * 处理本地文件请求
   * @param pathname 文件路径
   * @returns Promise<Response> 返回响应
   */
  async handleLocalFileRequest(pathname: string): Promise<Response> {
    const filePath = join(__dirname, '..', pathname);
    console.log('resolved file path:', filePath);

    try {
      const fileBuffer = await readFile(filePath);

      // 根据文件扩展名确定 MIME 类型
      const ext = pathname.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';

      switch (ext) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'svg':
          mimeType = 'image/svg+xml';
          break;
      }

      return new Response(fileBuffer, {
        headers: { 'Content-Type': mimeType },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return new Response(null, { status: 404 });
    }
  }
}

/**
 * 注册 rank55:// 协议处理器
 * @param ensureLCUClient 获取 LCU 客户端的函数
 */
export function registerRank55Protocol(
  ensureLCUClient: () => Promise<LCUClient>
): void {
  protocol.handle('rank55', async request => {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      const pathname = url.pathname;

      console.log('rank55 protocol request:', request.url);
      console.log('hostname:', hostname);
      console.log('pathname:', pathname);

      // 构建完整路径
      const fullPath = hostname ? `/${hostname}${pathname}` : pathname;
      console.log('fullPath:', fullPath);

      // 检查是否是 LOL 游戏数据资源请求
      if (fullPath.startsWith('/lol-game-data/')) {
        // 确保 LCU 客户端已连接
        const client = await ensureLCUClient();
        const protocolHandler = new ProtocolHandlerService(client);

        const response =
          await protocolHandler.handleLolGameDataRequest(fullPath);
        if (response) {
          return response;
        }

        // 如果路径不匹配，返回 404
        return new Response(null, { status: 404 });
      } else {
        // 处理本地文件请求
        const client = await ensureLCUClient();
        const protocolHandler = new ProtocolHandlerService(client);

        return await protocolHandler.handleLocalFileRequest(pathname);
      }
    } catch (error) {
      console.error('rank55 protocol error:', error);
      return new Response(null, { status: 500 });
    }
  });
}

/**
 * 注册协议权限
 */
export function registerRank55ProtocolPrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'rank55',
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);
}
