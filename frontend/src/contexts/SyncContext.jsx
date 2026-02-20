import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { checkLoginStatus, fullSync, processPendingSyncQueue, getLastSyncedAt } from '../services/syncService';
import networkManager from '../utils/network';
import appLifecycleManager from '../utils/appLifecycle';

const SyncContext = createContext();

// 全局同步状态管理（用于 syncService 访问）
let globalSyncState = {
  setIsSyncing: null,
  setLastSyncedAt: null
};

export function SyncProvider({ children }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(getLastSyncedAt());

  // 注册全局状态更新函数
  useEffect(() => {
    globalSyncState.setIsSyncing = setIsSyncing;
    globalSyncState.setLastSyncedAt = setLastSyncedAt;
    return () => {
      globalSyncState.setIsSyncing = null;
      globalSyncState.setLastSyncedAt = null;
    };
  }, []);

  // 执行同步
  const performSync = useCallback(async () => {
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      await fullSync();
      await processPendingSyncQueue();
      const syncTime = getLastSyncedAt();
      setLastSyncedAt(syncTime);
    } catch (error) {
      console.error('同步失败:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // 暴露 startSync 和 endSync 供外部使用
  const startSync = useCallback(() => {
    setIsSyncing(true);
  }, []);

  const endSync = useCallback((timestamp) => {
    setIsSyncing(false);
    if (timestamp) {
      setLastSyncedAt(timestamp);
    }
  }, []);

  // 监听同步状态变化（从 syncService 触发）
  useEffect(() => {
    // 初始化时获取最后同步时间
    setLastSyncedAt(getLastSyncedAt());

    // 動態調整的檢查間隔(指數退避策略)
    let checkInterval = 5000;  // 初始 5 秒
    const MIN_INTERVAL = 5000;
    const MAX_INTERVAL = 60000;  // 最大 60 秒
    let timeoutId;

    const scheduleNextCheck = () => {
      timeoutId = setTimeout(() => {
        // 只在网络在线时同步
        if (!networkManager.isConnected()) {
          scheduleNextCheck();
          return;
        }

        checkLoginStatus().then(isLoggedIn => {
          if (isLoggedIn && !isSyncing) {
            processPendingSyncQueue().then(result => {
              if (result.success) {
                const syncTime = getLastSyncedAt();
                setLastSyncedAt(syncTime);

                // 根據是否有處理操作調整間隔
                if (result.processed && result.processed > 0) {
                  // 有處理操作,重置間隔
                  checkInterval = MIN_INTERVAL;
                  console.log('✅ 處理了操作,重置檢查間隔為 5 秒');
                } else {
                  // 無操作,增加間隔(指數退避)
                  checkInterval = Math.min(checkInterval * 1.5, MAX_INTERVAL);
                  console.log(`⏱️ 無待處理操作,增加檢查間隔為 ${Math.round(checkInterval / 1000)} 秒`);
                }
              }
              scheduleNextCheck();
            });
          } else {
            scheduleNextCheck();
          }
        });
      }, checkInterval);
    };

    scheduleNextCheck();

    // 监听网络状态变化
    const networkUnsubscribe = networkManager.addListener((isOnline) => {
      if (isOnline && !isSyncing) {
        // 网络恢复时自动同步
        performSync();
      }
    });

    // 监听应用恢复
    const resumeUnsubscribe = appLifecycleManager.onResume(() => {
      if (networkManager.isConnected() && !isSyncing) {
        // 应用恢复且网络在线时自动同步
        performSync();
      }
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      networkUnsubscribe();
      resumeUnsubscribe();
    };
  }, [isSyncing, performSync]);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncedAt, performSync, startSync, endSync }}>
      {children}
    </SyncContext.Provider>
  );
}

// 导出全局状态更新函数供 syncService 使用
export function getGlobalSyncState() {
  return globalSyncState;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}

