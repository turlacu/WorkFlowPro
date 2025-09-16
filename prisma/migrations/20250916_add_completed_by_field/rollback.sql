-- Rollback script for completedById field addition
-- Remove foreign key constraint first
ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_completedById_fkey";

-- Remove the column
ALTER TABLE "assignments" DROP COLUMN IF EXISTS "completedById";