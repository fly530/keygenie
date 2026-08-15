/**
 * 方案 B：同步服務改為直連 Supabase（favorites / groups）
 * 保留本地 cache（storage）與離線佇列邏輯，登入狀態改由 Supabase Auth 判定。
 */
import storage from '../utils/storage';
import { supabase } from '../lib/supabaseClient';

// 本地儲存鍵名（與原方案一致，供 UI 讀寫）
const LOCAL_STORAGE_KEY = 'keygenie_data';
const LAST_SYNC_KEY = 'keygenie_last_sync';
const PENDING_SYNC_QUEUE_KEY = 'keygenie_pending_sync_queue';
const CLEANUP_DAYS = 7;

// --------- 輔助：取得目前登入使用者的 Supabase user id ---------
async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// Supabase id 欄位為 uuid 型別，僅接受標準 UUID 格式；舊的 local-xxx 格式會造成 400
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(id) {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// --------- DB 欄位（snake_case）與前端格式（camelCase）互轉 ---------
function rowToFavorite(row) {
  if (!row) return null;
  return {
    id: row.id,
    siteName: row.site_name,
    account: row.account ?? '',
    groupId: row.group_id ?? 'default',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: true,
    isDeleted: row.is_deleted ?? false
  };
}

function favoriteToRow(item, userId) {
  return {
    id: item.id,
    user_id: userId,
    site_name: item.siteName ?? item.site_name,
    account: item.account ?? '',
    group_id: item.groupId ?? item.group_id ?? 'default',
    sort_order: item.sortOrder ?? item.sort_order ?? 0,
    updated_at: item.updatedAt || new Date().toISOString(),
    is_deleted: item.isDeleted ?? item.is_deleted ?? false
  };
}

function rowToGroup(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted ?? false
  };
}

function groupToRow(item, userId) {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    sort_order: item.sortOrder ?? item.sort_order ?? 0,
    updated_at: item.updatedAt || new Date().toISOString(),
    is_deleted: item.isDeleted ?? item.is_deleted ?? false
  };
}

// --------- 上次同步時間（僅寫入本地） ---------
export function getLastSyncedAt() {
  return storage.getItemSync(LAST_SYNC_KEY);
}

export function saveLastSyncedAt(timestamp) {
  storage.setItemSync(LAST_SYNC_KEY, timestamp);
}

// --------- 本地資料讀寫（供 UI 與離線使用） ---------
export function getLocalData() {
  try {
    const data = storage.getItemSync(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { favorites: [], groups: [] };
  } catch (error) {
    console.error('讀取本地資料失敗:', error);
    return { favorites: [], groups: [] };
  }
}

export function saveLocalData(data) {
  try {
    storage.setItemSync(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存本地資料失敗:', error);
  }
}

// --------- 清除本地資料並重新從 Supabase 同步（供設定頁「清除本地數據」使用） ---------
export async function clearLocalDataAndResync() {
  try {
    saveLocalData({ favorites: [], groups: [] });
    storage.removeItemSync(LAST_SYNC_KEY);
    storage.removeItemSync(PENDING_SYNC_QUEUE_KEY);
    const result = await fetchFromCloud();
    return result;
  } catch (error) {
    console.error('清除本地資料並重新同步失敗:', error);
    return { success: false, message: error?.message || error };
  }
}

// --------- 待同步佇列（離線時寫入，上線後重試） ---------
function getPendingSyncQueue() {
  try {
    const queue = storage.getItemSync(PENDING_SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('讀取待同步佇列失敗:', error);
    return [];
  }
}

function savePendingSyncQueue(queue) {
  try {
    storage.setItemSync(PENDING_SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('保存待同步佇列失敗:', error);
  }
}

const MAX_QUEUE_SIZE = 100;
const MAX_RETRY_COUNT = 3;
const OPERATION_EXPIRY_DAYS = 7;

function addToPendingQueue(operation) {
  const queue = getPendingSyncQueue();
  const now = new Date();
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  const operationKey = JSON.stringify({ type: operation.type, data: operation.data });
  const isDuplicate = queue.some(item => JSON.stringify({ type: item.type, data: item.data }) === operationKey);
  if (isDuplicate) return;
  queue.push({
    ...operation,
    timestamp: now.toISOString(),
    retryCount: 0,
    expiresAt: new Date(now.getTime() + OPERATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  });
  savePendingSyncQueue(queue);
}

// --------- 清理已刪除超過 N 天的本地記錄 ---------
export function cleanupDeletedItems() {
  try {
    const localData = getLocalData();
    const now = new Date().getTime();
    const daysInMs = CLEANUP_DAYS * 24 * 60 * 60 * 1000;
    if (localData.favorites) {
      localData.favorites = localData.favorites.filter(f => {
        if (!f.isDeleted) return true;
        return (now - new Date(f.updatedAt).getTime()) < daysInMs;
      });
    }
    if (localData.groups) {
      localData.groups = localData.groups.filter(g => {
        if (!g.isDeleted) return true;
        return (now - new Date(g.updatedAt).getTime()) < daysInMs;
      });
    }
    saveLocalData(localData);
    return { success: true, cleaned: true };
  } catch (error) {
    console.error('清理已刪除記錄失敗:', error);
    return { success: false, message: error.message };
  }
}

// --------- 登入狀態：改為 Supabase Auth session ---------
export async function checkLoginStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.warn('檢查登入狀態失敗:', error);
    return false;
  }
}

// --------- 從 Supabase 拉取資料並與本地 merge 後寫回本地 ---------
export async function fetchFromCloud() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, message: '未登入' };
    }

    const [favRes, grpRes] = await Promise.all([
      supabase.from('favorites').select('*').eq('user_id', userId),
      supabase.from('groups').select('*').eq('user_id', userId)
    ]);

    if (favRes.error) throw new Error(favRes.error.message);
    if (grpRes.error) throw new Error(grpRes.error.message);

    const cloudData = {
      favorites: (favRes.data || []).map(rowToFavorite).filter(Boolean),
      groups: (grpRes.data || []).map(rowToGroup).filter(Boolean)
    };

    const localData = getLocalData();
    const mergedData = mergeData(localData, cloudData);
    saveLocalData(mergedData);
    saveLastSyncedAt(new Date().toISOString());
    return { success: true, data: mergedData };
  } catch (error) {
    console.error('從 Supabase 取得資料失敗:', error);
    return { success: false, message: error?.message || error };
  }
}

