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
    const userRole = session.user.role;

    let statistics: any = {};

    if (userRole === 'PRODUCER' || userRole === 'ADMIN') {
      // Get assignment statistics for producers (assignments created)
      const createdAssignments = await prisma.assignment.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          createdAt: true,
          dueDate: true,
        },
        orderBy: { createdAt: 'asc' }
      });

      const totalAssignmentsCreated = createdAssignments.length;
      
      const firstAssignment = createdAssignments.length > 0 ? createdAssignments[0].createdAt.toISOString() : null;
      const lastAssignment = createdAssignments.length > 0 ? createdAssignments[createdAssignments.length - 1].createdAt.toISOString() : null;

      // Calculate unique days with activity for created assignments
      const uniqueDays = new Set(
        createdAssignments.map(a => a.createdAt.toISOString().split('T')[0])
      );
      const uniqueDaysWithActivity = uniqueDays.size;

      // Calculate average assignments per active day
      const avgAssignmentsPerActiveDay = uniqueDaysWithActivity > 0 
        ? totalAssignmentsCreated / uniqueDaysWithActivity 
        : 0;

      // Find busiest day (day with most assignments created)
      const dayCount: { [key: string]: number } = {};
      createdAssignments.forEach(a => {
        const day = a.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      
      const busiestDay = Object.keys(dayCount).length > 0 
        ? Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b)[0]
        : null;

      // Find busiest month
      const monthCount: { [key: string]: number } = {};
      createdAssignments.forEach(a => {
        const month = a.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      });
      
      const busiestMonth = Object.keys(monthCount).length > 0 
        ? Object.entries(monthCount).reduce((a, b) => monthCount[a[0]] > monthCount[b[0]] ? a : b)[0]
        : null;

      statistics = {
        userRole,
        totalAssignmentsCreated,
        firstAssignment,
        lastAssignment,
        uniqueDaysWithActivity,
        avgAssignmentsPerActiveDay: Math.round(avgAssignmentsPerActiveDay * 10) / 10,
        busiestDay,
        busiestMonth
      };
    } else if (userRole === 'OPERATOR') {
      // Get assignment statistics for operators (assignments completed BY this user)
      const completedAssignments = await prisma.assignment.findMany({
        where: { 
          completedById: userId,
          status: 'COMPLETED'
        },
        select: {
          id: true,
          completedAt: true,
          completedById: true,
        },
        orderBy: { completedAt: 'asc' }
      });

      const totalAssignmentsCompleted = completedAssignments.length;
      
      const firstCompletion = completedAssignments.length > 0 ? completedAssignments[0].completedAt!.toISOString() : null;
      const lastCompletion = completedAssignments.length > 0 ? completedAssignments[completedAssignments.length - 1].completedAt!.toISOString() : null;

      // Calculate unique days with completion activity
      const uniqueDays = new Set(
        completedAssignments.map(a => a.completedAt!.toISOString().split('T')[0])
      );
      const uniqueDaysWithActivity = uniqueDays.size;

      // Calculate average completions per active day
      const avgCompletionsPerActiveDay = uniqueDaysWithActivity > 0 
        ? totalAssignmentsCompleted / uniqueDaysWithActivity 
        : 0;

      // Find busiest day (day with most assignments completed)
      const dayCount: { [key: string]: number } = {};
      completedAssignments.forEach(a => {
        const day = a.completedAt!.toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      
      const busiestDay = Object.keys(dayCount).length > 0 
        ? Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b)[0]
        : null;

      // Find busiest month
      const monthCount: { [key: string]: number } = {};
      completedAssignments.forEach(a => {
        const month = a.completedAt!.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthCount[month] = (monthCount[month] || 0) + 1;
      });
      
      const busiestMonth = Object.keys(monthCount).length > 0 
        ? Object.entries(monthCount).reduce((a, b) => monthCount[a[0]] > monthCount[b[0]] ? a : b)[0]
        : null;

      statistics = {
        userRole,
        totalAssignmentsCompleted,
        firstCompletion,
        lastCompletion,
        uniqueDaysWithActivity,
        avgCompletionsPerActiveDay: Math.round(avgCompletionsPerActiveDay * 10) / 10,
        busiestDay,
        busiestMonth
      };
    }

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}