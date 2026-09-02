CREATE TABLE "assignment_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "assignment_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assignment_comments_assignmentId_createdAt_idx"
    ON "assignment_comments"("assignmentId", "createdAt");
CREATE INDEX "assignment_comments_parentId_idx" ON "assignment_comments"("parentId");
CREATE INDEX "assignment_comments_authorId_idx" ON "assignment_comments"("authorId");

ALTER TABLE "assignment_comments"
    ADD CONSTRAINT "assignment_comments_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_comments"
    ADD CONSTRAINT "assignment_comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assignment_comments"
    ADD CONSTRAINT "assignment_comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "assignment_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "assignment_comments" (
    "id", "content", "createdAt", "updatedAt", "assignmentId", "authorId", "authorName", "parentId"
)
SELECT
    'legacy_' || md5(assignment."id"),
    assignment."comment",
    assignment."updatedAt",
    assignment."updatedAt",
    assignment."id",
    assignment."lastUpdatedById",
    COALESCE(author."name", author."email", 'Unknown'),
    NULL
FROM "assignments" AS assignment
LEFT JOIN "users" AS author ON author."id" = assignment."lastUpdatedById"
WHERE assignment."comment" IS NOT NULL AND btrim(assignment."comment") <> '';
