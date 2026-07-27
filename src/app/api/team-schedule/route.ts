import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseDateOnly, utcDayRange } from '@/lib/date-only';
import { shouldHideFromMainSchedule } from '@/lib/shift-color-legend';

const CreateTeamScheduleSchema = z.object({
  date: z.string(),
  userIds: z.array(z.string().cuid()).min(1, 'At least one user is required').max(500),
});

interface ScheduleColorLegend {
  colorCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  isVacation: boolean;
  role: string;
}

const scheduleColorLegendSelect = {
  colorCode: true,
  shiftName: true,
  startTime: true,
  endTime: true,
  isVacation: true,
  role: true,
} as unknown as NonNullable<Parameters<typeof prisma.shiftColorLegend.findMany>[0]>['select'];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let whereClause: any = {};
    if (date) {
      const range = utcDayRange(date);
      if (!range) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      whereClause.date = {
        gte: range.start,
        lt: range.end,
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
      select: scheduleColorLegendSelect,
    }) as unknown as ScheduleColorLegend[];

    // Map schedules with color legend data
    const schedulesWithTimeRanges = schedules.flatMap(schedule => {
      let timeRange = null;
      let shiftName = null;
      
      if (schedule.shiftColor) {
        const matchingLegend = colorLegends.find(legend => 
          legend.role === schedule.user.role &&
          legend.colorCode.toLowerCase() === schedule.shiftColor?.toLowerCase()
        );
        
        if (matchingLegend) {
          if (shouldHideFromMainSchedule(matchingLegend)) return [];
          timeRange = `${matchingLegend.startTime} - ${matchingLegend.endTime}`;
          shiftName = matchingLegend.shiftName;
        }
      }
      
      return [{
        ...schedule,
        timeRange,
        shiftName,
      }];
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
    const auth = await requireUser(['ADMIN', 'PRODUCER']);
    if (auth.response) return auth.response;

    requestBody = await request.json();
    validatedData = CreateTeamScheduleSchema.parse(requestBody);

    const date = parseDateOnly(validatedData.date);
    const range = utcDayRange(validatedData.date);
    if (!date || !range) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

    const uniqueUserIds = [...new Set(validatedData.userIds)];
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds } },
      select: { id: true },
    });
    if (users.length !== uniqueUserIds.length) {
      return NextResponse.json({ error: 'One or more user IDs are invalid' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamSchedule.deleteMany({
        where: { date: { gte: range.start, lt: range.end } },
      });
      await tx.teamSchedule.createMany({
        data: uniqueUserIds.map((userId) => ({ date, userId })),
      });
    });

    // Fetch created schedules with user data
    const createdSchedules = await prisma.teamSchedule.findMany({
      where: {
        date: {
          gte: date,
          lt: range.end,
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
      select: scheduleColorLegendSelect,
    }) as unknown as ScheduleColorLegend[];

    // Map created schedules with color legend data
    const createdSchedulesWithTimeRanges = createdSchedules.flatMap(schedule => {
      let timeRange = null;
      let shiftName = null;
      
      if (schedule.shiftColor) {
        const matchingLegend = colorLegends.find(legend => 
          legend.role === schedule.user.role &&
          legend.colorCode.toLowerCase() === schedule.shiftColor?.toLowerCase()
        );
        
        if (matchingLegend) {
          if (shouldHideFromMainSchedule(matchingLegend)) return [];
          timeRange = `${matchingLegend.startTime} - ${matchingLegend.endTime}`;
          shiftName = matchingLegend.shiftName;
        }
      }
      
      return [{
        ...schedule,
        timeRange,
        shiftName,
      }];
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
