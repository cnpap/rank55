import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { LCUClientInterface, RequestOptions } from './interface';
import { LCUCredentials } from '@/types/lcu';

const execAsync = promisify(exec);

// LCU客户端实现
export class LCUClient implements LCUClientInterface {
  private baseURL: string;
  private authToken: string;
  private port: number;
  private maxRetries: number = 2;
  private retryDelay: number = 1000;
  // 新增服务器参数缓存
  private region: string;
  private rsoPlatformId: string;
  private locale: string;
  private serverHost: string;
  // 新增 Riot Client 参数缓存
  private riotClientPort: number;
  private riotClientAuthToken: string;

  constructor(credentials: LCUCredentials) {
    this.port = credentials.port;
    this.authToken = credentials.token;
    this.baseURL = `https://127.0.0.1:${credentials.port}`;
    this.region = credentials.region;
    this.rsoPlatformId = credentials.rsoPlatformId;
    this.locale = credentials.locale;
    this.serverHost = credentials.serverHost;
    // 缓存新增参数
    this.riotClientPort = credentials.riotClientPort;
    this.riotClientAuthToken = credentials.riotClientAuthToken;
  }

  // 创建新的LCU客户端
  static async create(): Promise<LCUClient> {
    const credentials = await this.getLCUCredentials();
    return new LCUClient(credentials);
  }

  // 刷新LCU凭据
  private async refreshCredentials(): Promise<void> {
    try {
      const credentials = await LCUClient.getLCUCredentials();
      this.port = credentials.port;
      this.authToken = credentials.token;
      this.baseURL = `https://127.0.0.1:${credentials.port}`;
      this.region = credentials.region;
      this.rsoPlatformId = credentials.rsoPlatformId;
      this.locale = credentials.locale;
      this.serverHost = credentials.serverHost;
      // 更新新增参数
      this.riotClientPort = credentials.riotClientPort;
      this.riotClientAuthToken = credentials.riotClientAuthToken;
    } catch (error) {
      throw new Error(`刷新凭据失败: ${error}`);
    }
  }

