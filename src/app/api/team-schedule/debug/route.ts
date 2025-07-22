import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all team schedules with user info
    const schedules = await prisma.teamSchedule.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({
      total: schedules.length,
      schedules: schedules.slice(0, 20), // First 20 entries
      summary: {
        totalSchedules: schedules.length,
        operators: schedules.filter(s => s.user.role === 'OPERATOR').length,
        producers: schedules.filter(s => s.user.role === 'PRODUCER').length,
      }
    });

  } catch (error) {
    console.error('Error debugging schedules:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}