-- Migration: Add filePath field to daily_schedules table
-- This adds support for storing file paths for document viewing

-- Add filePath column to daily_schedules table
ALTER TABLE "daily_schedules" ADD COLUMN "filePath" TEXT;