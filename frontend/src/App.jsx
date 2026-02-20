import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CustomProvider } from 'rsuite';
import Layout from './components/Layout';
import { SyncProvider } from './contexts/SyncContext';

// 路由级别的代码分割
const GeneratePassword = lazy(() => import('./pages/GeneratePassword'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// 滚动恢复组件
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 路由切换时，平滑滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 使用 instant 避免动画导致的抖动
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <CustomProvider theme="dark">
      <SyncProvider>
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>載入中...</div>}>
            <Routes>
              <Route path="/" element={<Favorites />} />
              <Route path="/generate" element={<GeneratePassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </SyncProvider>
    </CustomProvider>
  );
}

export default App;
