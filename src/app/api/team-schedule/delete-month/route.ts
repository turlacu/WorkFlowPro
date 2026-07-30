import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';

const DeleteMonthScheduleSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  userRole: z.enum(['OPERATOR', 'PRODUCER', 'ALL']),
});

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { month, year, userRole } = DeleteMonthScheduleSchema.parse(body);

    // Create date range for the specific month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    console.log('Delete month schedule request:', {
      month,
      year,
      userRole,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Build the where clause based on user role
    const whereClause: any = {
      date: {
        gte: startDate,
        lt: endDate,
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
