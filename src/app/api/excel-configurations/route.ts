import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateConfigurationSchema = z.object({
  name: z.string().min(1, 'Configuration name is required'),
  role: z.string().min(1, 'Role is required'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  
  // Coordinates
  dateRow: z.number().min(0, 'Date row must be >= 0'),
  dayLabelRow: z.number().min(0).nullable().optional(),
  nameColumn: z.number().min(0, 'Name column must be >= 0'),
  firstNameRow: z.number().min(0, 'First name row must be >= 0'),
  lastNameRow: z.number().min(0, 'Last name row must be >= 0'),
  firstDateColumn: z.number().min(0, 'First date column must be >= 0'),
  lastDateColumn: z.number().min(0, 'Last date column must be >= 0'),
  dynamicColumns: z.boolean().default(true),
  
  // Processing rules
  skipValues: z.array(z.string()).default([]),
  validPatterns: z.array(z.string()).default([]),
  colorDetection: z.boolean().default(true),
  defaultShift: z.string().optional().transform(val => val === '' ? undefined : val),
});

const UpdateConfigurationSchema = CreateConfigurationSchema.extend({
  id: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can access configurations' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    let whereClause: any = {};
    if (role) whereClause.role = role;
    if (active !== null) whereClause.active = active === 'true';

    const configurations = await prisma.excelUploadConfiguration.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { UploadConfigurationLog: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(configurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
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
      return NextResponse.json({ error: 'Forbidden - Only admins can create configurations' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Creating configuration:', body);
    
    const validatedData = CreateConfigurationSchema.parse(body);
    
    // Check if configuration name already exists for this role
    const existingConfig = await prisma.excelUploadConfiguration.findUnique({
      where: { 
        name_role: {
          name: validatedData.name,
          role: validatedData.role
        }
      }
    });

    if (existingConfig) {
      return NextResponse.json({ 
        error: 'Configuration already exists', 
        details: `A configuration named "${validatedData.name}" already exists for role "${validatedData.role}"` 
      }, { status: 400 });
    }

    const configuration = await prisma.excelUploadConfiguration.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log('Created configuration:', configuration);
    return NextResponse.json(configuration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors);
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating configuration:', error);
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
      return NextResponse.json({ error: 'Forbidden - Only admins can update configurations' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = UpdateConfigurationSchema.parse(body);

    const configuration = await prisma.excelUploadConfiguration.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        role: validatedData.role,
        description: validatedData.description,
        active: validatedData.active,
        dateRow: validatedData.dateRow,
        dayLabelRow: validatedData.dayLabelRow,
        nameColumn: validatedData.nameColumn,
        firstNameRow: validatedData.firstNameRow,
        lastNameRow: validatedData.lastNameRow,
        firstDateColumn: validatedData.firstDateColumn,
        lastDateColumn: validatedData.lastDateColumn,
        dynamicColumns: validatedData.dynamicColumns,
        skipValues: validatedData.skipValues,
        validPatterns: validatedData.validPatterns,
        colorDetection: validatedData.colorDetection,
        defaultShift: validatedData.defaultShift,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(configuration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}