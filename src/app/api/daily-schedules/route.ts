import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseDateOnly } from '@/lib/date-only';
import { deleteFile } from '@/lib/minio';

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
});

// GET - Fetch daily schedules
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let whereClause: any = {};

    if (date) {
      // Fetch specific date
      const targetDate = parseDateOnly(date);
      if (!targetDate) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
      whereClause.date = targetDate;
    } else if (month && year) {
      // Fetch all schedules for a specific month
      const parsedMonth = Number(month);
      const parsedYear = Number(year);
      if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || !Number.isInteger(parsedYear)) {
        return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
      }
      const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
      const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 1));
      whereClause.date = {
        gte: startDate,
        lt: endDate,
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
    const auth = await requireUser(['ADMIN', 'PRODUCER']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = CreateDailyScheduleSchema.parse(body);

    const targetDate = parseDateOnly(validatedData.date);
    if (!targetDate) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

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
        uploadedBy: auth.user.id,
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
    const auth = await requireUser(['ADMIN', 'PRODUCER']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(date);
    if (!targetDate) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

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
        uploadedBy: auth.user.id,
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
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(date);
    if (!targetDate) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

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
    if (existingSchedule.filePath) {
      await deleteFile(existingSchedule.filePath.replace(/^\/uploads\//, '')).catch((error) => {
        console.error('Failed to delete schedule object:', error);
      });
    }

    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete daily schedule' },
      { status: 500 }
    );
  }
}
