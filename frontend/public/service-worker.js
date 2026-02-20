const CACHE_NAME = 'keygenie-v5';
const urlsToCache = [
  '/',
  '/generate',
  '/tutorial',
  '/src/main.jsx',
  '/src/styles/theme.css'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  // 强制立即进入等待状态，而不是等待旧的 SW 停止
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // 删除旧缓存
        ...cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        }),
        // 立即接管所有客户端
        self.clients.claim()
      ]);
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const request = event.request;
  let url;

  // 早期检查：跳过不支持缓存的协议
  try {
    url = new URL(request.url);

    // 跳过不支持缓存的协议（chrome-extension, chrome, edge 等）
    if (url.protocol === 'chrome-extension:' ||
      url.protocol === 'chrome:' ||
      url.protocol === 'edge:' ||
      url.protocol === 'moz-extension:' ||
      (url.protocol !== 'http:' && url.protocol !== 'https:')) {
      // 直接返回，不处理这些请求，让浏览器正常处理
      return;
    }

    // 开发模式下，跳过 Vite 的 HMR 和模块请求
    if (url.pathname.includes('/node_modules/') ||
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/@id/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.ts') ||
      url.pathname.endsWith('.tsx') ||
      url.pathname === '/manifest.json' ||
      url.search.includes('?import') ||
      url.search.includes('&import')) {
      // 让开发服务器直接处理这些请求
      return;
    }
  } catch (e) {
    // URL 解析失败，跳过
    return;
  }

  // 如果 URL 解析失败，url 变量可能未定义，直接返回
  if (!url) {
    return;
  }

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 对于 HTML 页面 (Navigation 请求)，使用 Network First 策略
  // 这样可以确保用户总是获取最新的 index.html，避免旧的 JS hash 问题
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 网络请求成功，更新缓存并返回
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // 网络请求失败，使用缓存
          return caches.match(request);
        })
    );
    return;
  }

  // 其他资源使用 Cache First 策略
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // 如果在缓存中找到，返回缓存版本
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(request).then((response) => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // 只缓存同源请求，并且再次检查协议
          // 不缓存模块脚本和开发服务器资源
          if (url && url.origin === self.location.origin &&
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            !url.pathname.includes('/node_modules/') &&
            !url.pathname.includes('/@vite/') &&
            !url.pathname.includes('/@react-refresh') &&
            !url.pathname.includes('/@id/') &&
            !url.search.includes('?import') &&
            !url.search.includes('&import')) {
            // 克隆响应
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache).catch((err) => {
                // 忽略缓存错误
              });
            });
          }
          return response;
        });
      })
      .catch(() => {
        // 网络失败时，可以返回离线页面
        return new Response('离线模式', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

