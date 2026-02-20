import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 检测是否在移动端环境
const isNative = Capacitor.isNativePlatform();

// 数据迁移标记
const MIGRATION_KEY = 'keygenie_storage_migrated';

// 移动端缓存（用于同步访问）
const nativeCache = new Map();

/**
 * 存储抽象层
 * 在 Web 环境使用 localStorage，在移动端使用 Capacitor Preferences
 * 提供同步和异步两种接口以保持向后兼容
 */
class Storage {
  constructor() {
    // 初始化时加载缓存（仅移动端）
    if (isNative) {
      this.loadCache();
    }
  }

  /**
   * 加载所有数据到缓存（移动端）
   */
  async loadCache() {
    if (!isNative) return;
    try {
      const keys = await Preferences.keys();
      for (const key of keys.keys) {
        const result = await Preferences.get({ key });
        if (result.value !== null) {
          nativeCache.set(key, result.value);
        }
      }
    } catch (error) {
      console.error('加载缓存失败:', error);
    }
  }

  /**
   * 从 localStorage 迁移数据到 Capacitor Preferences
   */
  async migrateFromLocalStorage() {
    if (!isNative) {
      return; // Web 环境不需要迁移
    }

    try {
      const migrated = await Preferences.get({ key: MIGRATION_KEY });
      if (migrated.value === 'true') {
        // 已迁移，加载缓存
        await this.loadCache();
        return;
      }

      // 迁移所有 localStorage 数据
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value !== null) {
            await Preferences.set({ key, value });
            nativeCache.set(key, value); // 更新缓存
          }
        } catch (error) {
          console.warn(`迁移键 ${key} 失败:`, error);
        }
      }

      // 标记已迁移
      await Preferences.set({ key: MIGRATION_KEY, value: 'true' });
      console.log('数据迁移完成');
    } catch (error) {
      console.error('数据迁移失败:', error);
    }
  }

  /**
   * 获取存储项（异步）
   */
  async getItem(key) {
    try {
      if (isNative) {
        const result = await Preferences.get({ key });
        const value = result.value;
        // 更新缓存
        if (value !== null) {
          nativeCache.set(key, value);
        } else {
          nativeCache.delete(key);
        }
        return value;
      } else {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error(`获取存储项 ${key} 失败:`, error);
      // 降级到 localStorage
      return localStorage.getItem(key);
    }
  }

  /**
   * 设置存储项（异步）
   */
  async setItem(key, value) {
    try {
      if (isNative) {
        await Preferences.set({ key, value: String(value) });
        nativeCache.set(key, String(value)); // 更新缓存
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`设置存储项 ${key} 失败:`, error);
      // 降级到 localStorage
      localStorage.setItem(key, value);
    }
  }

  /**
   * 删除存储项（异步）
   */
  async removeItem(key) {
    try {
      if (isNative) {
        await Preferences.remove({ key });
        nativeCache.delete(key); // 更新缓存
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`删除存储项 ${key} 失败:`, error);
      // 降级到 localStorage
      localStorage.removeItem(key);
    }
  }

  /**
   * 清空所有存储（异步）
   */
  async clear() {
    try {
      if (isNative) {
        await Preferences.clear();
        nativeCache.clear(); // 清空缓存
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('清空存储失败:', error);
      // 降级到 localStorage
      localStorage.clear();
    }
  }

  /**
   * 同步获取存储项（用于向后兼容）
   * 在移动端从缓存读取，在 Web 环境直接读取 localStorage
   */
  getItemSync(key) {
    if (isNative) {
      // 从缓存读取
      return nativeCache.get(key) || null;
    }
    return localStorage.getItem(key);
  }

  /**
   * 同步设置存储项（用于向后兼容）
   * 在移动端同时更新缓存和异步存储，在 Web 环境直接写入
   */
  setItemSync(key, value) {
    if (isNative) {
      // 更新缓存
      nativeCache.set(key, String(value));
      // 异步写入（不等待）
      Preferences.set({ key, value: String(value) }).catch(error => {
        console.error(`异步设置存储项 ${key} 失败:`, error);
      });
    } else {
      localStorage.setItem(key, value);
    }
  }

  /**
   * 同步删除存储项（用于向后兼容）
   */
  removeItemSync(key) {
    if (isNative) {
      // 从缓存删除
      nativeCache.delete(key);
      // 异步删除（不等待）
      Preferences.remove({ key }).catch(error => {
        console.error(`异步删除存储项 ${key} 失败:`, error);
      });
    } else {
      localStorage.removeItem(key);
    }
  }
}

// 创建单例实例
const storage = new Storage();

// 在应用启动时执行迁移
if (isNative) {
  storage.migrateFromLocalStorage().catch(console.error);
}

export default storage;

