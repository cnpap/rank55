import { z } from 'zod';

const zenv = z.enum(['development', 'production', 'test']);
export type ZENV = z.infer<typeof zenv>;

// 创建一个包含所有环境变量名称的类型
export type EnvVarName = keyof typeof envSchema;

// 导出环境变量类型，用于扩展ProcessEnv
export type AppEnv = Record<EnvVarName, string | undefined>;

/**
 * 判断当前是客户端还是服务端环境
 */
export const isClient = typeof window !== 'undefined';

/**
 * 获取环境变量的原始值
 * 在客户端使用 import.meta.env，在服务端使用 process.env
 */
function getRawEnv<K extends EnvVarName>(key: K): string | undefined {
  if (isClient) {
    // Vite 在构建时会将 import.meta.env.VITE_* 替换为实际值
    // 注意：前端环境变量需要以 VITE_ 为前缀
    return (import.meta.env as any)[`VITE_${key}`];
  } else {
    return process.env[key];
  }
}

/**
 * 类型安全的环境变量读取函数
 * @param key 环境变量名称
 * @returns 验证并转换后的环境变量值
 */
export function env<K extends EnvVarName>(
  key: K
): z.infer<(typeof envSchema)[K]> {
  const schema = envSchema[key];
  const value = getRawEnv(key);

  try {
    return schema.parse(value);
  } catch (error) {
    throw new Error(
      `环境变量 ${key} 格式错误: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 定义环境变量schema
const envSchema = {
  APP_NAME: z.string().default('app'),
  APP_HTTP_PORT: z.coerce.number().default(8787),
  APP_HTTP_HOST: z.string().default('localhost'),
  APP_DOMAIN: z.string().default('finda.com'),
  DATABASE_URL: z.string(),
  NODE_ENV: zenv.default('development'),

  // AWS/Cloudflare R2 配置
  AWS_REGION: z.string().default('auto'),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_ACCESS_KEY: z.string(),
  CLOUDFLARE_SECRET_KEY: z.string(),
  CLOUDFLARE_DOMAIN: z.string().default('app.com'),
  STORAGE_BUCKET_NAME: z.string().default('app-uploads'),

  // 邮件服务配置
  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().default('test@example.com'),
  SMTP_PASS: z.string().default('password123'),
  TEST_EMAIL_TO: z.string().default('recipient@example.com'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // 测试手机号
  TEST_PHONE_NUMBER: z.string().default('18681671272'),

  // 阿里云短信服务配置
  ALIYUN_ACCESS_KEY_ID: z.string().default('your-access-key-id'),
  ALIYUN_ACCESS_KEY_SECRET: z.string().default('your-access-key-secret'),
  ALIYUN_SMS_ENDPOINT: z.string().default('dysmsapi.aliyuncs.com'),
  ALIYUN_SMS_API_VERSION: z.string().default('2017-05-25'),
  ALIYUN_SMS_REGION_ID: z.string().default('cn-hangzhou'),
  ALIYUN_SMS_SIGN_NAME: z.string().default('您的签名名称'),
  ALIYUN_SMS_TEMPLATE_CODE: z.string().default('SMS_XXXXXXXXX'),

  // 阿里云OSS配置
  ALIYUN_BUCKET_NAME: z.string().default('lolhelper'),
  ALIYUN_OSS_REGION: z.string().default('cn-chengdu'),
  ALIYUN_OSS_ENDPOINT: z.string().default('oss-cn-chengdu.aliyuncs.com'),

  // UCloud US3配置
  UCLOUD_PUBLIC_KEY: z.string().default('your-public-key'),
  UCLOUD_PRIVATE_KEY: z.string().default('your-private-key'),
  UCLOUD_S3_ENDPOINT: z.string().default('s3-cn-bj.ufileos.com'),
  UCLOUD_S3_REGION: z.string().default('cn-bj'),
  UCLOUD_S3_BUCKET: z.string().default('your-bucket-name'),
};

const isDev = env('NODE_ENV') === 'development';

// 常用环境变量读取函数
export const envConfig = {
  appName: () => env('APP_NAME'),
  port: () => env('APP_HTTP_PORT'),
  host: () => env('APP_HTTP_HOST'),
  appDomain: () => env('APP_DOMAIN'),
  nodeEnv: () => env('NODE_ENV'),
  isDev: () => isDev,
  dbConnectionString: () => env('DATABASE_URL'),
  corsOrigins: () => env('CORS_ORIGINS'),
  backendUrl: () =>
    `${isDev ? 'http' : 'https'}://${env('APP_HTTP_HOST')}:${env('APP_HTTP_PORT')}`,
  frontendUrl: () => env('FRONTEND_URL'),
  testPhoneNumber: () => env('TEST_PHONE_NUMBER'),

  // AWS/Cloudflare R2 配置
  cloudflare: {
    accountId: () => env('CLOUDFLARE_ACCOUNT_ID'),
    accessKey: () => env('CLOUDFLARE_ACCESS_KEY'),
    secretKey: () => env('CLOUDFLARE_SECRET_KEY'),
    domain: () => env('CLOUDFLARE_DOMAIN'),
  },
  aws: {
    region: () => env('AWS_REGION'),
    storageBucket: () => env('STORAGE_BUCKET_NAME'),
  },

  // 邮件服务配置
  smtp: {
    host: () => env('SMTP_HOST'),
    port: () => env('SMTP_PORT'),
    secure: () => env('SMTP_SECURE') === 'true',
    user: () => env('SMTP_USER'),
    pass: () => env('SMTP_PASS'),
    testEmail: () => env('TEST_EMAIL_TO'),
  },

  // 阿里云短信服务配置
  aliyun: {
    accessKeyId: () => env('ALIYUN_ACCESS_KEY_ID'),
    accessKeySecret: () => env('ALIYUN_ACCESS_KEY_SECRET'),
    sms: {
      endpoint: () => env('ALIYUN_SMS_ENDPOINT'),
      apiVersion: () => env('ALIYUN_SMS_API_VERSION'),
      regionId: () => env('ALIYUN_SMS_REGION_ID'),
      signName: () => env('ALIYUN_SMS_SIGN_NAME'),
      templateCode: () => env('ALIYUN_SMS_TEMPLATE_CODE'),
    },
    oss: {
      bucketName: () => env('ALIYUN_BUCKET_NAME'),
      region: () => env('ALIYUN_OSS_REGION'),
      endpoint: () => env('ALIYUN_OSS_ENDPOINT'),
    },
  },

  // UCloud US3配置
  ucloud: {
    publicKey: () => env('UCLOUD_PUBLIC_KEY'),
    privateKey: () => env('UCLOUD_PRIVATE_KEY'),
    us3: {
      endpoint: () => env('UCLOUD_S3_ENDPOINT'),
      region: () => env('UCLOUD_S3_REGION'),
      bucket: () => env('UCLOUD_S3_BUCKET'),
    },
  },

  endpoint: () => `${env('UCLOUD_S3_BUCKET')}.${env('UCLOUD_S3_ENDPOINT')}`,
};
