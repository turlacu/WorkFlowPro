-- Manual migration script to add completedById field to assignments table
-- Run this directly on your PostgreSQL database

-- Check if the column already exists before adding it
DO $$ 
BEGIN 
    -- Add completedById column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' 
        AND column_name = 'completedById'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "assignments" ADD COLUMN "completedById" TEXT;
        
        -- Add foreign key constraint
        ALTER TABLE "assignments" ADD CONSTRAINT "assignments_completedById_fkey" 
        FOREIGN KEY ("completedById") REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
        
        RAISE NOTICE 'Added completedById column and foreign key constraint to assignments table';
    ELSE
        RAISE NOTICE 'completedById column already exists in assignments table';
    END IF;
END $$;