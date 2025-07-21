import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get the confirmation text from request body
    const body = await request.json();
    const { confirmationText } = body;

    if (confirmationText !== 'CLEAR DATABASE') {
      return NextResponse.json({ 
        error: 'Invalid confirmation text. Please type "CLEAR DATABASE" exactly.' 
      }, { status: 400 });
    }

    // Clear all data except keep the admin user
    await prisma.assignment.deleteMany({});
    await prisma.teamSchedule.deleteMany({});
    
    // Delete all users except admin
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });

    return NextResponse.json({ 
      message: 'Database cleared successfully. Only admin user remains.',
      clearedTables: ['assignments', 'teamSchedules', 'non-admin users']
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while clearing database' 
    }, { status: 500 });
  }
}