-- Replace unconstrained workflow strings with database enums.
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUCER', 'OPERATOR');
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "AssignmentPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT');

ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "passwordResetRequired" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "role" = 'OPERATOR' WHERE "role" NOT IN ('ADMIN', 'PRODUCER', 'OPERATOR');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

UPDATE "shift_color_legends" SET "role" = 'OPERATOR' WHERE "role" NOT IN ('ADMIN', 'PRODUCER', 'OPERATOR');
ALTER TABLE "shift_color_legends" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "shift_color_legends" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::"UserRole");
ALTER TABLE "shift_color_legends" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

UPDATE "assignments" SET "status" = 'PENDING' WHERE "status" NOT IN ('PENDING', 'IN_PROGRESS', 'COMPLETED');
UPDATE "assignments" SET "priority" = 'NORMAL' WHERE "priority" NOT IN ('LOW', 'NORMAL', 'URGENT');
ALTER TABLE "assignments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "assignments" ALTER COLUMN "status" TYPE "AssignmentStatus" USING ("status"::"AssignmentStatus");
ALTER TABLE "assignments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "assignments" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "assignments" ALTER COLUMN "priority" TYPE "AssignmentPriority" USING ("priority"::"AssignmentPriority");
ALTER TABLE "assignments" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- This model existed in schema.prisma but was never added to the Prisma migration history.
CREATE TABLE "daily_schedules" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "filePath" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "daily_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_schedules_date_key" ON "daily_schedules"("date");
CREATE INDEX "daily_schedules_uploadedBy_idx" ON "daily_schedules"("uploadedBy");
CREATE INDEX "assignments_dueDate_idx" ON "assignments"("dueDate");
CREATE INDEX "assignments_status_completedAt_idx" ON "assignments"("status", "completedAt");
CREATE INDEX "team_schedules_date_idx" ON "team_schedules"("date");

ALTER TABLE "daily_schedules" ADD CONSTRAINT "daily_schedules_uploadedBy_fkey"
  FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
