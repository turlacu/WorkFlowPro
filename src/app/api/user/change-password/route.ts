import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { hashPassword, verifyPassword } from '@/lib/password';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, 'New password must be at least 12 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(undefined, true);
    if (auth.response) return auth.response;
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(await request.json());

    // Get the user with current password
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found or no password set' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        password: hashedNewPassword,
        passwordResetRequired: false,
        sessionVersion: { increment: 1 },
      }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
