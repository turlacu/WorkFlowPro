import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can cleanup schedules' }, { status: 403 });
    }

    // Delete all team schedules - clean slate
    const deleteResult = await prisma.teamSchedule.deleteMany({});
    
    console.log('Cleanup: Deleted all team schedules:', deleteResult.count);

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count,
      message: 'All team schedules have been cleaned up'
    });

  } catch (error) {
    console.error('Error cleaning up schedules:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}