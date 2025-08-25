-- Jizai Vault Subscription System - Database Schema
-- Compatible with Supabase/PostgreSQL
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE SUBSCRIPTION TABLES
-- ============================================================================

-- Subscription plans/tiers
CREATE TABLE vault_subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE CHECK (plan_key IN ('lite', 'standard', 'pro')),
  display_name text NOT NULL,
  product_id text NOT NULL, -- com.jizai.vault.lite.month etc.
  storage_quota_gb integer NOT NULL,
  max_devices integer NOT NULL DEFAULT 2,
  max_recipients integer NOT NULL DEFAULT 1,
  price_monthly_jpy integer NOT NULL, -- ¥480, ¥980, ¥1980
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE vault_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- Device ID from existing system
  plan_key text NOT NULL REFERENCES vault_subscription_tiers(plan_key),
  status text NOT NULL CHECK (status IN ('active', 'in_grace', 'past_due', 'canceled', 'trial', 'expired')),
  
  -- Subscription lifecycle
  trial_start_at timestamptz,
  trial_end_at timestamptz,
  subscription_start_at timestamptz,
  renews_at timestamptz,
  grace_period_end_at timestamptz,
  canceled_at timestamptz,
  deletion_scheduled_at timestamptz, -- 90 days after grace expires
  
  -- App Store fields
  original_transaction_id text UNIQUE, -- Apple's identifier
  app_account_token text, -- Links to user_id
  product_id text NOT NULL,
  auto_renew_status boolean DEFAULT true,
  
  -- Storage tracking
  storage_quota_gb integer NOT NULL,
  storage_used_bytes bigint DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one active subscription per user
  UNIQUE(user_id) WHERE status IN ('active', 'trial', 'in_grace')
);

-- App Store Server Notifications audit log
CREATE TABLE app_store_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_uuid text UNIQUE NOT NULL,
  notification_type text NOT NULL,
  notification_subtype text,
  original_transaction_id text,
  
  -- Full payload for debugging
  raw_payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  processing_status text CHECK (processing_status IN ('success', 'failed', 'skipped')) DEFAULT 'success',
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- VAULT AND FAMILY SHARING TABLES  
-- ============================================================================

-- Main vaults (memorial containers)
CREATE TABLE vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL, -- Device ID
  subscription_id uuid REFERENCES vault_subscriptions(id) ON DELETE SET NULL,
  
  -- Vault metadata
  name text NOT NULL,
  description text,
  cover_image_url text,
  is_public boolean DEFAULT false,
  
  -- Storage tracking
  used_bytes bigint DEFAULT 0,
  file_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- Soft delete for 90-day grace
);

-- Family members (people who can access vaults)
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  
  -- Contact information
  email text NOT NULL,
  name text,
  phone text,
  relationship text, -- "mother", "father", "sibling", etc.
  
  -- Status and verification
  status text NOT NULL CHECK (status IN ('invited', 'verified', 'blocked')) DEFAULT 'invited',
  invite_code text UNIQUE,
  invite_expires_at timestamptz,
  verified_at timestamptz,
  blocked_at timestamptz,
  block_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One family member record per email per vault
  UNIQUE(vault_id, email)
);

-- Family verification requests (owner approval process)
CREATE TABLE family_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  
  verification_method text NOT NULL CHECK (verification_method IN ('owner_approve', 'sms_otp', 'ekyc')),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Supporting data
  verification_data jsonb, -- SMS codes, KYC documents, etc.
  reviewer_notes text,
  decision_reason text,
  
  created_at timestamptz DEFAULT now(),
  decided_at timestamptz,
  decided_by text -- owner device_id
);

-- Access requests (family asking for vault access)
CREATE TABLE access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  
  -- What they want to access
  scope jsonb NOT NULL, -- {"type":"all"} or {"albums":["uuid1","uuid2"]}
  actions text[] NOT NULL DEFAULT ARRAY['view', 'download'],
  
  -- How long they want access
  period jsonb NOT NULL, -- {"days":7} or {"from":"2024-01-01","to":"2024-01-08"}
  requested_reason text,
  
  -- Request lifecycle
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')) DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by text, -- owner device_id
  review_notes text,
  
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz -- Auto-expire old requests
);

