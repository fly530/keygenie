import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar, Button } from 'rsuite';
import { CgShield, CgLock, CgOptions } from 'react-icons/cg';
import { HiStar } from 'react-icons/hi';
import { useLanguage } from '../hooks/useLanguage';
import { useSync } from '../contexts/SyncContext';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import biometricAuth from '../utils/biometric';
import { supabase } from '../lib/supabaseClient';
import './Layout.css';

// 方案 B：登入狀態改由 Supabase Auth 管理，不再使用 keygenie_auth_state 作為真相來源

function Layout({ children }) {
  const location = useLocation();
  const { t } = useLanguage();
  const { isSyncing } = useSync();

  // 登入狀態與使用者資訊（來自 Supabase session）
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);

  // 將 Supabase session.user 轉成 UI 用的 { email, name, picture }
  const sessionUserToDisplay = (sessionUser) => {
    if (!sessionUser) return null;
    const meta = sessionUser.user_metadata || {};
    return {
      email: sessionUser.email,
      name: meta.full_name || meta.name || sessionUser.email || '',
      picture: meta.avatar_url || meta.picture || null
    };
  };

  // 生物辨識驗證（僅在原生 App 執行）
  const checkBiometricAuth = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const needsReauth = await biometricAuth.needsReauth();
      if (needsReauth) {
        setIsBiometricLocked(true);
        await biometricAuth.verify('请验证身份以访问 KeyGenie');
        setIsBiometricLocked(false);
      }
    } catch (error) {
      console.error('生物识别验证失败:', error);
      setIsBiometricLocked(false);
    }
  };

  // 監聽 Supabase 登入狀態（登入／登出／token 更新）
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session) {
          setIsLoggedIn(true);
          setUser(sessionUserToDisplay(session.user));
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setIsLoggedIn(false);
          setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // 訂閱 auth 狀態變化（含 OAuth 回調後）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        setIsLoggedIn(true);
        setUser(sessionUserToDisplay(session.user));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 原生 App：進入前台時檢查生物辨識
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    checkBiometricAuth();
    const listener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) await checkBiometricAuth();
      else await biometricAuth.clearVerification();
    });
    return () => listener.remove();
  }, []);

  // 從 OAuth 回調返回時，Supabase 會自動處理 hash；此處僅在必要時延遲完成 loading
  useEffect(() => {
    const hasOAuthParams = location.search.includes('code') || location.search.includes('error') || location.hash;
    if (hasOAuthParams && isLoading) {
      const t = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.search, location.hash, isLoading]);

  // 使用 Supabase Google OAuth 登入（不再呼叫後端 /api/auth/google）
  const handleGoogleLogin = async () => {
    try {
      // redirectTo：驗證完成後回到「目前網站」；未設會用 Supabase 預設 Site URL（常為 localhost）
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
      // 會導向 Google，回調後 Supabase 會導回 redirectTo，onAuthStateChange 會更新狀態
    } catch (error) {
      console.error('Google 登入失敗:', error);
      alert(`登入失敗: ${error?.message || error}`);
    }
  };

  // 登出：清除 Supabase session 與生物辨識記錄
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await biometricAuth.clearVerification();
    } catch (error) {
      console.error('登出失败:', error);
    }
    setIsLoggedIn(false);
    setUser(null);
  };

  // 生物辨識鎖定中時顯示驗證畫面
  if (isBiometricLocked) {
    return (
      <div className="layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <CgShield style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--text-primary)' }} />
          <p style={{ color: 'var(--text-primary)' }}>请验证身份以继续</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Navbar className="navbar-top">
        <Navbar.Brand>
          <CgShield className="icon-glow" style={{ marginRight: '8px', fontSize: '24px', color: 'var(--text-primary)' }} />
          <span>KeyGenie</span>
        </Navbar.Brand>
        <Navbar.Brand style={{ marginLeft: 'auto', height: '40px', display: 'flex', alignItems: 'center' }}>
          {isLoading ? (
            <div style={{ width: '1px', height: '40px' }}></div>
          ) : isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', height: '40px' }}>
              {user?.picture && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={user.picture}
                    alt={user.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: `2px solid var(--accent-safe)`
                    }}
                  />
                  {isSyncing && (
                    <div className="sync-indicator-avatar">
                      <div className="sync-spinner"></div>
                    </div>
                  )}
                </div>
              )}
              <Button appearance="subtle" onClick={handleLogout} style={{ height: '36px' }}>
                {t('logout')}
              </Button>
            </div>
          ) : (
            <Button appearance="primary" onClick={handleGoogleLogin} style={{ height: '36px' }}>
              <img
                src="https://accounts.google.com/favicon.ico"
                alt="Google"
                style={{ width: '18px', height: '18px', marginRight: '8px' }}
              />
              {t('loginWithGoogle')}
            </Button>
          )}
        </Navbar.Brand>
      </Navbar>

      <main className="main-content">{children}</main>

      <div className="navbar-bottom">
        <div className="bottom-nav">
          <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <HiStar style={{ fontSize: '20px', color: 'var(--text-primary)' }} />
            </div>
            <span>{t('navFavorites')}</span>
          </Link>
          <Link to="/generate" className={`bottom-nav-item ${location.pathname === '/generate' ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <CgLock style={{ fontSize: '20px', color: 'var(--text-primary)' }} />
            </div>
            <span>{t('navGenerate')}</span>
          </Link>
          <Link to="/settings" className={`bottom-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
            <div className="nav-icon-wrapper">
              <CgOptions style={{ fontSize: '20px', color: 'var(--text-primary)' }} />
            </div>
            <span>{t('navSettings')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Layout;