// --------- 將本地資料推送到 Supabase（upsert，供 fullSync 第二步） ---------
export async function syncToCloud() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, message: '未登入' };
    }

    const localData = getLocalData();
    const favorites = localData.favorites || [];
    const groups = localData.groups || [];

    // 只 upsert id 為標準 UUID 的列（舊的 local-xxx 格式會讓 DB 回 400，跳過不送）
    const favRows = favorites.filter(f => isValidUuid(f.id)).map(f => favoriteToRow(f, userId));
    const grpRows = groups.filter(g => isValidUuid(g.id)).map(g => groupToRow(g, userId));

    if (favRows.length > 0) {
      const { error: favErr } = await supabase.from('favorites').upsert(favRows, { onConflict: 'id' });
      if (favErr) throw new Error(favErr.message);
    }
    if (grpRows.length > 0) {
      const { error: grpErr } = await supabase.from('groups').upsert(grpRows, { onConflict: 'id' });
      if (grpErr) throw new Error(grpErr.message);
    }

    saveLastSyncedAt(new Date().toISOString());
    return { success: true, data: localData, message: '同步成功' };
  } catch (error) {
    console.error('同步到 Supabase 失敗:', error);
    return { success: false, message: error?.message || error };
  }
}

// 合併邏輯：Last Write Wins（與原方案一致）
function mergeData(local, cloud) {
  const mergeLists = (listA, listB) => {
    const map = new Map();
    [...(listA || []), ...(listB || [])].forEach(item => {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        const existingTime = new Date(existing.updatedAt || 0).getTime();
        const itemTime = new Date(item.updatedAt || 0).getTime();
        if (itemTime > existingTime) {
          map.set(item.id, item);
        } else if (itemTime === existingTime && item.id > existing.id) {
          map.set(item.id, item);
        }
      }
    });
    return Array.from(map.values());
  };
  return {
    favorites: mergeLists(local.favorites || [], cloud.favorites || []),
    groups: mergeLists(local.groups || [], cloud.groups || [])
  };
}

// --------- 完整同步：先拉取再推送，確保本地與 Supabase 一致 ---------
export async function fullSync() {
  try {
    const fetchResult = await fetchFromCloud();
    if (!fetchResult.success) return fetchResult;
    return await syncToCloud();
  } catch (error) {
    console.error('完整同步失敗:', error);
    return { success: false, message: error?.message || error };
  }
}