-- Active access grants (approved access with time limits)
CREATE TABLE access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_request_id uuid NOT NULL REFERENCES access_requests(id) ON DELETE CASCADE,
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  family_member_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  
  -- Granted permissions (copied from request)
  scope jsonb NOT NULL,
  actions text[] NOT NULL,
  
  -- Active period
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoked_by text, -- owner device_id
  revoke_reason text,
  
  -- Usage tracking
  last_accessed_at timestamptz,
  download_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- MEMORY STORAGE TABLES
-- ============================================================================

-- Memory albums/collections
CREATE TABLE memory_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_memory_id uuid, -- References memories(id)
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual memories (files)
CREATE TABLE memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  album_id uuid REFERENCES memory_albums(id) ON DELETE SET NULL,
  
  -- File metadata
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  file_url text NOT NULL, -- Supabase Storage URL
  thumbnail_url text,
  
  -- Content metadata
  title text,
  description text,
  date_taken timestamptz,
  location_name text,
  people_tags text[], -- Names of people in photo
  
  -- Search and discovery
  search_text text, -- Generated from title + description + tags
  content_hash text, -- For deduplication
  
  -- Processing status
  processing_status text CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_error text,
  
  -- Upload tracking
  uploaded_by text NOT NULL, -- Device ID
  uploaded_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- Soft delete
);

-- ============================================================================
-- PRINT EXPORT TABLES
-- ============================================================================

-- Print size definitions
CREATE TABLE print_sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  size_key text UNIQUE NOT NULL, -- 'yotsugiri', 'a4', 'l', 'small_cabinet', '2l'
  display_name text NOT NULL, -- '四つ切り', 'A4', 'L判', etc.
  width_mm integer NOT NULL,
  height_mm integer NOT NULL,
  category text NOT NULL DEFAULT 'standard', -- 'standard', 'poster', 'card'
  popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Print export jobs
CREATE TABLE print_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  memory_id uuid NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, -- Device ID
  
  -- Export settings
  size_key text NOT NULL REFERENCES print_sizes(size_key),
  dpi integer NOT NULL CHECK (dpi IN (300, 350)),
  bleed_mm integer DEFAULT 3,
  mode text NOT NULL CHECK (mode IN ('fit', 'fill')) DEFAULT 'fill',
  frame_mm integer DEFAULT 0,
  frame_color text DEFAULT '#000000',
  
  -- Output
  output_format text NOT NULL CHECK (output_format IN ('jpeg', 'tiff')) DEFAULT 'jpeg',
  output_width_px integer,
  output_height_px integer,
  output_file_url text,
  output_file_size_bytes bigint,
  
  -- Job status
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
  progress_percent integer DEFAULT 0,
  error_message text,
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz, -- Download link expiry
  
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Subscription indexes
CREATE INDEX idx_vault_subscriptions_user_id ON vault_subscriptions(user_id);
CREATE INDEX idx_vault_subscriptions_status ON vault_subscriptions(status);
CREATE INDEX idx_vault_subscriptions_original_transaction_id ON vault_subscriptions(original_transaction_id);
CREATE INDEX idx_vault_subscriptions_deletion_scheduled ON vault_subscriptions(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;

-- Vault and family indexes
CREATE INDEX idx_vaults_owner_id ON vaults(owner_id);
CREATE INDEX idx_vaults_subscription_id ON vaults(subscription_id);
CREATE INDEX idx_family_members_vault_id ON family_members(vault_id);
CREATE INDEX idx_family_members_email ON family_members(email);
CREATE INDEX idx_family_members_status ON family_members(status);

-- Access control indexes
CREATE INDEX idx_access_requests_vault_id ON access_requests(vault_id);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_grants_family_member_id ON access_grants(family_member_id);
CREATE INDEX idx_access_grants_active ON access_grants(starts_at, ends_at) WHERE revoked_at IS NULL;

-- Memory indexes
CREATE INDEX idx_memories_vault_id ON memories(vault_id);
CREATE INDEX idx_memories_album_id ON memories(album_id);
CREATE INDEX idx_memories_search_text ON memories USING gin(to_tsvector('english', search_text));
CREATE INDEX idx_memories_date_taken ON memories(date_taken);
CREATE INDEX idx_memories_uploaded_at ON memories(uploaded_at);

-- Print export indexes
CREATE INDEX idx_print_exports_user_id ON print_exports(user_id);
CREATE INDEX idx_print_exports_status ON print_exports(status);
CREATE INDEX idx_print_exports_created_at ON print_exports(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE vault_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_exports ENABLE ROW LEVEL SECURITY;

-- Subscription policies (users can only see their own)
CREATE POLICY "Users can view own subscriptions" ON vault_subscriptions
  FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "Users can update own subscriptions" ON vault_subscriptions
  FOR UPDATE USING (user_id = current_user_id());

-- Vault policies (owners see all, family members see granted vaults)
CREATE POLICY "Owners can manage their vaults" ON vaults
  FOR ALL USING (owner_id = current_user_id());

CREATE POLICY "Family members can view granted vaults" ON vaults
  FOR SELECT USING (
    id IN (
      SELECT ag.vault_id 
      FROM access_grants ag 
      JOIN family_members fm ON ag.family_member_id = fm.id
      WHERE fm.email = current_user_email()
        AND ag.starts_at <= now() 
        AND ag.ends_at > now()
        AND ag.revoked_at IS NULL
    )
  );

-- Family member policies
CREATE POLICY "Vault owners can manage family members" ON family_members
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = current_user_id())
  );

