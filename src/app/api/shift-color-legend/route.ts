import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';

const CreateShiftColorLegendSchema = z.object({
  colorCode: z.string().min(1, 'Color code is required'),
  colorName: z.string().min(1, 'Color name is required'),
  shiftName: z.string().min(1, 'Shift name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isVacation: z.boolean().default(false),
  description: z.string().optional(),
  role: z.enum(['ADMIN', 'PRODUCER', 'OPERATOR']).default('OPERATOR'),
});

const UpdateShiftColorLegendSchema = CreateShiftColorLegendSchema.extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let whereClause: any = {};
    if (role) {
      whereClause.role = role;
    }

    const colorLegends = await prisma.shiftColorLegend.findMany({
      where: whereClause,
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(colorLegends);
  } catch (error) {
    console.error('Error fetching color legends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const body = await request.json();
    console.log('Received color legend data:', body);
    
    const validatedData = CreateShiftColorLegendSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if color code already exists for this role
    const existingLegend = await prisma.shiftColorLegend.findUnique({
      where: { 
        colorCode_role: {
          colorCode: validatedData.colorCode,
          role: validatedData.role
        }
      }
    });

    if (existingLegend) {
      console.log('Color code already exists for role:', validatedData.colorCode, validatedData.role);
      return NextResponse.json({ 
        error: 'Color code already exists', 
        details: `A legend with color code "${validatedData.colorCode}" already exists for role "${validatedData.role}".` 
      }, { status: 400 });
    }

    const normalizedData = {
      ...validatedData,
      startTime: validatedData.isVacation ? '00:00' : validatedData.startTime,
      endTime: validatedData.isVacation ? '00:00' : validatedData.endTime,
    };
    const colorLegend = await prisma.shiftColorLegend.create({
      data: normalizedData as unknown as Parameters<typeof prisma.shiftColorLegend.create>[0]['data'],
    });

    console.log('Created color legend:', colorLegend);
    return NextResponse.json(colorLegend);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    // Handle Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.log('Unique constraint violation:', error);
      return NextResponse.json({ 
        error: 'Color code already exists', 
        details: 'A legend with this color code already exists.' 
      }, { status: 400 });
    }
    
    console.error('Error creating color legend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = UpdateShiftColorLegendSchema.parse(body);

    const normalizedData = {
      colorCode: validatedData.colorCode,
      colorName: validatedData.colorName,
      shiftName: validatedData.shiftName,
      startTime: validatedData.isVacation ? '00:00' : validatedData.startTime,
      endTime: validatedData.isVacation ? '00:00' : validatedData.endTime,
      isVacation: validatedData.isVacation,
      description: validatedData.description,
      role: validatedData.role,
    };
    const colorLegend = await prisma.shiftColorLegend.update({
      where: { id: validatedData.id },
      data: normalizedData as unknown as Parameters<typeof prisma.shiftColorLegend.update>[0]['data'],
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
