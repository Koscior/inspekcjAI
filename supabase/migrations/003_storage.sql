-- InspekcjAI — Storage Buckets
-- Migration: 003_storage.sql

INSERT INTO storage.buckets (id, name, public) VALUES
  ('photos',       'photos',       false),
  ('floor-plans',  'floor-plans',  false),
  ('voice-notes',  'voice-notes',  false),
  ('report-pdfs',  'report-pdfs',  false),
  ('branding',     'branding',     true);

-- Storage RLS policies
-- Photos bucket
CREATE POLICY "Users manage own photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Floor plans bucket
CREATE POLICY "Users manage own floor plans"
  ON storage.objects FOR ALL
  USING (bucket_id = 'floor-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Voice notes bucket
CREATE POLICY "Users manage own voice notes"
  ON storage.objects FOR ALL
  USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Report PDFs bucket
CREATE POLICY "Users manage own reports"
  ON storage.objects FOR ALL
  USING (bucket_id = 'report-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Branding bucket (public read, authenticated write)
CREATE POLICY "Public read branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "Users manage own branding"
  ON storage.objects FOR ALL
  USING (bucket_id = 'branding' AND auth.uid()::text = (storage.foldername(name))[1]);
