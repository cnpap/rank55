import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import { LCUClientInterface } from './interface';

const execAsync = promisify(exec);

// LCU凭据接口
interface LCUCredentials {
  port: number;
  token: string;
}

// LCU客户端实现
export class LCUClient implements LCUClientInterface {
  private baseURL: string;
  private authToken: string;
  private port: number;
  private maxRetries: number = 2; // 最大重试次数
  private retryDelay: number = 1000; // 重试延迟（毫秒）

  constructor(port: number, token: string) {
    this.port = port;
    this.authToken = token;
    this.baseURL = `https://127.0.0.1:${port}`;
  }

  // 创建新的LCU客户端
  static async create(): Promise<LCUClient> {
    const credentials = await this.getLCUCredentials();
    return new LCUClient(credentials.port, credentials.token);
  }

  // 刷新LCU凭据
  private async refreshCredentials(): Promise<void> {
    try {
      const credentials = await LCUClient.getLCUCredentials();
      this.port = credentials.port;
      this.authToken = credentials.token;
      this.baseURL = `https://127.0.0.1:${credentials.port}`;
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

      // 解析命令行参数获取端口和token
      const portRegex = /--app-port=(\d+)/;
      const tokenRegex = /--remoting-auth-token=([\w-]+)/;

      const portMatch = cmdOutput.match(portRegex);
      const tokenMatch = cmdOutput.match(tokenRegex);

      if (!portMatch || !tokenMatch) {
        throw new Error(
          '无法从LOL客户端进程中提取API凭据，请确保LOL客户端正在运行'
        );
      }

      const port = parseInt(portMatch[1], 10);
      if (isNaN(port)) {
        throw new Error('解析端口号失败');
      }

      return {
        port,
        token: tokenMatch[1],
      };
    } catch (error) {
      throw new Error(`获取LCU凭据失败: ${error}`);
    }
  }

  // 发送HTTP请求到LCU API（带自动重试）
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    retryCount: number = 0
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const url = new URL(this.baseURL + endpoint);

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`riot:${this.authToken}`).toString('base64')}`,
        },
        rejectUnauthorized: false, // 忽略SSL证书验证
      };

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', async () => {
          // 如果是认证错误或连接错误，且还有重试次数，则尝试刷新凭据后重试
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
              const result = await this.makeRequest(
                method,
                endpoint,
                body,
                retryCount + 1
              );
              resolve(result);
              return;
            } catch (refreshError) {
              reject(new Error(`刷新凭据后重试失败: ${refreshError}`));
              return;
            }
          }

          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(`API请求失败，状态码: ${res.statusCode}, 响应: ${data}`)
            );
            return;
          }

          try {
            const result = data ? JSON.parse(data) : null;
            resolve(result);
          } catch (error) {
            reject(new Error(`解析响应失败: ${error}`));
          }
        });
      });

      req.on('error', async (error: any) => {
        // 如果是连接错误且还有重试次数，尝试刷新凭据后重试
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
            const result = await this.makeRequest(
              method,
              endpoint,
              body,
              retryCount + 1
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
      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  // 发送GET请求
  async get(endpoint: string): Promise<any> {
    return this.makeRequest('GET', endpoint);
  }

  // 发送POST请求
  async post(endpoint: string, body?: any): Promise<any> {
    return this.makeRequest('POST', endpoint, body);
  }

  // 发送PATCH请求
  async patch(endpoint: string, body?: any): Promise<any> {
    return this.makeRequest('PATCH', endpoint, body);
  }

  // 发送PUT请求
  async put(endpoint: string, body?: any): Promise<any> {
    return this.makeRequest('PUT', endpoint, body);
  }

  // 发送DELETE请求
  async delete(endpoint: string): Promise<any> {
    return this.makeRequest('DELETE', endpoint);
  }

  // 检查是否连接到LOL客户端
  async isConnected(): Promise<boolean> {
    try {
      await this.get('/lol-summoner/v1/current-summoner');
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
  getCredentials(): { port: number; token: string } {
    return {
      port: this.port,
      token: this.authToken,
    };
  }
}
