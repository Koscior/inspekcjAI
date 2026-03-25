-- InspekcjAI — Initial Schema
-- Migration: 001_initial_schema.sql

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ─── Sequence for report numbers ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS report_number_seq START 1;

-- ─── Companies ────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  nip         TEXT,
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id                        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                     TEXT NOT NULL,
  full_name                 TEXT NOT NULL DEFAULT '',
  role                      TEXT NOT NULL DEFAULT 'inspector'
                              CHECK (role IN ('inspector','company_admin','company_inspector')),
  company_id                UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name              TEXT,
  license_number            TEXT,       -- Nr uprawnień budowlanych
  poiib_number              TEXT,       -- Nr członkowski POIIB
  phone                     TEXT,
  logo_url                  TEXT,
  signature_url             TEXT,
  cert_urls                 TEXT[]      DEFAULT '{}',
  subscription_plan         TEXT NOT NULL DEFAULT 'free'
                              CHECK (subscription_plan IN ('free','pro','company')),
  stripe_customer_id        TEXT,
  stripe_subscription_id    TEXT,
  reports_used_this_month   INT NOT NULL DEFAULT 0,
  reports_reset_at          TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  onboarding_complete       BOOLEAN DEFAULT FALSE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Clients ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Inspections ──────────────────────────────────────────────────────────────
CREATE TABLE inspections (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id                 UUID REFERENCES clients(id) ON DELETE SET NULL,
  type                      TEXT NOT NULL
                              CHECK (type IN ('roczny','piecioletni','plac_zabaw','odbior_mieszkania','ogolna')),
  status                    TEXT NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','in_progress','completed','sent')),
  reference_number          TEXT UNIQUE,         -- INS/2025/001
  title                     TEXT NOT NULL,
  address                   TEXT NOT NULL DEFAULT '',
  building_type             TEXT,
  construction_type         TEXT,
  owner_name                TEXT,
  manager_name              TEXT,
  investor_name             TEXT,
  contractor_name           TEXT,
  inspection_date           DATE,
  next_inspection_date      DATE,
  previous_protocol_notes   TEXT,                -- Wnioski z poprzedniej kontroli
  completed_works           TEXT,                -- Zakres wykonanych robót
  tenant_complaints         TEXT,                -- Zgłoszenia użytkowników
  incomplete_works          TEXT,                -- Niewykonane roboty
  building_docs_status      TEXT CHECK (building_docs_status IN ('complete','incomplete','missing')),
  usage_docs_status         TEXT CHECK (usage_docs_status IN ('complete','incomplete','missing')),
  building_log_status       TEXT CHECK (building_log_status IN ('maintained','incomplete','missing')),
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Defects ──────────────────────────────────────────────────────────────────
CREATE TABLE defects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id     UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  number            INT NOT NULL,               -- sequential within inspection
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL DEFAULT 'usterka'
                      CHECK (type IN ('usterka','uwaga','zalecenie')),
  severity          TEXT NOT NULL DEFAULT 'minor'
                      CHECK (severity IN ('critical','serious','minor')),
  category          TEXT,
  status            TEXT NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','closed')),
  contractor        TEXT,
  responsible_person TEXT,
  reporter_name     TEXT,
  deadline          DATE,
  location_label    TEXT,
  floor_plan_id     UUID,                       -- FK added after floor_plans table
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (inspection_id, number)
);

-- ─── Photos ───────────────────────────────────────────────────────────────────
CREATE TABLE photos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id       UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  defect_id           UUID REFERENCES defects(id) ON DELETE SET NULL,
  checklist_item_id   UUID,                     -- FK added after checklist_items
  original_path       TEXT NOT NULL,
  annotated_path      TEXT,
  thumbnail_path      TEXT,
  caption             TEXT,
  photo_number        INT NOT NULL,             -- Fot. N
  ai_analysis         JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Floor Plans ──────────────────────────────────────────────────────────────
