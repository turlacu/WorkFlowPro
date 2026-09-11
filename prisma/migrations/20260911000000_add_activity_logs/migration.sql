CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "UserRole" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "targetName" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_occurredAt_idx" ON "activity_logs"("occurredAt");
CREATE INDEX "activity_logs_actorId_occurredAt_idx" ON "activity_logs"("actorId", "occurredAt");
CREATE INDEX "activity_logs_eventType_occurredAt_idx" ON "activity_logs"("eventType", "occurredAt");

ALTER TABLE "activity_logs"
ADD CONSTRAINT "activity_logs_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
