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
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        gte: targetDate,
        lt: nextDay,
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

    return NextResponse.json(schedules);
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

    const date = new Date(validatedData.date);
    
    // Remove existing schedules for this date
    await prisma.teamSchedule.deleteMany({
      where: {
        date: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // next day
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
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
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

    return NextResponse.json(createdSchedules);
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