CREATE TABLE floor_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id   UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,                -- "Parter", "Piętro 1", etc.
  storage_path    TEXT NOT NULL,
  file_type       TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image','pdf')),
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pins ─────────────────────────────────────────────────────────────────────
CREATE TABLE pins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_plan_id   UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  defect_id       UUID REFERENCES defects(id) ON DELETE CASCADE,
  x_percent       NUMERIC(5,2) NOT NULL,        -- 0.00 - 100.00
  y_percent       NUMERIC(5,2) NOT NULL,
  label_number    INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from defects to floor_plans
ALTER TABLE defects ADD CONSTRAINT fk_defect_floor_plan
  FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id) ON DELETE SET NULL;

-- ─── Checklist Templates ──────────────────────────────────────────────────────
CREATE TABLE checklist_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_type TEXT NOT NULL
                    CHECK (inspection_type IN ('roczny','piecioletni','plac_zabaw','odbior_mieszkania','ogolna')),
  section         TEXT NOT NULL,
  element_name    TEXT NOT NULL,
  legal_basis     TEXT,
  sort_order      INT NOT NULL DEFAULT 0
);

-- ─── Checklist Items ──────────────────────────────────────────────────────────
CREATE TABLE checklist_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id     UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES checklist_templates(id) ON DELETE SET NULL,
  section           TEXT NOT NULL,
  element_name      TEXT NOT NULL,
  status            TEXT CHECK (status IN ('ok','nok','nie_dotyczy')),
  state             TEXT CHECK (state IN ('dobry','sredni','dostateczny','nie_dotyczy')),
  state_description TEXT,
  notes             TEXT,
  photo_refs        UUID[]  DEFAULT '{}',
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from photos to checklist_items
ALTER TABLE photos ADD CONSTRAINT fk_photo_checklist_item
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE SET NULL;

-- ─── Voice Notes ──────────────────────────────────────────────────────────────
CREATE TABLE voice_notes (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id               UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  defect_id                   UUID REFERENCES defects(id) ON DELETE SET NULL,
  storage_path                TEXT NOT NULL,
  duration_seconds            INT,
  transcription_raw           TEXT,
  transcription_professional  TEXT,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id           UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  report_number           TEXT NOT NULL,          -- INS/2025/001
  report_type             TEXT NOT NULL
                            CHECK (report_type IN ('techniczny','zadania','protokol')),
  pdf_path                TEXT,
  inspector_signature_url TEXT,
  client_signature_url    TEXT,
  client_signed_at        TIMESTAMPTZ,
  version                 INT NOT NULL DEFAULT 1,
  sent_at                 TIMESTAMPTZ,
  recipient_email         TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscription Plans ───────────────────────────────────────────────────────
CREATE TABLE subscription_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL UNIQUE,
  label             TEXT NOT NULL,
  price_pln         INT NOT NULL DEFAULT 0,
  report_limit      INT,                          -- NULL = unlimited
  inspector_limit   INT,                          -- NULL = unlimited
  stripe_price_id   TEXT,
  features          TEXT[] DEFAULT '{}'
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_inspections_user_id     ON inspections(user_id);
CREATE INDEX idx_inspections_client_id   ON inspections(client_id);
CREATE INDEX idx_inspections_type        ON inspections(type);
CREATE INDEX idx_defects_inspection_id   ON defects(inspection_id);
CREATE INDEX idx_photos_inspection_id    ON photos(inspection_id);
CREATE INDEX idx_photos_defect_id        ON photos(defect_id);
CREATE INDEX idx_pins_floor_plan_id      ON pins(floor_plan_id);
CREATE INDEX idx_checklist_items_inspection ON checklist_items(inspection_id);
CREATE INDEX idx_clients_user_id         ON clients(user_id);
CREATE INDEX idx_reports_inspection_id   ON reports(inspection_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at     BEFORE UPDATE ON clients     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_defects_updated_at     BEFORE UPDATE ON defects     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_checklist_updated_at   BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Monthly report counter reset (pg_cron) ──────────────────────────────────
SELECT cron.schedule(
  'reset-monthly-report-counter',
  '0 0 1 * *',
  $$UPDATE profiles SET reports_used_this_month = 0, reports_reset_at = DATE_TRUNC('month', NOW()) WHERE DATE_TRUNC('month', reports_reset_at) < DATE_TRUNC('month', NOW())$$
);