let syncLock = false;
let syncQueue = [];

export function backgroundSync(syncCallback) {
  Promise.resolve().then(async () => {
    if (syncLock) {
      if (syncCallback) syncQueue.push(syncCallback);
      return;
    }
    syncLock = true;
    let syncState = null;
    try {
      const { getGlobalSyncState } = await import('../contexts/SyncContext');
      syncState = getGlobalSyncState();
    } catch (_) {}
    if (syncState?.setIsSyncing) syncState.setIsSyncing(true);

    try {
      const isLoggedIn = await checkLoginStatus();
      if (!isLoggedIn) {
        if (syncCallback) addToPendingQueue({ type: 'sync', callback: syncCallback.toString() });
        return;
      }
      if (syncCallback) {
        await syncCallback();
      } else {
        await fullSync();
      }
      await processPendingSyncQueue();
      while (syncQueue.length > 0) {
        const cb = syncQueue.shift();
        try {
          await cb();
        } catch (err) {
          console.error('佇列同步執行失敗:', err);
        }
      }
      const syncTime = getLastSyncedAt();
      if (syncState?.setLastSyncedAt && syncTime) syncState.setLastSyncedAt(syncTime);
    } catch (error) {
      console.error('背景同步失敗:', error);
      if (syncCallback) addToPendingQueue({ type: 'sync', callback: syncCallback.toString() });
    } finally {
      syncLock = false;
      if (syncState?.setIsSyncing) syncState.setIsSyncing(false);
    }
  });
}

export async function processPendingSyncQueue() {
  try {
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) return { success: false, message: '未登入' };
    const queue = getPendingSyncQueue();
    if (queue.length === 0) return { success: true, message: '佇列為空', processed: 0 };
    const now = new Date().getTime();
    const validQueue = queue.filter(op => {
      const expiresAt = new Date(op.expiresAt || 0).getTime();
      return !(expiresAt > 0 && expiresAt < now);
    });
    if (validQueue.length === 0) {
      savePendingSyncQueue([]);
      return { success: true, message: '所有操作已過期', processed: 0 };
    }
    const result = await fullSync();
    if (result.success) {
      savePendingSyncQueue([]);
      return { success: true, message: '佇列處理成功', processed: validQueue.length };
    }
    const updatedQueue = validQueue.map(op => ({ ...op, retryCount: (op.retryCount || 0) + 1 }))
      .filter(op => (op.retryCount || 0) < MAX_RETRY_COUNT);
    savePendingSyncQueue(updatedQueue);
    return { success: false, message: result.message, processed: 0 };
  } catch (error) {
    console.error('處理待同步佇列失敗:', error);
    return { success: false, message: error?.message, processed: 0 };
  }
}

// --------- 我的最愛 CRUD：先寫 Supabase，成功後更新本地 ---------
export async function createFavorite(data) {
  const userId = await getCurrentUserId();
  const localData = getLocalData();
  const favorites = localData.favorites || [];
  const maxSortOrder = favorites.length > 0
    ? Math.max(...favorites.filter(f => !f.isDeleted).map(f => f.sortOrder || 0))
    : 0;

  const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 3 | 8); return v.toString(16); });
  const now = new Date().toISOString();
  const newItem = {
    id: newId,
    siteName: data.siteName ?? data.site_name ?? '',
    account: data.account ?? '',
    groupId: data.groupId ?? data.group_id ?? 'default',
    sortOrder: data.sortOrder ?? maxSortOrder + 1,
    createdAt: now,
    updatedAt: now,
    isFavorite: true,
    isDeleted: false
  };

  localData.favorites = [...favorites, newItem];
  saveLocalData(localData);

  if (userId) {
    const { error } = await supabase.from('favorites').insert({
      id: newItem.id,
      user_id: userId,
      site_name: newItem.siteName,
      account: newItem.account,
      group_id: newItem.groupId,
      sort_order: newItem.sortOrder,
      created_at: newItem.createdAt,
      updated_at: newItem.updatedAt,
      is_deleted: false
    });
    if (error) {
      console.error('Supabase 新增 favorite 失敗:', error);
      backgroundSync();
      return newItem;
    }
    // 成功，更新同步時間，避免 fullSync
    saveLastSyncedAt(now);
    if (globalSyncState.setLastSyncedAt) {
      globalSyncState.setLastSyncedAt(now);
    }
    return newItem;
  }

  backgroundSync();
  return newItem;
}

