import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import { preloadHashWasm } from './utils/passwordGenerator';
import { getCurrentLanguage, t } from './utils/i18n';
import 'rsuite/dist/rsuite.min.css'; // RSuite 預設樣式 - 先載入
import './styles/theme.css';         // 自訂主題 - 後載入覆蓋
import './styles/mobile.css';        // 移動端樣式

// 預加載密碼生成模組(性能優化)
preloadHashWasm().catch(err => {
  console.warn('預加載 hash-wasm 失敗,將在首次使用時載入:', err);
});

// 版本管理 - 檢查版本更新並清除快取
const VERSION_KEY = 'keygenie_app_version';
const currentVersion = document.querySelector('meta[name="app-version"]')?.content || '1.0.0';
const storedVersion = localStorage.getItem(VERSION_KEY);

if (storedVersion && storedVersion !== currentVersion) {
  console.log(`版本更新: ${storedVersion} → ${currentVersion}`);

  // 清除所有快取 (保留使用者資料)
  const keysToKeep = ['keygenie_data', 'keygenie_active_tab', 'collapsedGroups', 'keygenie_language'];
  const allKeys = Object.keys(localStorage);

  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // 更新版本號
  localStorage.setItem(VERSION_KEY, currentVersion);

  // 重新載入頁面以確保使用新版本
  window.location.reload();
} else if (!storedVersion) {
  // 首次使用,記錄版本號
  localStorage.setItem(VERSION_KEY, currentVersion);
}

// 多語言：同步 html lang、meta description、document.title 與當前語系
const currentLang = getCurrentLanguage();
document.documentElement.lang = currentLang;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) metaDesc.setAttribute('content', t('appDescription'));
document.title = t('appTitle');

// 初始化 Capacitor（仅移动端）
if (Capacitor.isNativePlatform()) {
  // 配置状态栏
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0F172A' });
  // 设置状态栏为 overlay 模式，允许内容延伸到状态栏下方
  // 然后通过 CSS padding 来避开状态栏
  StatusBar.setOverlaysWebView({ overlay: true });

  // 在 Android 上，env(safe-area-inset-top) 可能不工作
  // 手动设置状态栏高度的 CSS 变量作为后备
  if (Capacitor.getPlatform() === 'android') {
    // Android 状态栏高度通常是 24dp
    // 根据设备密度转换：ldpi=0.75, mdpi=1, hdpi=1.5, xhdpi=2, xxhdpi=3, xxxhdpi=4
    // 使用 window.devicePixelRatio 来估算，但通常状态栏高度在 24-48px 之间
    const dpr = window.devicePixelRatio || 1;
    // 状态栏高度 = 24dp * 密度，但通常不超过 48px
    const statusBarHeight = Math.min(24 * dpr, 48);

    document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);

    // 延迟检查 env(safe-area-inset-top)，因为可能需要等待 WebView 初始化
    setTimeout(() => {
      const testEl = document.createElement('div');
      testEl.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const safeAreaTop = computed.paddingTop;
      document.body.removeChild(testEl);

      // 如果 env(safe-area-inset-top) 不可用或为 0，使用计算的值
      if (!safeAreaTop || safeAreaTop === '0px' || safeAreaTop === '0') {
        document.documentElement.style.setProperty('--safe-area-inset-top', `${statusBarHeight}px`);
      }
    }, 100);
  }

  // 隐藏启动画面（应用加载完成后）
  window.addEventListener('load', async () => {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error('隐藏启动画面失败:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

