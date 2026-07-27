CREATE TABLE "user_presence" (
    "userId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("userId")
);

CREATE INDEX "user_presence_lastSeenAt_idx" ON "user_presence"("lastSeenAt");

ALTER TABLE "user_presence"
ADD CONSTRAINT "user_presence_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
