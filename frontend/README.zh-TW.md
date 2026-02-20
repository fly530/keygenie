# KeyGenie 前端專案

[English](README.md)

## 專案概述

KeyGenie 是一個基於確定性密碼生成演算法的密碼管理前端應用。採用 Argon2id 金鑰派生函數（透過 WebAssembly 實作），確保相同輸入（網站名稱、帳號、主密碼）始終產生相同密碼。密碼在本地裝置上生成，不會儲存在任何伺服器上。

## 核心特性

### 1. 確定性密碼生成
- **輸入參數**：網站名稱（siteName）、帳號（account，選填）、主密碼（masterPassword）
- **輸出結果**：12–18 位密碼（含大小寫字母、數字、特殊字元）
- **特性**：相同輸入參數始終產生相同密碼
- **演算法**：Argon2id（透過 hash-wasm WebAssembly 實作）

### 2. 零知識架構
- 主密碼不會離開本地裝置
- 密碼生成過程完全在客戶端完成
- 伺服器不儲存任何密碼相關資訊

### 3. 跨平台支援
- **Web 應用**：支援現代瀏覽器（Chrome 57+, Firefox 52+, Safari 11+, Edge 16+）
- **行動應用**：透過 Capacitor 支援 Android
- **WebAssembly 需求**：必須支援 WebAssembly 才能使用密碼生成功能

## 技術棧

### 核心框架
- **React 19.2.3** - UI 框架
- **Vite 7.2.4** - 建置工具與開發伺服器
- **React Router 7.11.0** - 路由管理

### UI 元件庫
- **RSuite 6.1.1** - 企業級 React UI 元件庫
- **React Icons 5.5.0** - 圖示庫

### 密碼生成
- **hash-wasm 4.12.0** - WebAssembly 實作的雜湊演算法庫（Argon2id）

### 行動端支援
- **Capacitor 6.1.2** - 跨平台原生應用執行環境
- **@aparajita/capacitor-biometric-auth 9.1.2** - 生物辨識認證

### 其他工具
- **@dnd-kit** - 拖曳排序
- **TypeScript 5.9.3** - 型別支援（設定檔）

## 專案結構

```
frontend/
├── src/
│   ├── components/          # 可重複使用元件
│   │   ├── Layout.jsx      # 主版面元件
│   │   └── ...
│   ├── pages/               # 頁面元件
│   │   ├── GeneratePassword.jsx  # 密碼生成頁
│   │   ├── Favorites.jsx    # 收藏頁
│   │   └── Settings.jsx     # 設定頁
│   ├── contexts/            # React Context
│   │   └── SyncContext.jsx  # 同步情境
│   ├── utils/               # 工具函式
│   │   ├── passwordGenerator.js  # 密碼生成核心邏輯
│   │   ├── biometric.js    # 生物辨識工具
│   │   ├── storage.js      # 儲存工具
│   │   └── i18n.js         # 國際化
│   ├── services/            # 服務層
│   │   └── syncService.js  # 同步服務
│   ├── styles/               # 樣式
│   │   ├── theme.css       # 主題
│   │   └── mobile.css      # 行動端樣式
│   ├── hooks/               # 自訂 Hooks
│   ├── App.jsx              # 應用入口
│   └── main.jsx             # 應用啟動
├── public/                  # 靜態資源
├── android/                 # Android 原生專案
├── capacitor.config.ts      # Capacitor 設定
├── vite.config.js           # Vite 設定
├── package.json             # 依賴
└── README.md                # 本檔案
```

## 密碼生成演算法

### 演算法概述

KeyGenie 使用 **Argon2id** 產生密碼，為 2015 年密碼雜湊競賽勝出演算法。透過 WebAssembly 實作，確保所有裝置使用相同演算法，保證密碼一致性。

### 演算法參數