  // 延迟工具函数
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 执行系统命令
  private static async executeCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(command);
      return stdout;
    } catch (error) {
      throw new Error(`执行命令失败: ${error}`);
    }
  }

  // 从LOL客户端进程中获取API凭据
  private static async getLCUCredentials(): Promise<LCUCredentials> {
    try {
      // 在Windows上查找LeagueClientUx.exe进程
      const cmdOutput = await this.executeCommand(
        'wmic PROCESS WHERE "name=\'LeagueClientUx.exe\'" GET commandline /format:list'
      );

      // 检查是否找到了进程
      if (!cmdOutput.includes('LeagueClientUx.exe')) {
        throw new Error('LOL客户端未运行或无法找到LeagueClientUx.exe进程');
      }

      // 解析命令行参数
      const portRegex = /--app-port=(\d+)/;
      const tokenRegex = /--remoting-auth-token=([\w-]+)/;
      const regionRegex = /--region=([\w_]+)/;
      const rsoPlatformIdRegex = /--rso_platform_id=([\w_]+)/;
      const localeRegex = /--locale=([\w_]+)/;
      const serverHostRegex = /--t\.lcdshost=([\w.-]+)/;
      // 新增正则表达式
      const riotClientPortRegex = /--riotclient-app-port=([0-9]+)/;
      const riotClientAuthRegex = /--riotclient-auth-token=([\w-_]+)/;

      console.log('命令行参数:', cmdOutput);

      const portMatch = cmdOutput.match(portRegex);
      const tokenMatch = cmdOutput.match(tokenRegex);
      const regionMatch = cmdOutput.match(regionRegex);
      const rsoPlatformIdMatch = cmdOutput.match(rsoPlatformIdRegex);
      const localeMatch = cmdOutput.match(localeRegex);
      const serverHostMatch = cmdOutput.match(serverHostRegex);
      // 新增参数匹配
      const riotClientPortMatch = cmdOutput.match(riotClientPortRegex);
      const riotClientAuthMatch = cmdOutput.match(riotClientAuthRegex);

      if (!portMatch || !tokenMatch) {
        throw new Error(
          '无法从LOL客户端进程中提取API凭据，请确保LOL客户端正在运行'
        );
      }

      const port = parseInt(portMatch[1], 10);
      if (isNaN(port)) {
        throw new Error('解析端口号失败');
      }

      // 解析 Riot Client 端口
      const riotClientPort = riotClientPortMatch
        ? parseInt(riotClientPortMatch[1], 10)
        : undefined;
      if (riotClientPortMatch && isNaN(riotClientPort!)) {
        console.warn('解析 Riot Client 端口号失败');
      }

      const credentials: LCUCredentials = {
        port,
        token: tokenMatch[1],
        region: regionMatch![1],
        rsoPlatformId: rsoPlatformIdMatch![1],
        locale: localeMatch![1],
        serverHost: serverHostMatch![1],
        // 新增参数
        riotClientPort: riotClientPort!,
        riotClientAuthToken: riotClientAuthMatch![1],
      };

      console.log('提取的服务器参数:', {
        port: credentials.port,
        region: credentials.region,
        rsoPlatformId: credentials.rsoPlatformId,
        locale: credentials.locale,
        serverHost: credentials.serverHost,
        // 新增日志输出
        riotClientPort: credentials.riotClientPort,
        riotClientAuthToken: credentials.riotClientAuthToken,
      });

      return credentials;
    } catch (error) {
      throw new Error(`获取LCU凭据失败: ${error}`);
    }
  }

  // 通用的HTTP请求方法（抽象出来的核心逻辑）
  private async makeHttpRequest(
    method: string,
    baseUrl: string,
    endpoint: string,
    authToken: string,
    options: RequestOptions = {},
    retryCount: number = 0,
    isRiotApi: boolean = false,
    expectBinary: boolean = false // 新增参数
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // 处理查询参数
      let finalEndpoint = endpoint;
      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        const queryString = searchParams.toString();
        if (queryString) {
          finalEndpoint += (endpoint.includes('?') ? '&' : '?') + queryString;
        }
      }

      const url = new URL(baseUrl + finalEndpoint);
      const requestOptions: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`riot:${authToken}`).toString('base64')}`,
          ...options.headers,
        },
        rejectUnauthorized: false,
      };

      const req = https.request(requestOptions, res => {
        const chunks: Buffer[] = [];
        let data = '';

        res.on('data', chunk => {
          if (expectBinary) {
            chunks.push(chunk);
          } else {
            data += chunk;
          }
        });

        res.on('end', async () => {
          if (
            res.statusCode &&
            (res.statusCode === 401 || res.statusCode === 403) &&
            retryCount < this.maxRetries
          ) {
            try {
              console.log(
                `认证失败，尝试刷新凭据并重试 (${retryCount + 1}/${this.maxRetries})`
              );
              await this.delay(this.retryDelay);
              await this.refreshCredentials();
              const result = await this.makeHttpRequest(
                method,
                baseUrl,
                finalEndpoint,
                isRiotApi ? this.riotClientAuthToken : this.authToken,
                options,
                retryCount + 1,
                isRiotApi,
                expectBinary
              );
              resolve(result);
              return;
            } catch (refreshError) {
              reject(new Error(`刷新凭据后重试失败: ${refreshError}`));
              return;
            }
          }

          if (res.statusCode && res.statusCode >= 400) {
            const errorData = expectBinary
              ? Buffer.concat(chunks).toString()
              : data;
            reject(
              new Error(
                `API请求失败，状态码: ${res.statusCode}, 响应: ${errorData}`
              )
            );
            return;
          }

          try {
            if (expectBinary) {
              const result = Buffer.concat(chunks);
              resolve(result);
            } else {
              const result = data ? JSON.parse(data) : null;
              resolve(result);
            }
          } catch (error) {
            if (expectBinary) {
              reject(new Error(`处理二进制响应失败: ${error}`));
            } else {
              reject(new Error(`解析响应失败: ${error}`));
            }
          }
        });
      });

      req.on('error', async (error: any) => {
        if (
          (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') &&
          retryCount < this.maxRetries
        ) {
          try {
            console.log(
              `连接失败，尝试刷新凭据并重试 (${retryCount + 1}/${this.maxRetries})`
            );
            await this.delay(this.retryDelay);
            await this.refreshCredentials();
            const result = await this.makeHttpRequest(
              method,
              baseUrl,
              finalEndpoint,
              isRiotApi ? this.riotClientAuthToken : this.authToken,
              options,
              retryCount + 1,
              isRiotApi,
              expectBinary
            );
            resolve(result);
            return;
          } catch (refreshError) {
            reject(new Error(`刷新凭据后重试失败: ${refreshError}`));
            return;
          }
        }
        reject(new Error(`发送请求失败: ${error}`));
      });

      // 发送请求体
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // 重构现有的 makeRequest 方法
  async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {},
    retryCount: number = 0
  ): Promise<T> {
    return this.makeHttpRequest(
      method,
      this.baseURL,
      endpoint,
      this.authToken,
      options,
      retryCount,
      false,
      false // 不期望二进制响应
    );
  }

  // 新增：二进制请求方法
  async makeBinaryRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {},
    retryCount: number = 0
  ): Promise<Buffer> {
    return this.makeHttpRequest(
      method,
      this.baseURL,
      endpoint,
      this.authToken,
      options,
      retryCount,
      false,
      true // 期望二进制响应
    );
  }

  // 重构现有的 makeRiotRequest 方法
  async makeRiotRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {},
    retryCount: number = 0
  ): Promise<T> {
    const riotBaseURL = `https://127.0.0.1:${this.riotClientPort}`;
    return this.makeHttpRequest(
      method,
      riotBaseURL,
      endpoint,
      this.riotClientAuthToken,
      options,
      retryCount,
      true,
      false // 不期望二进制响应
    );
  }

  async patchRiot<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRiotRequest<T>('PATCH', endpoint, options);
  }

  async putRiot<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRiotRequest<T>('PUT', endpoint, options);
  }

  async deleteRiot<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.makeRiotRequest<T>('DELETE', endpoint, options);
  }

  // 检查是否连接到LOL客户端
  async isConnected(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/lol-summoner/v1/current-summoner');
      return true;
    } catch (error) {
      console.log('连接检查失败:', error);
      return false;
    }
  }

  // 手动刷新凭据（公共方法）
  async reconnect(): Promise<void> {
    await this.refreshCredentials();
  }

  // 获取当前凭据信息
  getCredentials(): LCUCredentials {
    return {
      port: this.port,
      token: this.authToken,
      region: this.region,
      rsoPlatformId: this.rsoPlatformId,
      locale: this.locale,
      serverHost: this.serverHost,
      // 返回新增参数
      riotClientPort: this.riotClientPort,
      riotClientAuthToken: this.riotClientAuthToken,
    };
  }
}
