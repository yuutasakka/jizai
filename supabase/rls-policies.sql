-- =====================================================================================
-- JIZAI アプリケーション用 RLS (Row Level Security) ポリシー設定
-- =====================================================================================
-- このファイルをSupabase SQL Editorで実行してセキュリティポリシーを設定します

-- =====================================================================================
-- 画像ストレージ用ポリシー (Storage)
-- =====================================================================================

-- imagesバケットでRLSを有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のフォルダにのみ画像をアップロード可能
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ユーザーが自分の画像のみ削除可能
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ユーザーが自分の画像のみ更新可能
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 認証済みユーザーは全ての公開画像を表示可能
CREATE POLICY "Authenticated users can view all images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
);

-- 匿名ユーザーはexamplesフォルダの画像のみ表示可能
CREATE POLICY "Anonymous users can view example images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[2] = 'examples'
);

-- =====================================================================================
-- ユーザープロファイル用テーブル（作成する場合）
-- =====================================================================================

-- ユーザープロファイルテーブルの作成（例）
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロファイルのみアクセス可能
CREATE POLICY "Users can view and edit their own profile"
ON public.user_profiles FOR ALL
USING (auth.uid() = id);

-- 認証済みユーザーは他のユーザーのプロファイルを表示可能（編集不可）
CREATE POLICY "Authenticated users can view other profiles"
ON public.user_profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================================================
-- 画像メタデータ用テーブル（作成する場合）
-- =====================================================================================

-- 画像メタデータテーブルの作成（例）
CREATE TABLE IF NOT EXISTS public.images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    original_name TEXT,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    mime_type TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の画像のみ管理可能
CREATE POLICY "Users can manage their own images"
ON public.images FOR ALL
USING (auth.uid() = user_id);

-- 認証済みユーザーは公開画像を表示可能
CREATE POLICY "Authenticated users can view public images"
ON public.images FOR SELECT
USING (
    auth.role() = 'authenticated' 
    AND is_public = TRUE
);

-- 匿名ユーザーはexamplesカテゴリの公開画像のみ表示可能
CREATE POLICY "Anonymous users can view example images only"
ON public.images FOR SELECT
USING (
    category = 'examples' 
    AND is_public = TRUE
);

-- =====================================================================================
-- AI生成履歴用テーブル（作成する場合）
-- =====================================================================================

-- AI生成履歴テーブルの作成（例）
CREATE TABLE IF NOT EXISTS public.generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    original_image_id UUID REFERENCES public.images ON DELETE CASCADE,
    generated_image_id UUID REFERENCES public.images ON DELETE CASCADE,
    prompt_text TEXT,
    parameters JSONB,
    processing_time INTEGER,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の生成履歴のみアクセス可能
CREATE POLICY "Users can access their own generation history"
ON public.generation_history FOR ALL
USING (auth.uid() = user_id);

-- =====================================================================================
-- 使用統計用テーブル（作成する場合）
-- =====================================================================================

-- 使用統計テーブルの作成（例）
CREATE TABLE IF NOT EXISTS public.usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL, -- 'upload', 'generate', 'download' など
    resource_type TEXT, -- 'image', 'storage' など
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の使用統計のみアクセス可能
CREATE POLICY "Users can access their own usage stats"
ON public.usage_stats FOR ALL
USING (auth.uid() = user_id);

-- 管理者は全ての統計を表示可能（サービスロールのみ）
CREATE POLICY "Service role can access all usage stats"
ON public.usage_stats FOR SELECT
USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================================================
-- インデックスの作成（パフォーマンス向上）
-- =====================================================================================

-- よく使用されるクエリ用のインデックス
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_category ON public.images(category);
CREATE INDEX IF NOT EXISTS idx_images_is_public ON public.images(is_public);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at);

CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON public.generation_history(created_at);

CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_action_type ON public.usage_stats(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_stats_created_at ON public.usage_stats(created_at);

-- =====================================================================================
-- リアルタイム機能の有効化
-- =====================================================================================

-- テーブルでリアルタイム機能を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE public.images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_history;

-- =====================================================================================
-- 関数の作成（便利な機能）
-- =====================================================================================

-- ユーザーの画像数を取得する関数
CREATE OR REPLACE FUNCTION get_user_image_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.images
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーのストレージ使用量を取得する関数
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(file_size), 0)
        FROM public.images
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- トリガーの作成（自動更新）
-- =====================================================================================

-- updated_at カラムを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの適用
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON public.images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- 設定完了の確認
-- =====================================================================================

-- RLS有効化状態の確認クエリ
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ポリシー一覧の確認クエリ
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;