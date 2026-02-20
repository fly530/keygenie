# Supabase 設定說明（雲端同步用）

若只要本地使用，可不建 Supabase；需要「跨裝置同步收藏」或「設定頁回報問題」時，再自建專案並依下列步驟設定。

## 1. 專案與金鑰

- 在 [Supabase](https://supabase.com) 建立新專案。
- **Project URL**：Dashboard → Project Settings → API → Project URL，填進前端的 `VITE_SUPABASE_URL`（若有使用）。
- **Publishable Key (anon public)**：同上頁複製「anon public」，填進前端的 `VITE_SUPABASE_ANON_KEY`。

## 2. 啟用 Google Provider（登入用）

1. 在 Supabase Dashboard 進入 **Authentication** → **Providers** → **Google**，啟用。
2. 填寫 **Client ID**、**Client Secret**（可沿用 KeyGenie 現有 Google OAuth 或新建一組）。
3. 在 **Redirect URL** 會看到如：`https://<你的專案>.supabase.co/auth/v1/callback`
4. 到 [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → 你的 OAuth 2.0 用戶端，在「已授權的重新導向 URI」加入上述 Redirect URL。

## 3. 建立資料表與 RLS

在 Dashboard 的 **SQL Editor** 中依序執行：

- `supabase/migrations/001_initial.sql`（favorites、groups）
- `supabase/migrations/002_reports.sql`（問題回報表，供設定頁使用）

執行完成後，前端直連登入、favorites/groups 與問題回報功能即就緒。
