// 条件导入 Node.js 模块的工具函数
export async function getNodeModules() {
  // 检查是否在 Node.js 环境中
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const fs = await import('fs/promises');
    const fsSync = await import('fs');
    const path = await import('path');

    return {
      fs,
      fsSync,
      path,
    };
  }

  // 在浏览器环境中返回空对象或抛出错误
  throw new Error('Node.js modules are not available in browser environment');
}
