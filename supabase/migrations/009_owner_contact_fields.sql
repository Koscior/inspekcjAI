-- 009: Owner/manager contact fields for playground inspections
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS owner_address TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS owner_email TEXT;
