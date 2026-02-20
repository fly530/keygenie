-- 問題回報表：供設定頁「回報問題」寫入，取代原後端 /api/reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 允許任何人（含未登入）提交一筆回報；僅允許 insert，不開放 select 給 anon
CREATE POLICY "reports_insert_anon" ON public.reports FOR INSERT WITH CHECK (true);
-- 登入使用者可選填 user_id，查詢僅能看自己的（若需後台管理請用 service_role）
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = user_id);
