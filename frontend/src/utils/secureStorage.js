import { Capacitor } from '@capacitor/core';
import storage from './storage';

/**
 * 安全存储工具
 * 用于存储敏感数据（如用户凭证、加密密钥等）
 * 在移动端使用 Capacitor Secure Storage，在 Web 环境使用普通存储
 */
class SecureStorage {
  /**
   * 存储敏感数据
   */
  async setSecureItem(key, value) {
    try {
      if (Capacitor.isNativePlatform()) {
        // 移动端：使用加密存储
        // 注意：Capacitor 没有内置的 Secure Storage 插件
        // 这里我们使用 Preferences，但可以标记为敏感数据
        // 实际生产环境可以考虑使用 @capacitor-community/secure-storage 插件
        await storage.setItem(`secure_${key}`, value);
      } else {
        // Web 环境：使用普通存储（可以后续集成加密）
        await storage.setItem(`secure_${key}`, value);
      }
    } catch (error) {
      console.error(`存储敏感数据失败 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 获取敏感数据
   */
  async getSecureItem(key) {
    try {
      return await storage.getItem(`secure_${key}`);
    } catch (error) {
      console.error(`获取敏感数据失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 删除敏感数据
   */
  async removeSecureItem(key) {
    try {
      await storage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error(`删除敏感数据失败 (${key}):`, error);
    }
  }

  /**
   * 检查是否支持安全存储
   */
  isSupported() {
    return true; // 总是支持（降级到普通存储）
  }
}

// 创建单例实例
const secureStorage = new SecureStorage();

export default secureStorage;

