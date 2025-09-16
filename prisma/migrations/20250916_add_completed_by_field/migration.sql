-- Add completedById column to assignments table
ALTER TABLE "assignments" ADD COLUMN "completedById" TEXT;

-- Add foreign key constraint for completedById
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;