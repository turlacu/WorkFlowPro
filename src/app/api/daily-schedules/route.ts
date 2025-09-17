import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateDailyScheduleSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date))),
  title: z.string().min(1),
  content: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

const UpdateDailyScheduleSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

// GET - Fetch daily schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let whereClause: any = {};

    if (date) {
      // Fetch specific date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      whereClause.date = targetDate;
    } else if (month && year) {
      // Fetch all schedules for a specific month
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else {
      // Fetch recent schedules (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.date = {
        gte: thirtyDaysAgo,
      };
    }

    const schedules = await prisma.dailySchedule.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Error fetching daily schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily schedules' },
      { status: 500 }
    );
  }
}

// POST - Create new daily schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and PRODUCER can create daily schedules
    if (!['ADMIN', 'PRODUCER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only admins and producers can upload daily schedules' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateDailyScheduleSchema.parse(body);

    const targetDate = new Date(validatedData.date);
    targetDate.setHours(0, 0, 0, 0);

    // Check if schedule already exists for this date
    const existingSchedule = await prisma.dailySchedule.findUnique({
      where: { date: targetDate },
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule already exists for this date. Use PUT to update.' },
        { status: 409 }
      );
    }

    const schedule = await prisma.dailySchedule.create({
      data: {
        date: targetDate,
        title: validatedData.title,
        content: validatedData.content,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.mimeType,
        uploadedBy: session.user.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating daily schedule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create daily schedule' },
      { status: 500 }
    );
  }
}

// PUT - Update existing daily schedule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and PRODUCER can update daily schedules
    if (!['ADMIN', 'PRODUCER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only admins and producers can update daily schedules' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const body = await request.json();
    const validatedData = UpdateDailyScheduleSchema.parse(body);

    const existingSchedule = await prisma.dailySchedule.findUnique({
      where: { date: targetDate },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found for this date' },
        { status: 404 }
      );
    }

    const schedule = await prisma.dailySchedule.update({
      where: { date: targetDate },
      data: {
        ...validatedData,
        uploadedBy: session.user.id, // Update uploader to current user
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error updating daily schedule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update daily schedule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete daily schedule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete daily schedules
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can delete daily schedules' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existingSchedule = await prisma.dailySchedule.findUnique({
      where: { date: targetDate },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found for this date' },
        { status: 404 }
      );
    }

    await prisma.dailySchedule.delete({
      where: { date: targetDate },
    });

    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete daily schedule' },
      { status: 500 }
    );
  }
}