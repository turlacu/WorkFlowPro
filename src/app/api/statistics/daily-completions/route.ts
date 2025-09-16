import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const GetDailyCompletionsSchema = z.object({
  month: z.string(), // YYYY-MM format
});

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Daily completions API route started');

    const body = await request.json();
    const { month } = GetDailyCompletionsSchema.parse(body);
    
    console.log('📊 Requested month:', month);

    // Get session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the month (YYYY-MM format)
    const [year, monthNum] = month.split('-').map(Number);
    const selectedDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed
    
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    console.log('📊 Date range for daily completions:', {
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Get all assignments completed in the selected month
    const completedAssignments = await prisma.assignment.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        completedAt: true,
        assignedTo: {
          select: {
            role: true,
          },
        },
      },
    });

    console.log('📊 Found completed assignments:', completedAssignments.length);

    // Create data for each day of the month
    const dailyData = eachDayOfInterval({ start, end }).map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      // Count completions for this specific day
      const completionsOnDay = completedAssignments.filter(assignment => {
        if (!assignment.completedAt) return false;
        const completedDate = new Date(assignment.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });

      return {
        date: format(day, 'MMM d'),
        fullDate: format(day, 'yyyy-MM-dd'),
        completions: completionsOnDay.length,
      };
    });

    console.log('📈 Daily completions data generated:', {
      totalDays: dailyData.length,
      totalCompletions: dailyData.reduce((sum, day) => sum + day.completions, 0),
      sampleData: dailyData.slice(0, 5) // First 5 days as sample
    });

    return NextResponse.json({ dailyData });

  } catch (error) {
    console.error('❌ Daily completions API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch daily completions data'
    }, { status: 500 });
  }
}