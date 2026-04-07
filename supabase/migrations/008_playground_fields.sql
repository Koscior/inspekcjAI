-- 008: Add playground-specific fields to inspections table
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS pg_liczba_urzadzen TEXT,
  ADD COLUMN IF NOT EXISTS pg_rodzaje_urzadzen TEXT,
  ADD COLUMN IF NOT EXISTS pg_material_urzadzen TEXT,
  ADD COLUMN IF NOT EXISTS pg_nawierzchnia TEXT,
  ADD COLUMN IF NOT EXISTS pg_nawierzchnia_pod_urzadzeniami TEXT,
  ADD COLUMN IF NOT EXISTS pg_mocowanie_urzadzen TEXT,
  ADD COLUMN IF NOT EXISTS pg_ogrodzenie TEXT,
  ADD COLUMN IF NOT EXISTS pg_naslonecznienie TEXT;
