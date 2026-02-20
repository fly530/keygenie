/**
 * Supabase 前端客戶端（方案 B）
 * 用於 Auth（Google 登入）與直連 DB（favorites / groups），RLS 依 auth.uid() 保護。
 */
import { createClient } from '@supabase/supabase-js';

// 從 Vite 環境變數讀取（build 時注入；production 部署需在 build 前設定）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 環境變數未設定（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY），登入與同步功能將不可用。');
}

// createClient 不允許空字串 key，缺少時使用佔位值避免載入時拋錯；實際請求會失敗，需在環境中設定正確 key
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key-required-in-env';

// 建立單例客戶端，供 Layout（登入）與 syncService（CRUD）共用
export const supabase = createClient(url, key, {
  auth: {
    // 持久化 session 到 localStorage，支援多分頁與重新整理
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase;
