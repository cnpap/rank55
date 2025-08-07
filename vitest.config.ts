import path from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    globals: true,
    // 确保测试环境可以访问环境变量
    setupFiles: ['./src/test-setup.ts'], // 可选：创建测试设置文件
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
