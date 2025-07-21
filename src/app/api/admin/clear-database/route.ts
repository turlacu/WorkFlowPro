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

    // Clear ALL data including all users
    await prisma.assignment.deleteMany({});
    await prisma.teamSchedule.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Recreate the correct admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@workflowpro.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ 
      message: 'Database cleared successfully. New admin user created: admin@workflowpro.com / admin123',
      clearedTables: ['assignments', 'teamSchedules', 'all users'],
      newAdmin: 'admin@workflowpro.com'
    });

  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while clearing database' 
    }, { status: 500 });
  }
}