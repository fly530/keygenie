import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * 应用生命周期管理
 */
class AppLifecycleManager {
  constructor() {
    this.listeners = {
      pause: [],
      resume: [],
      stateChange: []
    };
    this.appStateListeners = [];
  }

  /**
   * 初始化生命周期监听
   */
  async init() {
    if (!Capacitor.isNativePlatform()) {
      // Web 环境使用 visibilitychange 事件
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.notifyListeners('pause');
        } else {
          this.notifyListeners('resume');
        }
      });
      return;
    }

    // 移动端使用 Capacitor App
    try {
      // 监听应用状态变化
      const stateListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          this.notifyListeners('resume');
        } else {
          this.notifyListeners('pause');
        }
        this.notifyListeners('stateChange', { isActive });
      });

      // 监听应用返回前台
      const resumeListener = await App.addListener('appUrlOpen', () => {
        this.notifyListeners('resume');
      });

      this.appStateListeners = [stateListener, resumeListener];
    } catch (error) {
      console.error('初始化应用生命周期监听失败:', error);
    }
  }

  /**
   * 添加暂停监听器
   */
  onPause(callback) {
    this.listeners.pause.push(callback);
    return () => {
      const index = this.listeners.pause.indexOf(callback);
      if (index > -1) {
        this.listeners.pause.splice(index, 1);
      }
    };
  }

  /**
   * 添加恢复监听器
   */
  onResume(callback) {
    this.listeners.resume.push(callback);
    return () => {
      const index = this.listeners.resume.indexOf(callback);
      if (index > -1) {
        this.listeners.resume.splice(index, 1);
      }
    };
  }

  /**
   * 添加状态变化监听器
   */
  onStateChange(callback) {
    this.listeners.stateChange.push(callback);
    return () => {
      const index = this.listeners.stateChange.indexOf(callback);
      if (index > -1) {
        this.listeners.stateChange.splice(index, 1);
      }
    };
  }

  /**
   * 通知监听器
   */
  notifyListeners(event, data = null) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`应用生命周期监听器错误 (${event}):`, error);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.appStateListeners) {
      this.appStateListeners.forEach(listener => {
        if (listener && listener.remove) {
          listener.remove();
        }
      });
      this.appStateListeners = [];
    }
    this.listeners = {
      pause: [],
      resume: [],
      stateChange: []
    };
  }
}

// 创建单例实例
const appLifecycleManager = new AppLifecycleManager();

// 自动初始化
appLifecycleManager.init().catch(console.error);

export default appLifecycleManager;

