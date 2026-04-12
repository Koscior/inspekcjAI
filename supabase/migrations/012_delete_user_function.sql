-- InspekcjAI — Self-service account deletion (RODO Art. 17)
-- Migration: 012_delete_user_function.sql
--
-- Creates a SECURITY DEFINER function that allows an authenticated user
-- to permanently delete their own account.
--
-- Cascade order:
--   auth.users → profiles, inspections (ON DELETE CASCADE)
--   inspections → defects, photos, floor_plans, checklist_items,
--                 voice_notes, reports, pins (ON DELETE CASCADE)
--
-- Note: Storage bucket files (photos, floor-plans, voice-notes, report-pdfs)
-- become orphaned — they should be cleaned up by a periodic Supabase Storage
-- lifecycle rule or a pg_cron job (future improvement).

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nie zalogowano';
  END IF;

  -- Cascade will clean profiles, inspections, defects, photos, floor_plans,
  -- checklist_items, voice_notes, reports, pins, clients.
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
