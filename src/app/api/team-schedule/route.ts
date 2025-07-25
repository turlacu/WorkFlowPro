import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateTeamScheduleSchema = z.object({
  date: z.string().datetime('Invalid date format'),
  userIds: z.array(z.string()).min(1, 'At least one user is required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let whereClause: any = {};
    if (date) {
      // Parse date as local date without timezone conversion
      const targetDate = new Date(date + 'T00:00:00');
      const nextDay = new Date(date + 'T23:59:59.999');
      
      whereClause.date = {
        gte: targetDate,
        lte: nextDay,
      };
    }

    const schedules = await prisma.teamSchedule.findMany({
      where: whereClause,
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
        date: 'asc',
      },
    });

    // Fetch color legends for time range mapping
    const colorLegends = await prisma.shiftColorLegend.findMany({
      select: {
        colorCode: true,
        shiftName: true,
        startTime: true,
        endTime: true,
      },
    });

    // Map schedules with color legend data
    const schedulesWithTimeRanges = schedules.map(schedule => {
      let timeRange = null;
      let shiftName = null;
      
      if (schedule.shiftColor) {
        const matchingLegend = colorLegends.find(legend => 
          legend.colorCode.toLowerCase() === schedule.shiftColor?.toLowerCase()
        );
        
        if (matchingLegend) {
          timeRange = `${matchingLegend.startTime} - ${matchingLegend.endTime}`;
          shiftName = matchingLegend.shiftName;
        }
      }
      
      return {
        ...schedule,
        timeRange,
        shiftName,
      };
    });

    return NextResponse.json(schedulesWithTimeRanges);
  } catch (error) {
    console.error('Error fetching team schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let requestBody: unknown;
  let validatedData: z.infer<typeof CreateTeamScheduleSchema>;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'PRODUCER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    requestBody = await request.json();
    validatedData = CreateTeamScheduleSchema.parse(requestBody);

    // Parse date without timezone issues
    const dateStr = validatedData.date.split('T')[0];
    const date = new Date(dateStr + 'T00:00:00');
    const endOfDay = new Date(dateStr + 'T23:59:59.999');
    
    // Remove existing schedules for this date
    await prisma.teamSchedule.deleteMany({
      where: {
        date: {
          gte: date,
          lte: endOfDay,
        },
      },
    });

    // Create new schedules
    const schedules = await prisma.teamSchedule.createMany({
      data: validatedData.userIds.map(userId => ({
        date,
        userId,
      })),
    });

    // Fetch created schedules with user data
    const createdSchedules = await prisma.teamSchedule.findMany({
      where: {
        date: {
          gte: date,
          lte: endOfDay,
        },
      },
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
    });

    // Fetch color legends for time range mapping
    const colorLegends = await prisma.shiftColorLegend.findMany({
      select: {
        colorCode: true,
        shiftName: true,
        startTime: true,
        endTime: true,
      },
    });

    // Map created schedules with color legend data
    const createdSchedulesWithTimeRanges = createdSchedules.map(schedule => {
      let timeRange = null;
      let shiftName = null;
      
      if (schedule.shiftColor) {
        const matchingLegend = colorLegends.find(legend => 
          legend.colorCode.toLowerCase() === schedule.shiftColor?.toLowerCase()
        );
        
        if (matchingLegend) {
          timeRange = `${matchingLegend.startTime} - ${matchingLegend.endTime}`;
          shiftName = matchingLegend.shiftName;
        }
      }
      
      return {
        ...schedule,
        timeRange,
        shiftName,
      };
    });

    return NextResponse.json(createdSchedulesWithTimeRanges);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error creating team schedule:', error.errors);
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating team schedule:', error);
    console.error('Request body:', requestBody);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string, message: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json({ error: 'Duplicate schedule entry for the same user and date' }, { status: 409 });
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json({ error: 'Invalid user ID provided' }, { status: 400 });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}