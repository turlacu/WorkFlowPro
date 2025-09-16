import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check database connectivity and get counts
    const userCount = await prisma.user.count();
    const assignmentCount = await prisma.assignment.count();
    const teamScheduleCount = await prisma.teamSchedule.count();
    const shiftColorLegendCount = await prisma.shiftColorLegend.count();

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    return NextResponse.json({
      status: 'connected',
      counts: {
        users: userCount,
        assignments: assignmentCount,
        teamSchedules: teamScheduleCount,
        shiftColorLegends: shiftColorLegendCount
      },
      usersByRole,
      recentAssignments
    });

  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}