import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sessionVersion: number;
  passwordResetRequired: boolean;
};

type AuthResult =
  | { user: AuthenticatedUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireUser(
  allowedRoles?: readonly UserRole[],
  allowPasswordResetRequired = false,
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, role: true,
      sessionVersion: true, passwordResetRequired: true,
    },
  });

  if (!user || session.user.sessionVersion !== user.sessionVersion) {
    return { response: NextResponse.json({ error: 'Session expired' }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  if (user.passwordResetRequired && !allowPasswordResetRequired) {
    return {
      response: NextResponse.json(
        { error: 'Password reset required', code: 'PASSWORD_RESET_REQUIRED' },
        { status: 403 },
      ),
    };
  }

  return {
    user: {
      ...user,
      name: user.name || user.email,
    },
  };
}
