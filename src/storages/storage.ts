export class TypedStorageService<T extends Record<string, unknown>> {
  private storage: Storage;
  private cache: Map<keyof T, T[keyof T]>;

  constructor(storage: Storage) {
    this.storage = storage;
    this.cache = new Map();
  }

  // 设置值
  setItem<K extends keyof T>(key: K, value: T[K]): void {
    this.storage.setItem(key as string, JSON.stringify(value));
    this.cache.set(key, value);
  }

  // 获取值
  getItem<K extends keyof T>(key: K): T[K] | null {
    const cachedValue = this.cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue as T[K];
    }

    const item = this.storage.getItem(key as string);
    if (item) {
      try {
        const parsedValue = JSON.parse(item) as T[K];
        this.cache.set(key, parsedValue);
        return parsedValue;
      } catch (error) {
        console.error(
          `Error parsing item from storage: ${key.toString()}`,
          error
        );
        return null;
      }
    }
    return null;
  }

  // 移除值
  removeItem<K extends keyof T>(key: K): void {
    this.storage.removeItem(key as string);
    this.cache.delete(key);
  }

  // 清除所有值
  clear(): void {
    this.storage.clear();
    this.cache.clear();
  }
}