CREATE POLICY "Family members can view their own record" ON family_members
  FOR SELECT USING (email = current_user_email());

-- Access request policies
CREATE POLICY "Vault owners can see access requests" ON access_requests
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = current_user_id())
  );

CREATE POLICY "Family members can manage their own requests" ON access_requests
  FOR ALL USING (
    family_member_id IN (
      SELECT id FROM family_members WHERE email = current_user_email()
    )
  );

-- Memory policies
CREATE POLICY "Vault owners can manage memories" ON memories
  FOR ALL USING (
    vault_id IN (SELECT id FROM vaults WHERE owner_id = current_user_id())
  );

CREATE POLICY "Family members can view granted memories" ON memories
  FOR SELECT USING (
    vault_id IN (
      SELECT ag.vault_id 
      FROM access_grants ag 
      JOIN family_members fm ON ag.family_member_id = fm.id
      WHERE fm.email = current_user_email()
        AND ag.starts_at <= now() 
        AND ag.ends_at > now()
        AND ag.revoked_at IS NULL
        AND 'view' = ANY(ag.actions)
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user ID from JWT claims
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'user_id')::uuid,
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
  );
$$;

-- Function to get current user email from JWT claims  
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (current_setting('request.jwt.claims', true)::json->>'email')::text;
$$;