export async function updateFavorite(id, updates) {
  const localData = getLocalData();
  const index = localData.favorites.findIndex(f => f.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated = {
    ...localData.favorites[index],
    ...updates,
    updatedAt: now
  };
  localData.favorites[index] = updated;
  saveLocalData(localData);

  const userId = await getCurrentUserId();
  if (userId) {
    const { error } = await supabase.from('favorites').update({
      site_name: updated.siteName ?? updated.site_name,
      account: updated.account ?? '',
      group_id: updated.groupId ?? 'default',
      sort_order: updated.sortOrder ?? 0,
      updated_at: updated.updatedAt
    }).eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('Supabase 更新 favorite 失敗:', error);
      backgroundSync();
      return updated;
    }
    // 成功，更新同步時間
    saveLastSyncedAt(now);
    if (globalSyncState.setLastSyncedAt) {
      globalSyncState.setLastSyncedAt(now);
    }
    return updated;
  }
  backgroundSync();
  return updated;
}

// 批次更新我的最愛排序 (大幅減少排序時的 API 呼叫)
export async function bulkUpdateFavorites(updatesArray) {
  const localData = getLocalData();
  const now = new Date().toISOString();

  updatesArray.forEach(upd => {
    const index = localData.favorites.findIndex(f => f.id === upd.id);
    if (index !== -1) {
      localData.favorites[index] = {
        ...localData.favorites[index],
        ...upd,
        updatedAt: now
      };
    }
  });
  saveLocalData(localData);

  const userId = await getCurrentUserId();
  if (userId) {
    const rows = updatesArray.map(upd => {
      const item = localData.favorites.find(f => f.id === upd.id);
      return favoriteToRow(item, userId);
    });

    const { error } = await supabase.from('favorites').upsert(rows);
    if (error) {
      console.error('Supabase 批次更新 favorite 失敗:', error);
      backgroundSync();
      return;
    }
    // 成功，更新同步時間，避免 fullSync
    saveLastSyncedAt(now);
    if (globalSyncState.setLastSyncedAt) {
      globalSyncState.setLastSyncedAt(now);
    }
    return;
  }
  backgroundSync();
}

export async function deleteFavorite(id) {
  const localData = getLocalData();
  const index = localData.favorites.findIndex(f => f.id === id);
  if (index === -1) return;
  const now = new Date().toISOString();
  localData.favorites[index].isDeleted = true;
  localData.favorites[index].updatedAt = now;
  saveLocalData(localData);

  const userId = await getCurrentUserId();
  if (userId) {
    const { error } = await supabase.from('favorites').update({ is_deleted: true, updated_at: now })
      .eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('Supabase 軟刪除 favorite 失敗:', error);
      backgroundSync();
      return;
    }
    // 成功，更新同步時間
    saveLastSyncedAt(now);
    if (globalSyncState.setLastSyncedAt) {
      globalSyncState.setLastSyncedAt(now);
    }
    return;
  }
  backgroundSync();
}

// --------- 群組 CRUD ---------
export async function createGroup(group) {
  if (!group?.name?.trim()) throw new Error('群组名称不能为空');
  const userId = await getCurrentUserId();
  const localData = getLocalData();
  const groups = localData.groups || [];
  const maxSortOrder = groups.length > 0
    ? Math.max(...groups.filter(g => !g.isDeleted).map(g => g.sortOrder || 0))
    : 0;

  const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 3 | 8); return v.toString(16); });
  const now = new Date().toISOString();
  const newGroup = {
    id: newId,
    name: group.name.trim(),
    sortOrder: group.sortOrder ?? maxSortOrder + 1,
    createdAt: now,
    updatedAt: now,
    isDeleted: false
  };

  localData.groups = [...groups, newGroup];
  saveLocalData(localData);

  if (userId) {
    const { error } = await supabase.from('groups').insert({
      id: newGroup.id,
      user_id: userId,
      name: newGroup.name,
      sort_order: newGroup.sortOrder,
      created_at: now,
      updated_at: now,
      is_deleted: false
    });
    if (error) {
      console.error('Supabase 新增 group 失敗:', error);
      backgroundSync();
      return newGroup;
    }
    // 成功，更新同步時間
    saveLastSyncedAt(now);
    if (globalSyncState.setLastSyncedAt) {
      globalSyncState.setLastSyncedAt(now);
    }
    return newGroup;
  }

  backgroundSync();
  return newGroup;
}

