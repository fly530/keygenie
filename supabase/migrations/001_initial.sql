-- KeyGenie 方案 B：favorites / groups 表與 RLS
-- 在 Supabase Dashboard → SQL Editor 執行此檔

-- 我的最愛表（與前端 camelCase 對應：site_name→siteName, group_id→groupId 等）
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name text NOT NULL,
  account text DEFAULT '',
  group_id text NOT NULL DEFAULT 'default',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- 群組表
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- 啟用 RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- favorites：僅允許該 user_id 讀寫
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_update" ON public.favorites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- groups：僅允許該 user_id 讀寫
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "groups_delete" ON public.groups FOR DELETE USING (auth.uid() = user_id);
