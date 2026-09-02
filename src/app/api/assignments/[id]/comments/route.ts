import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/server-auth';

const CreateCommentSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  parentId: z.string().min(1).max(100).nullable().optional(),
});

type CommentRow = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  assignmentId: string;
  authorId: string | null;
  authorName: string;
  parentId: string | null;
  currentAuthorId: string | null;
  currentAuthorName: string | null;
  currentAuthorEmail: string | null;
};

const serializeComment = (comment: CommentRow) => ({
  id: comment.id,
  content: comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  assignmentId: comment.assignmentId,
  authorId: comment.authorId,
  authorName: comment.authorName,
  parentId: comment.parentId,
  author: comment.currentAuthorId ? {
    id: comment.currentAuthorId,
    name: comment.currentAuthorName,
    email: comment.currentAuthorEmail,
  } : null,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id: assignmentId } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const comments = await prisma.$queryRaw<CommentRow[]>`
      SELECT
        assignment_comment."id", assignment_comment."content", assignment_comment."createdAt", assignment_comment."updatedAt",
        assignment_comment."assignmentId", assignment_comment."authorId", assignment_comment."authorName", assignment_comment."parentId",
        author."id" AS "currentAuthorId", author."name" AS "currentAuthorName",
        author."email" AS "currentAuthorEmail"
      FROM "assignment_comments" AS assignment_comment
      LEFT JOIN "users" AS author ON author."id" = assignment_comment."authorId"
      WHERE assignment_comment."assignmentId" = ${assignmentId}
      ORDER BY assignment_comment."createdAt" ASC
    `;

    return NextResponse.json(comments.map(serializeComment), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Error fetching assignment comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { id: assignmentId } = await params;
    const data = CreateCommentSchema.parse(await request.json());
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (data.parentId) {
      const parent = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "assignment_comments"
        WHERE "id" = ${data.parentId} AND "assignmentId" = ${assignmentId}
        LIMIT 1
      `;
      if (parent.length === 0) {
        return NextResponse.json({ error: 'Reply target not found' }, { status: 400 });
      }
    }

    const comment = await prisma.$transaction(async (transaction) => {
      const commentId = randomUUID();
      const created = await transaction.$queryRaw<CommentRow[]>`
        INSERT INTO "assignment_comments" (
          "id", "content", "createdAt", "updatedAt", "assignmentId", "authorId", "authorName", "parentId"
        ) VALUES (
          ${commentId}, ${data.content}, NOW(), NOW(), ${assignmentId}, ${auth.user.id}, ${auth.user.name}, ${data.parentId ?? null}
        )
        RETURNING
          "id", "content", "createdAt", "updatedAt", "assignmentId", "authorId", "authorName", "parentId",
          ${auth.user.id}::text AS "currentAuthorId", ${auth.user.name}::text AS "currentAuthorName",
          ${auth.user.email}::text AS "currentAuthorEmail"
      `;
      await transaction.assignment.update({
        where: { id: assignmentId },
        data: { lastUpdatedById: auth.user.id },
      });
      return serializeComment(created[0]);
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating assignment comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
