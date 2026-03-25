-- InspekcjAI — Row Level Security Policies
-- Migration: 002_rls.sql

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins              ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── Companies ────────────────────────────────────────────────────────────────
CREATE POLICY "Company members can view company"
  ON companies FOR SELECT USING (
    auth.uid() = admin_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = companies.id)
  );

CREATE POLICY "Admin can update company"
  ON companies FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Anyone can create company"
  ON companies FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- ─── Clients ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users see own clients"
  ON clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert clients"
  ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE USING (auth.uid() = user_id);

-- ─── Inspections ──────────────────────────────────────────────────────────────
CREATE POLICY "Users see own inspections"
  ON inspections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert inspections"
  ON inspections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections"
  ON inspections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspections"
  ON inspections FOR DELETE USING (auth.uid() = user_id);

-- ─── Defects ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users see defects via inspection"
  ON defects FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = defects.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert defects"
  ON defects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update defects"
  ON defects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = defects.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete defects"
  ON defects FOR DELETE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = defects.inspection_id AND user_id = auth.uid())
  );

-- ─── Photos ───────────────────────────────────────────────────────────────────
CREATE POLICY "Users see photos via inspection"
  ON photos FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = photos.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert photos"
  ON photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update photos"
  ON photos FOR UPDATE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = photos.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete photos"
  ON photos FOR DELETE USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = photos.inspection_id AND user_id = auth.uid())
  );

-- ─── Floor Plans ──────────────────────────────────────────────────────────────
CREATE POLICY "Users see floor plans via inspection"
  ON floor_plans FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = floor_plans.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage floor plans"
  ON floor_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = floor_plans.inspection_id AND user_id = auth.uid())
  );

-- ─── Pins ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Users see pins via floor plan"
  ON pins FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM floor_plans fp
      JOIN inspections i ON i.id = fp.inspection_id
      WHERE fp.id = pins.floor_plan_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage pins"
  ON pins FOR ALL USING (
    EXISTS (
      SELECT 1 FROM floor_plans fp
      JOIN inspections i ON i.id = fp.inspection_id
      WHERE fp.id = pins.floor_plan_id AND i.user_id = auth.uid()
    )
  );

-- ─── Checklist Templates (public read) ───────────────────────────────────────
CREATE POLICY "Anyone can read checklist templates"
  ON checklist_templates FOR SELECT USING (true);

-- ─── Checklist Items ──────────────────────────────────────────────────────────
CREATE POLICY "Users see checklist items via inspection"
  ON checklist_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = checklist_items.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage checklist items"
  ON checklist_items FOR ALL USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = checklist_items.inspection_id AND user_id = auth.uid())
  );

-- ─── Voice Notes ──────────────────────────────────────────────────────────────
CREATE POLICY "Users see voice notes via inspection"
  ON voice_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = voice_notes.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage voice notes"
  ON voice_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = voice_notes.inspection_id AND user_id = auth.uid())
  );

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users see reports via inspection"
  ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can manage reports"
  ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM inspections WHERE id = reports.inspection_id AND user_id = auth.uid())
  );
