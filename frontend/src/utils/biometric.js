import { Capacitor } from '@capacitor/core';
import { BiometricAuth as BiometricAuthPlugin } from '@aparajita/capacitor-biometric-auth';
import storage from './storage';

const BIOMETRIC_ENABLED_KEY = 'keygenie_biometric_enabled';
const BIOMETRIC_LAST_VERIFIED_KEY = 'keygenie_biometric_last_verified';

/**
 * 生物识别工具类
 */
class BiometricAuth {
  /**
   * 检查设备是否支持生物识别
   */
  async isAvailable() {
    if (!Capacitor.isNativePlatform()) {
      return false; // Web 环境不支持
    }

    try {
      const result = await BiometricAuthPlugin.checkAvailability();
      return result.isAvailable || false;
    } catch (error) {
      console.error('检查生物识别可用性失败:', error);
      return false;
    }
  }

  /**
   * 获取生物识别类型
   */
  async getBiometryType() {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const result = await BiometricAuthPlugin.checkAvailability();
      // 映射生物识别类型
      if (result.biometryType === 'fingerprint') return 'fingerprint';
      if (result.biometryType === 'face') return 'face';
      if (result.biometryType === 'iris') return 'iris';
      return result.biometryType || null;
    } catch (error) {
      console.error('获取生物识别类型失败:', error);
      return null;
    }
  }

  /**
   * 检查是否已启用生物识别
   */
  async isEnabled() {
    const enabled = await storage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * 启用生物识别
   */
  async enable() {
    // 先验证一次，确保可以正常使用
    const verified = await this.verify();
    if (verified) {
      await storage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    }
    return false;
  }

  /**
   * 禁用生物识别
   */
  async disable() {
    await storage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
    await storage.removeItem(BIOMETRIC_LAST_VERIFIED_KEY);
  }

  /**
   * 验证生物识别
   */
  async verify(reason = '请验证身份以继续') {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await BiometricAuthPlugin.authenticate({
        reason,
        title: '身份验证',
        subtitle: '请使用生物识别验证身份',
        description: '使用指纹或面部识别验证身份',
        cancelTitle: '取消',
      });

      if (result.succeeded) {
        // 记录验证时间
        await storage.setItem(BIOMETRIC_LAST_VERIFIED_KEY, new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('生物识别验证失败:', error);
      // 用户取消不算错误，返回 false
      if (error.message && error.message.includes('cancel')) {
        return false;
      }
      return false;
    }
  }

  /**
   * 检查是否需要重新验证
   * @param {number} timeoutMinutes 超时时间（分钟），默认 5 分钟
   */
  async needsReauth(timeoutMinutes = 5) {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return false; // 未启用，不需要验证
    }

    const lastVerified = await storage.getItem(BIOMETRIC_LAST_VERIFIED_KEY);
    if (!lastVerified) {
      return true; // 从未验证过，需要验证
    }

    try {
      const lastVerifiedTime = new Date(lastVerified).getTime();
      const now = new Date().getTime();
      const timeoutMs = timeoutMinutes * 60 * 1000;
      
      return (now - lastVerifiedTime) > timeoutMs;
    } catch (error) {
      console.error('检查验证时间失败:', error);
      return true; // 出错时要求重新验证
    }
  }

  /**
   * 清除验证记录（用于登出等场景）
   */
  async clearVerification() {
    await storage.removeItem(BIOMETRIC_LAST_VERIFIED_KEY);
  }
}

// 创建单例实例
const biometricAuth = new BiometricAuth();

export default biometricAuth;