-- Function to update storage usage for vault
CREATE OR REPLACE FUNCTION update_vault_storage_usage(vault_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE vaults 
  SET used_bytes = (
    SELECT COALESCE(SUM(file_size_bytes), 0)
    FROM memories 
    WHERE vault_id = vault_uuid 
      AND deleted_at IS NULL
  ),
  file_count = (
    SELECT COUNT(*)
    FROM memories 
    WHERE vault_id = vault_uuid 
      AND deleted_at IS NULL
  ),
  updated_at = now()
  WHERE id = vault_uuid;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update storage usage when memories change
CREATE OR REPLACE FUNCTION trigger_update_vault_storage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_vault_storage_usage(NEW.vault_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM update_vault_storage_usage(NEW.vault_id);
    IF OLD.vault_id != NEW.vault_id THEN
      PERFORM update_vault_storage_usage(OLD.vault_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_vault_storage_usage(OLD.vault_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER memories_update_vault_storage
  AFTER INSERT OR UPDATE OR DELETE ON memories
  FOR EACH ROW EXECUTE FUNCTION trigger_update_vault_storage();

-- Auto-update subscription storage usage
CREATE OR REPLACE FUNCTION trigger_update_subscription_storage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE vault_subscriptions 
    SET storage_used_bytes = (
      SELECT COALESCE(SUM(used_bytes), 0)
      FROM vaults 
      WHERE owner_id = NEW.owner_id
        AND deleted_at IS NULL
    ),
    updated_at = now()
    WHERE user_id = NEW.owner_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vault_subscriptions 
    SET storage_used_bytes = (
      SELECT COALESCE(SUM(used_bytes), 0)
      FROM vaults 
      WHERE owner_id = OLD.owner_id
        AND deleted_at IS NULL
    ),
    updated_at = now()
    WHERE user_id = OLD.owner_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER vaults_update_subscription_storage
  AFTER INSERT OR UPDATE OR DELETE ON vaults
  FOR EACH ROW EXECUTE FUNCTION trigger_update_subscription_storage();

-- Auto-expire access grants
CREATE OR REPLACE FUNCTION trigger_expire_access_grants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark access grants as expired if past end date
  UPDATE access_grants 
  SET revoked_at = now(),
      revoke_reason = 'Automatic expiry'
  WHERE ends_at < now() 
    AND revoked_at IS NULL;
  
  RETURN NULL;
END;
$$;

-- Run expiry check periodically (requires pg_cron extension)
-- SELECT cron.schedule('expire-access-grants', '0 * * * *', 'SELECT trigger_expire_access_grants();');

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert subscription tiers
INSERT INTO vault_subscription_tiers (plan_key, display_name, product_id, storage_quota_gb, max_devices, max_recipients, price_monthly_jpy, sort_order) VALUES
('lite', 'Lite プラン', 'com.jizai.vault.lite.month', 5, 2, 1, 480, 1),
('standard', 'Standard プラン', 'com.jizai.vault.standard.month', 25, 3, 3, 980, 2),
('pro', 'Pro プラン', 'com.jizai.vault.pro.month', 100, 5, 10, 1980, 3);

-- Insert print sizes
INSERT INTO print_sizes (size_key, display_name, width_mm, height_mm, category, popular, sort_order) VALUES
('yotsugiri', '四つ切り', 254, 305, 'standard', true, 1),
('a4', 'A4', 210, 297, 'standard', true, 2),
('l', 'L判', 89, 127, 'standard', true, 3),
('small_cabinet', '小キャビネ', 120, 165, 'standard', false, 4),
('2l', '2L', 127, 178, 'standard', false, 5),
('postcard', 'ポストカード', 100, 148, 'card', false, 6),
('business_card', '名刺', 55, 91, 'card', false, 7);

-- ============================================================================
-- SCHEDULED CLEANUP JOBS (requires pg_cron extension)
-- ============================================================================

-- Daily cleanup of expired invitations
SELECT cron.schedule(
  'cleanup-expired-invitations',
  '0 2 * * *', -- 2 AM daily
  $$
  DELETE FROM family_members 
  WHERE status = 'invited' 
    AND invite_expires_at < now() - INTERVAL '7 days';
  $$
);

-- Daily cleanup of old print exports  
SELECT cron.schedule(
  'cleanup-old-print-exports',
  '0 3 * * *', -- 3 AM daily
  $$
  DELETE FROM print_exports 
  WHERE status IN ('completed', 'failed')
    AND created_at < now() - INTERVAL '30 days';
  $$
);

-- Weekly cleanup of cancelled subscriptions past deletion date
SELECT cron.schedule(
  'cleanup-deleted-subscriptions', 
  '0 4 * * 0', -- 4 AM on Sundays
  $$
  DELETE FROM vault_subscriptions 
  WHERE status = 'canceled'
    AND deletion_scheduled_at < now();
  $$
);

COMMENT ON TABLE vault_subscriptions IS 'Core subscription management with App Store integration';
COMMENT ON TABLE vaults IS 'Memorial containers with family sharing capabilities';  
COMMENT ON TABLE family_members IS 'Family members who can request vault access';
COMMENT ON TABLE access_grants IS 'Time-limited access permissions for family members';
COMMENT ON TABLE memories IS 'Individual files stored in vaults with rich metadata';
COMMENT ON TABLE print_exports IS 'Print job processing with multiple formats and DPI options';