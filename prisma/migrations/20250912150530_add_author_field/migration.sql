-- AlterTable
-- Add optional author column to assignments table
-- This is a safe operation that can be run on existing data

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignments' AND column_name = 'author'
  ) THEN
    ALTER TABLE assignments ADD COLUMN author TEXT;
    COMMENT ON COLUMN assignments.author IS 'Optional author name for the assignment material - informational field only';
  END IF;
END $$;