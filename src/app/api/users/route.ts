import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireUser } from '@/lib/server-auth';
import { canUpdateUser } from '@/lib/roles';
import type { Prisma } from '@prisma/client';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  role: z.enum(['ADMIN', 'PRODUCER', 'OPERATOR']).default('OPERATOR'),
});

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'PRODUCER', 'OPERATOR']),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');
    const role = requestedRole
      ? z.enum(['ADMIN', 'PRODUCER', 'OPERATOR']).safeParse(requestedRole)
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
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: validatedData.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
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

    // Check if user has permission to update
    const canUpdate = canUpdateUser(auth.user, validatedData.id, validatedData.role);
    
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        ...(auth.user.role === 'ADMIN' ? { role: validatedData.role } : {}),
        ...(auth.user.role === 'ADMIN' && validatedData.id !== auth.user.id
          ? { sessionVersion: { increment: 1 } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
