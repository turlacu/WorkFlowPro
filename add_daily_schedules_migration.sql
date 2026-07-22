-- Migration: Add DailySchedule table
-- This migration creates the daily_schedules table for the Today's Schedule Dashboard

-- Create daily_schedules table
CREATE TABLE "daily_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    -- Add foreign key constraint
    CONSTRAINT "daily_schedules_uploadedBy_fkey" 
        FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create unique index on date (only one schedule per date)
CREATE UNIQUE INDEX "daily_schedules_date_key" ON "daily_schedules"("date");

-- Create index on uploadedBy for performance
CREATE INDEX "daily_schedules_uploadedBy_idx" ON "daily_schedules"("uploadedBy");

-- Create index on date for calendar queries
CREATE INDEX "daily_schedules_date_idx" ON "daily_schedules"("date");