export async function updateGroup(id, updates) {
  if (updates?.name !== undefined) {
    if (!updates.name?.trim()) throw new Error('群组名称不能为空');
    updates.name = updates.name.trim();
  }
  const localData = getLocalData();
  const index = localData.groups.findIndex(g => g.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  localData.groups[index] = { ...localData.groups[index], ...updates, updatedAt: now };
  saveLocalData(localData);

  const userId = await getCurrentUserId();
  if (userId && updates) {
    const row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
    row.updated_at = localData.groups[index].updatedAt;
    if (Object.keys(row).length > 0) {
      const { error } = await supabase.from('groups').update(row).eq('id', id).eq('user_id', userId);
      if (error) {
        console.error('Supabase 更新 group 失敗:', error);
        backgroundSync();
        return localData.groups[index];
      }
      // 成功，更新同步時間
      saveLastSyncedAt(now);
      if (globalSyncState.setLastSyncedAt) {
        globalSyncState.setLastSyncedAt(now);
      }
      return localData.groups[index];
    }
  }
  backgroundSync();
  return localData.groups[index];
}

export async function deleteGroup(id) {
  if (id === 'default') throw new Error('不能删除默认群组');
  const localData = getLocalData();
  const index = localData.groups.findIndex(g => g.id === id);
  if (index === -1) return;
  const now = new Date().toISOString();
  localData.groups[index].isDeleted = true;
  localData.groups[index].updatedAt = now;
  localData.favorites = (localData.favorites || []).map(f =>
    f.groupId === id ? { ...f, groupId: 'default', updatedAt: now } : f
  );
  saveLocalData(localData);

  const userId = await getCurrentUserId();
  if (userId) {
    const { error: groupErr } = await supabase.from('groups').update({ is_deleted: true, updated_at: now }).eq('id', id).eq('user_id', userId);
    if (groupErr) console.error('Supabase 刪除 group 失敗:', groupErr);

    const { error: favErr } = await supabase.from('favorites').update({ group_id: 'default', updated_at: now }).eq('group_id', id).eq('user_id', userId);
    if (favErr) console.error('Supabase 更新歸屬最愛失敗:', favErr);

    if (!groupErr && !favErr) {
      // 成功，更新同步時間，避免 fullSync
      saveLastSyncedAt(now);
      if (globalSyncState.setLastSyncedAt) {
        globalSyncState.setLastSyncedAt(now);
      }
      return;
    }
  }
  backgroundSync();
}

// --------- 匯出／匯入（僅操作本地，格式不變） ---------
export function exportAllData() {
  try {
    const data = {
      favorites: getLocalData().favorites || [],
      groups: getLocalData().groups || [],
      activeTab: storage.getItemSync('keygenie_active_tab') || 'ALL',
      collapsedGroups: JSON.parse(storage.getItemSync('collapsedGroups') || '{}'),
      language: storage.getItemSync('keygenie_language') || 'zh-TW',
      version: '1.0.0',
      exportDate: new Date().toISOString()
    };
    try {
      const historyData = storage.getItemSync('keygenie_password_history');
      if (historyData) data.passwordHistory = JSON.parse(historyData);
    } catch (_) {}
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      filename: `keygenie-backup-${new Date().toISOString().split('T')[0]}.json`
    };
  } catch (error) {
    console.error('匯出資料失敗:', error);
    return { success: false, message: error.message };
  }
}

export function importData(jsonString) {
  try {
    const importedData = JSON.parse(jsonString);
    if (!importedData.favorites || !importedData.groups) throw new Error('無效的資料格式');
    const localData = { favorites: importedData.favorites || [], groups: importedData.groups || [] };
    saveLocalData(localData);
    if (importedData.activeTab) storage.setItemSync('keygenie_active_tab', importedData.activeTab);
    if (importedData.collapsedGroups) storage.setItemSync('collapsedGroups', JSON.stringify(importedData.collapsedGroups));
    if (importedData.language) storage.setItemSync('keygenie_language', importedData.language);
    if (importedData.passwordHistory) {
      try {
        storage.setItemSync('keygenie_password_history', JSON.stringify(importedData.passwordHistory));
      } catch (_) {}
    }
    return { success: true, message: '數據導入成功' };
  } catch (error) {
    console.error('導入資料失敗:', error);
    return { success: false, message: error?.message || '導入失敗，請檢查檔案格式' };
  }
}
