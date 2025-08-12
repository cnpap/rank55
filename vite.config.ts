import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vtjump from 'vtjump';

export default defineConfig(({ mode }) => {
  const plugins = [];
  if (mode === 'development') {
    plugins.push(
      vtjump({
        protocols: ['trae'],
        assets: 'src/assets/vtjump.js?t=' + Date.now(),
      })
    );
  }
  plugins.push(
    vue({
      template: {
        compilerOptions: {
          // 将vtjump属性标记为已知属性，避免警告
          directiveTransforms: {
            // 这里可以添加自定义指令转换
          },
        },
      },
    })
  );
  plugins.push(tailwindcss());
  return {
    plugins: plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './', // 重要：设置为相对路径，以便 Electron 能正确加载资源
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true, // 添加这行，允许外部访问
      watch: {
        // 排除对这些文件/目录的监听，防止自动刷新
        ignored: [
          '**/s3/**',
          '**/.upload-progress.json',
          '**/node_modules/**',
          '**/dist/**',
          '**/dist-electron/**',
        ],
      },
    },
  };
});
