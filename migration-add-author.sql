-- Migration: Add author field to assignments table
-- Safe to run on production database

-- Add author column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignments' AND column_name = 'author'
  ) THEN
    ALTER TABLE assignments ADD COLUMN author TEXT;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN assignments.author IS 'Optional author name for the assignment material';