import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateShiftColorLegendSchema = z.object({
  colorCode: z.string().min(1, 'Color code is required'),
  colorName: z.string().min(1, 'Color name is required'),
  shiftName: z.string().min(1, 'Shift name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  description: z.string().optional(),
});

const UpdateShiftColorLegendSchema = CreateShiftColorLegendSchema.extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can access color legends' }, { status: 403 });
    }

    const colorLegends = await prisma.shiftColorLegend.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(colorLegends);
  } catch (error) {
    console.error('Error fetching color legends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can create color legends' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateShiftColorLegendSchema.parse(body);

    const colorLegend = await prisma.shiftColorLegend.create({
      data: validatedData
    });

    return NextResponse.json(colorLegend);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating color legend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can update color legends' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateShiftColorLegendSchema.parse(body);

    const colorLegend = await prisma.shiftColorLegend.update({
      where: { id: validatedData.id },
      data: {
        colorCode: validatedData.colorCode,
        colorName: validatedData.colorName,
        shiftName: validatedData.shiftName,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        description: validatedData.description,
      }
    });

    return NextResponse.json(colorLegend);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating color legend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}