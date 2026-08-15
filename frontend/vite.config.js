import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('rsuite')) {
              return 'rsuite-vendor';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000 // 提高警告閾值到 1MB
  },
  server: {
    host: '0.0.0.0', // 允許區網存取
    port: 3000
    // API 由環境變數 VITE_API_URL 設定；開發時若有使用 ngrok 等，可在此加入 allowedHosts
  }
});

