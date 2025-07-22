-- AlterTable
ALTER TABLE "team_schedules" ADD COLUMN "shiftColor" TEXT;
ALTER TABLE "team_schedules" ADD COLUMN "shiftHours" TEXT;

-- CreateTable
CREATE TABLE "shift_color_legends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "colorCode" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "shift_color_legends_colorCode_key" ON "shift_color_legends"("colorCode");
