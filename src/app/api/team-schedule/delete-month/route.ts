import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteMonthScheduleSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  userRole: z.enum(['OPERATOR', 'PRODUCER', 'ALL']),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can delete schedules' }, { status: 403 });
    }

    const body = await request.json();
    const { month, year, userRole } = DeleteMonthScheduleSchema.parse(body);

    // Create date range for the specific month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

    console.log('Delete month schedule request:', {
      month,
      year,
      userRole,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Build the where clause based on user role
    let whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // If specific user role is selected, filter by user role
    if (userRole !== 'ALL') {
      whereClause.user = {
        role: userRole,
      };
    }

    // Delete schedules matching the criteria
    const deleteResult = await prisma.teamSchedule.deleteMany({
      where: whereClause,
    });
    
    console.log('Deleted schedule entries:', deleteResult.count);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count,
      message: `Deleted ${deleteResult.count} schedule entries for ${userRole === 'ALL' ? 'all users' : userRole.toLowerCase() + 's'} in ${monthNames[month - 1]} ${year}`
    });

  } catch (error) {
    console.error('Error deleting month schedule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}