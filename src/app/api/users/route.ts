import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requirePermission, requireUser } from '@/lib/server-auth';
import { canUpdateUser, USER_ROLES } from '@/lib/roles';
import type { Prisma } from '@prisma/client';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';
import { recordActivity } from '@/lib/activity-log';
import { hasPermission } from '@/lib/permissions';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(USER_ROLES).default('OPERATOR'),
});

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(USER_ROLES),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission('USER_DIRECTORY_VIEW');
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');
    const role = requestedRole
      ? z.enum(USER_ROLES).safeParse(requestedRole)
      : null;
    if (role && !role.success) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const whereClause: Prisma.UserWhereInput = role?.success ? { role: role.data } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission('USER_CREATE');
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);
    if (validatedData.role !== 'OPERATOR' && !hasPermission(auth.user, 'USER_ASSIGN_ROLE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: validatedData.role,
          passwordResetRequired: true,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      await recordActivity({
        eventType: 'USER_CREATED', actor: auth.user, targetType: 'user',
        targetId: created.id, targetName: created.name || created.email,
        metadata: { role: created.role },
      }, tx);
      return created;
    });

    const response = NextResponse.json({ ...user, temporaryPassword }, { status: 201 });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id: validatedData.id }, select: { name: true, email: true, role: true } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const roleChanged = existing.role !== validatedData.role;
    const detailsChanged = existing.name !== validatedData.name || existing.email !== validatedData.email.toLowerCase();
    const selfUpdate = validatedData.id === auth.user.id;
    const canUpdate = canUpdateUser(auth.user, validatedData.id, validatedData.role)
      || (roleChanged && hasPermission(auth.user, 'USER_ASSIGN_ROLE'));
    if (!canUpdate || (detailsChanged && !selfUpdate && !hasPermission(auth.user, 'USER_EDIT'))
      || (roleChanged && !hasPermission(auth.user, 'USER_ASSIGN_ROLE'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const changedFields = [
      existing.name !== validatedData.name ? 'name' : null,
      existing.email !== validatedData.email.toLowerCase() ? 'email' : null,
      roleChanged ? 'role' : null,
    ].filter((field): field is string => Boolean(field));
    const user = await prisma.$transaction(async (tx) => {
      if (roleChanged && existing.role === 'ADMIN') {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('admin-role-membership'))`;
        const administrators = await tx.user.count({ where: { role: 'ADMIN' } });
        if (administrators <= 1) throw new Error('LAST_ADMIN');
      }
      const updated = await tx.user.update({
        where: { id: validatedData.id },
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          ...(roleChanged ? { role: validatedData.role, sessionVersion: { increment: 1 } } : {}),
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
      });
      await recordActivity({
        eventType: 'USER_UPDATED', actor: auth.user, targetType: 'user',
        targetId: updated.id, targetName: updated.name || updated.email,
        metadata: { changedFields },
      }, tx);
      return updated;
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return NextResponse.json({ error: 'The last administrator cannot be demoted' }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
