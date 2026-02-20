# KeyGenie

[English](README.md)

基於主密碼的確定性密碼生成器，零知識架構、可選雲端同步。

## 功能要點

- **本地生成**：密碼在您裝置上以 Argon2id 即時計算，不儲存主密碼與生成的密碼
- **零知識**：主密碼與最終密碼絕不上傳；僅在您選擇登入時，將非敏感的「網站標籤與帳號名稱」同步至 Supabase
- **跨裝置**：可選 Google 登入，收藏標籤同步至 Supabase，方便多裝置使用

## 快速開始

```bash
cd frontend
npm install
cp .env.example .env   # 選用：需雲端同步或回報問題時再填自己的值
npm run dev
```

開發伺服器預設為 `http://localhost:5173`。

## 文檔

- [前端專案說明與開發指南](frontend/README.md)
- [密碼生成邏輯](docs/password-generation-logic.zh-TW.md)
- [Supabase 設定](supabase/SUPABASE_SETUP.md)（選用，用於雲端同步與回報問題）

## 授權

本專案採用 [MIT License](LICENSE)。
