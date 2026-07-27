import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';

const ResetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = ResetPasswordSchema.parse(body);

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from resetting their own password through this endpoint
    if (targetUser.id === auth.user.id) {
      return NextResponse.json({ 
        error: 'Cannot reset your own password. Use the profile settings instead.' 
      }, { status: 400 });
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Update user's password
    await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        password: hashedPassword,
        passwordResetRequired: true,
        sessionVersion: { increment: 1 },
      }
    });

    const response = NextResponse.json({
      message: 'Password reset successfully',
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      temporaryPassword
    });
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Error resetting password:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while resetting password' 
    }, { status: 500 });
  }
}
