import { useState, useCallback, useRef } from 'react';

// 同步状态：idle, syncing, success, error
export function useSyncStatus() {
  const [status, setStatus] = useState('idle'); // idle, syncing, success, error
  const syncQueueRef = useRef([]);
  const isSyncingRef = useRef(false);

  // 执行同步队列
  const processSyncQueue = useCallback(async () => {
    if (isSyncingRef.current || syncQueueRef.current.length === 0) {
      return;
    }

    isSyncingRef.current = true;
    setStatus('syncing');

    try {
      // 执行队列中的所有同步操作
      while (syncQueueRef.current.length > 0) {
        const syncFn = syncQueueRef.current.shift();
        if (syncFn) {
          await syncFn();
        }
      }
      setStatus('success');
      // 短暂显示成功状态后恢复 idle
      setTimeout(() => {
        setStatus('idle');
      }, 500);
    } catch (error) {
      console.error('同步失败:', error);
      setStatus('error');
      // 错误状态保持稍长时间
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // 添加同步任务到队列
  const queueSync = useCallback((syncFn) => {
    syncQueueRef.current.push(syncFn);
    // 如果当前没有在同步，立即开始
    if (!isSyncingRef.current) {
      processSyncQueue();
    }
  }, [processSyncQueue]);

  // 立即执行同步（如果当前没有在同步）
  const syncNow = useCallback(async (syncFn) => {
    if (isSyncingRef.current) {
      // 如果正在同步，加入队列
      queueSync(syncFn);
      return;
    }

    isSyncingRef.current = true;
    setStatus('syncing');

    try {
      await syncFn();
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
      }, 500);
    } catch (error) {
      console.error('同步失败:', error);
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } finally {
      isSyncingRef.current = false;
      // 处理队列中的其他任务
      processSyncQueue();
    }
  }, [queueSync, processSyncQueue]);

  return {
    status,
    isSyncing: status === 'syncing',
    queueSync,
    syncNow
  };
}

