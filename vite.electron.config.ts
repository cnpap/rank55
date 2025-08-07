import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: resolve(__dirname, 'electron/main.ts'),
        preload: resolve(__dirname, 'electron/preload.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        // 为preload脚本生成正确的ES模块
        format: 'es',
      },
    },
    outDir: 'dist-electron',
    emptyOutDir: true,
    target: 'esnext', // 使用更新的目标
    ssr: true,
    minify: false,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});
