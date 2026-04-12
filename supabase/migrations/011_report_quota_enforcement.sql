-- InspekcjAI — Report Quota Enforcement (server-side)
-- Migration: 011_report_quota_enforcement.sql
--
-- Adds:
--   1. check_report_quota(uid) function — returns TRUE if user can generate a report
--   2. increment_reports_used() trigger — auto-increments counter on report INSERT
--   3. RLS INSERT policy update — blocks insert when quota exceeded
--   4. Index on profiles(subscription_plan) for quota checks

-- ─── 1. Function: check_report_quota ─────────────────────────────────────────
--
-- Returns TRUE if the user can save another report.
-- Unlimited plans (report_limit IS NULL) always return TRUE.
-- Free plan: checks reports_used_this_month < plan.report_limit.

CREATE OR REPLACE FUNCTION check_report_quota(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan           TEXT;
  v_used           INT;
  v_limit          INT;
  v_reset_at       TIMESTAMPTZ;
BEGIN
  SELECT
    p.subscription_plan,
    p.reports_used_this_month,
    p.reports_reset_at
  INTO v_plan, v_used, v_reset_at
  FROM profiles p
  WHERE p.id = user_id;

  -- If profile not found, deny
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Reset counter if it's a new month (in case pg_cron hasn't run yet)
  IF DATE_TRUNC('month', v_reset_at) < DATE_TRUNC('month', NOW()) THEN
    UPDATE profiles
    SET reports_used_this_month = 0,
        reports_reset_at = DATE_TRUNC('month', NOW())
    WHERE id = user_id;
    v_used := 0;
  END IF;

  -- Get limit for this plan
  SELECT report_limit INTO v_limit
  FROM subscription_plans
  WHERE name = v_plan;

  -- NULL limit = unlimited (pro / company plans)
  IF v_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$;

-- ─── 2. Trigger: auto-increment reports_used_this_month ──────────────────────
--
-- Runs AFTER INSERT on reports.
-- Gets the inspector's user_id via inspection, then increments their counter.

CREATE OR REPLACE FUNCTION increment_reports_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Resolve user_id from the inspection
  SELECT user_id INTO v_user_id
  FROM inspections
  WHERE id = NEW.inspection_id;

  IF v_user_id IS NOT NULL THEN
    UPDATE profiles
    SET reports_used_this_month = reports_used_this_month + 1
    WHERE id = v_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_reports_used ON reports;
CREATE TRIGGER trg_increment_reports_used
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_reports_used();

-- ─── 3. RLS INSERT policy: enforce quota ──────────────────────────────────────
--
-- Drop the existing broad policy for INSERT and replace with quota-aware version.
-- SELECT/UPDATE/DELETE remain unrestricted (user can still view old reports).

DROP POLICY IF EXISTS "Users can manage reports" ON reports;

-- SELECT + UPDATE + DELETE: any report belonging to the user's inspection
CREATE POLICY "Users can view and update reports"
  ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update reports"
  ON reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete reports"
  ON reports FOR DELETE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
  );

-- INSERT: inspection must belong to user AND quota must not be exceeded
CREATE POLICY "Users can insert reports within quota"
  ON reports FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
    AND check_report_quota(auth.uid())
  );

-- ─── 4. Helper index ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan
  ON profiles(subscription_plan);
