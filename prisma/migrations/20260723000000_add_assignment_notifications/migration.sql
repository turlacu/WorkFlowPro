-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ASSIGNMENT_ASSIGNED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'ASSIGNMENT_ASSIGNED',
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "assignmentId" TEXT,
    "assignmentName" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_createdAt_idx"
ON "notifications"("recipientId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_assignmentId_idx"
ON "notifications"("assignmentId");

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
