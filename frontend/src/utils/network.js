import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * 网络状态管理
 */
class NetworkManager {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
    this.networkStatusListener = null;
  }

  /**
   * 初始化网络监听
   */
  async init() {
    if (!Capacitor.isNativePlatform()) {
      // Web 环境使用 navigator.onLine
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners(true);
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners(false);
      });
      return;
    }

    // 移动端使用 Capacitor Network
    try {
      const status = await Network.getStatus();
      this.isOnline = status.connected;

      // 监听网络状态变化
      this.networkStatusListener = await Network.addListener('networkStatusChange', (status) => {
        this.isOnline = status.connected;
        this.notifyListeners(status.connected);
      });
    } catch (error) {
      console.error('初始化网络监听失败:', error);
      this.isOnline = true; // 默认假设在线
    }
  }

  /**
   * 获取当前网络状态
   */
  async getStatus() {
    if (!Capacitor.isNativePlatform()) {
      return {
        connected: navigator.onLine,
        connectionType: 'unknown'
      };
    }

    try {
      return await Network.getStatus();
    } catch (error) {
      console.error('获取网络状态失败:', error);
      return {
        connected: true,
        connectionType: 'unknown'
      };
    }
  }

  /**
   * 检查是否在线
   */
  isConnected() {
    return this.isOnline;
  }

  /**
   * 添加网络状态变化监听器
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('网络状态监听器错误:', error);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.networkStatusListener) {
      this.networkStatusListener.remove();
      this.networkStatusListener = null;
    }
    this.listeners = [];
  }
}

// 创建单例实例
const networkManager = new NetworkManager();

// 自动初始化
networkManager.init().catch(console.error);

export default networkManager;

