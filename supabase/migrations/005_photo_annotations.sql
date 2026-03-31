-- Add annotations JSONB column to photos table
-- Stores drawing strokes for re-editing; annotated_path stores the composited image
ALTER TABLE photos ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT NULL;

COMMENT ON COLUMN photos.annotations IS 'JSON structure: { strokes: [...], version: 1 } for re-editable annotations';
