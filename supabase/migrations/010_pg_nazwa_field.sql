-- Add playground name field
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pg_nazwa TEXT;
