ALTER TABLE "assignments"
ADD COLUMN "claimedByOperator" BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing reversal grants as two independent capabilities. Operators
-- intentionally receive only the ability to return started work.
INSERT INTO "role_permissions" ("role", "permission")
SELECT "role", 'ASSIGNMENT_RETURN_TO_PENDING'
FROM "role_permissions"
WHERE "permission" = 'ASSIGNMENT_REVERSE_STATUS'
ON CONFLICT ("role", "permission") DO NOTHING;

INSERT INTO "role_permissions" ("role", "permission")
SELECT "role", 'ASSIGNMENT_REOPEN_COMPLETED'
FROM "role_permissions"
WHERE "permission" = 'ASSIGNMENT_REVERSE_STATUS' AND "role" <> 'OPERATOR'::"UserRole"
ON CONFLICT ("role", "permission") DO NOTHING;

-- Operators can return started work by default, even when the former combined
-- permission was not enabled for them.
INSERT INTO "role_permissions" ("role", "permission")
VALUES ('OPERATOR', 'ASSIGNMENT_RETURN_TO_PENDING')
ON CONFLICT ("role", "permission") DO NOTHING;

DELETE FROM "role_permissions"
WHERE "permission" = 'ASSIGNMENT_REVERSE_STATUS';

UPDATE "permission_policy"
SET "revision" = "revision" + 1, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'global';
