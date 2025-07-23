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

    const userId = session.user.id;

    // Get assignment statistics for the user
    const assignments = await prisma.assignment.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        createdAt: true,
        dueDate: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const totalAssignmentsCreated = assignments.length;
    
    const firstAssignment = assignments.length > 0 ? assignments[0].createdAt.toISOString() : null;
    const lastAssignment = assignments.length > 0 ? assignments[assignments.length - 1].createdAt.toISOString() : null;

    // Calculate unique days with activity
    const uniqueDays = new Set(
      assignments.map(a => a.createdAt.toISOString().split('T')[0])
    );
    const uniqueDaysWithActivity = uniqueDays.size;

    // Calculate average assignments per active day
    const avgAssignmentsPerActiveDay = uniqueDaysWithActivity > 0 
      ? totalAssignmentsCreated / uniqueDaysWithActivity 
      : 0;

    // Find busiest day (day with most assignments created)
    const dayCount: { [key: string]: number } = {};
    assignments.forEach(a => {
      const day = a.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    const busiestDay = Object.keys(dayCount).length > 0 
      ? Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b)[0]
      : null;

    // Find busiest month
    const monthCount: { [key: string]: number } = {};
    assignments.forEach(a => {
      const month = a.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      monthCount[month] = (monthCount[month] || 0) + 1;
    });
    
    const busiestMonth = Object.keys(monthCount).length > 0 
      ? Object.entries(monthCount).reduce((a, b) => monthCount[a[0]] > monthCount[b[0]] ? a : b)[0]
      : null;

    const statistics = {
      totalAssignmentsCreated,
      firstAssignment,
      lastAssignment,
      uniqueDaysWithActivity,
      avgAssignmentsPerActiveDay: Math.round(avgAssignmentsPerActiveDay * 10) / 10,
      busiestDay,
      busiestMonth
    };

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}