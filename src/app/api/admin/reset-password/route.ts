import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const ResetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

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
    if (targetUser.id === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot reset your own password. Use the profile settings instead.' 
      }, { status: 400 });
    }

    // Hash the default password "123456"
    const defaultPassword = '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: validatedData.userId },
      data: { password: hashedPassword }
    });

    console.log(`Password reset by admin ${session.user.email} for user ${targetUser.email}`);

    return NextResponse.json({ 
      message: 'Password reset successfully',
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      newPassword: defaultPassword
    });

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