-- InspekcjAI — Schema Updates v2
-- Migration: 006_v2_schema_updates.sql
-- Adds: polroczny type, technical building data, cover photo, wnioski pokontrolne,
--        field_type for checklist templates/items, yesno_value for playground

-- ─── Inspections: new columns ────────────────────────────────────────────────

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS powierzchnia_uzytkowa NUMERIC,
  ADD COLUMN IF NOT EXISTS powierzchnia_zabudowy NUMERIC,
  ADD COLUMN IF NOT EXISTS kubatura NUMERIC,
  ADD COLUMN IF NOT EXISTS kondygnacje_podziemne INTEGER,
  ADD COLUMN IF NOT EXISTS kondygnacje_nadziemne INTEGER,
  ADD COLUMN IF NOT EXISTS cover_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS wnioski_uwagi_zalecenia TEXT,
  ADD COLUMN IF NOT EXISTS pilnosc_1 TEXT,
  ADD COLUMN IF NOT EXISTS pilnosc_2 TEXT,
  ADD COLUMN IF NOT EXISTS pilnosc_3 TEXT,
  ADD COLUMN IF NOT EXISTS ocena_stanu_tekst TEXT,
  ADD COLUMN IF NOT EXISTS ocena_nadaje_sie BOOLEAN,
  ADD COLUMN IF NOT EXISTS ocena_stwierdzono_uszkodzenia BOOLEAN;

-- ─── Inspections: add 'polroczny' to type constraint ─────────────────────────

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_type_check;
ALTER TABLE inspections ADD CONSTRAINT inspections_type_check
  CHECK (type IN ('roczny','piecioletni','polroczny','plac_zabaw','odbior_mieszkania','ogolna'));

-- ─── Checklist templates: field_type column ──────────────────────────────────

ALTER TABLE checklist_templates
  ADD COLUMN IF NOT EXISTS field_type TEXT DEFAULT 'text_photos';

-- Update constraint for inspection_type to include polroczny
ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_inspection_type_check;
ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_inspection_type_check
  CHECK (inspection_type IN ('roczny','piecioletni','polroczny','plac_zabaw','odbior_mieszkania','ogolna'));

-- ─── Checklist items: new columns ────────────────────────────────────────────

ALTER TABLE checklist_items
  ADD COLUMN IF NOT EXISTS yesno_value BOOLEAN,
  ADD COLUMN IF NOT EXISTS field_type TEXT DEFAULT 'text_photos';