```javascript
{
  parallelism: 1,        // 並行度：1（適合瀏覽器單執行緒）
  iterations: 3,         // 迭代次數：3（平衡安全與速度）
  memorySize: 131072,   // 記憶體成本：128 MB (131072 KB)
  hashLength: 32,        // 雜湊長度：32 bytes (256 bits)
  outputType: 'hex'     // 輸出格式：十六進位
}
```

### 生成流程

1. **輸入正規化**：網站名稱與帳號轉小寫並 trim
2. **建構 Salt**：`${normalizedSiteName}:${normalizedAccount}`
3. **Argon2id 金鑰派生**：以主密碼與 salt 產生 256 bits 雜湊
4. **轉成十六進位**：64 個十六進位字元
5. **產生密碼字元**：
   - 前 4 字元：保證含大小寫、數字、特殊字元
   - 後 8 字元：四類字元均勻分布
   - 額外字元（可選）：依雜湊動態產生 0–6 個

### 密碼特性

- **長度**：12–18 位（動態）
- **字元集**：大寫 A–Z、小寫 a–z、數字 0–9、特殊字元 `!@#$%^&*()_+-=`
- **安全**：前 4 位保證四類都有，其餘均勻分布

### 實作位置

- **檔案**：`src/utils/passwordGenerator.js`
- **匯出**：`generatePassword(siteName, account, masterPassword)`
- **回傳**：`Promise<string>`

### 詳細說明

更多演算法細節見：[密碼生成邏輯](../docs/password-generation-logic.zh-TW.md)

## 開發指南

### 環境需求

- **Node.js**：建議 LTS（18+）
- **npm** 或 **yarn**
- **瀏覽器**：須支援 WebAssembly（Chrome 57+, Firefox 52+, Safari 11+, Edge 16+）

**環境變數**：需登入與雲端同步時，將 `.env.example` 複製為 `.env` 並填入自己的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。勿將 `.env` 提交至版控。

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

預設為 `http://localhost:5173`。

### 建置生產版

```bash
npm run build
```

輸出至 `dist/`。

### 預覽生產建置

```bash
npm run preview
```

### 部署

```bash
npm run deploy
```

需搭配 Docker Compose。

## 行動端開發（Android）

- 初始化：`npm run cap:init`、`npm run cap:add:android`
- 同步：`npm run cap:sync`
- 建置並同步：`npm run cap:build:android`
- 開啟 Android Studio：`npm run cap:open:android`

修改 Web 後先 `npm run build` 再 `npm run cap:sync`。

## 功能模組

- **密碼生成** (`/generate`)：輸入網站/帳號/主密碼，生成確定性密碼，可複製、加入收藏
- **收藏** (`/`)：已存紀錄、分組、拖曳排序、搜尋
- **設定** (`/settings`)：帳戶、同步、語言、主題、生物辨識

## 瀏覽器相容性

密碼生成**必須**支援 WebAssembly。支援：Chrome 57+, Firefox 52+, Safari 11+, Edge 16+。

## 效能

- Argon2id：桌上約 200–500ms，手機約 300ms–2s；記憶體峰值約 130 MB。
- 優化：生成時 loading、路由懶載入、快取管理。

## 安全性

零知識、確定性生成、高熵、抗暴力（記憶體+迭代）、Salt、記憶體硬、抗 GPU/ASIC。主密碼遺失無法復原；輸入會正規化。

## 國際化

支援：繁體中文（zh-TW）、簡體中文（zh-CN）、英文（en）。字串在 `src/utils/i18n.js`。

## 常見問題

- **為何需要 WebAssembly？** 確保各裝置 Argon2id 一致、效能佳。
- **生成很慢？** 200–800ms 為正常，為安全取捨。
- **主密碼忘了？** 無法復原，請自行妥善保管。

## 相關文件

- [密碼生成邏輯](../docs/password-generation-logic.zh-TW.md)
- [Android 設定](./ANDROID_SETUP.md)（若有）

## 授權

本專案採用 MIT License，詳見專案根目錄 [LICENSE](../LICENSE)。
