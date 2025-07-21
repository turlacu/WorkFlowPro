import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface BackupData {
  metadata: {
    exportedAt: string;
    exportedBy: {
      id: string;
      name: string;
      email: string;
    };
    version: string;
    totalRecords: number;
  };
  data: {
    users: any[];
    assignments: any[];
    teamSchedules: any[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'Invalid file format. Only JSON files are supported.' }, { status: 400 });
    }

    // Read and parse the backup file
    const fileContent = await file.text();
    let backupData: BackupData;
    
    try {
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON format in backup file' }, { status: 400 });
    }

    // Validate backup file structure
    if (!backupData.metadata || !backupData.data) {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 });
    }

    // Clear existing data (but keep current admin user)
    await prisma.assignment.deleteMany({});
    await prisma.teamSchedule.deleteMany({});
    
    // Delete all users except current admin
    await prisma.user.deleteMany({
      where: {
        id: {
          not: session.user.id,
        },
      },
    });

    let restoredCounts = {
      users: 0,
      assignments: 0,
      teamSchedules: 0,
    };

    // Restore users (skip if they would conflict with current admin)
    if (backupData.data.users && Array.isArray(backupData.data.users)) {
      for (const user of backupData.data.users) {
        if (user.id !== session.user.id && user.email !== session.user.email) {
          try {
            // Create user with default password (they'll need to reset it)
            const defaultPassword = await bcrypt.hash('defaultpass123', 12);
            await prisma.user.create({
              data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                password: defaultPassword,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt || user.createdAt),
              },
            });
            restoredCounts.users++;
          } catch (userError) {
            console.error(`Failed to restore user ${user.email}:`, userError);
            // Continue with other users
          }
        }
      }
    }

    // Restore assignments
    if (backupData.data.assignments && Array.isArray(backupData.data.assignments)) {
      for (const assignment of backupData.data.assignments) {
        try {
          await prisma.assignment.create({
            data: {
              id: assignment.id,
              name: assignment.name,
              description: assignment.description,
              dueDate: new Date(assignment.dueDate),
              priority: assignment.priority,
              status: assignment.status,
              assignedToId: assignment.assignedToId,
              createdById: assignment.createdById || session.user.id, // Fallback to current admin
              lastUpdatedById: assignment.lastUpdatedById || session.user.id,
              sourceLocation: assignment.sourceLocation,
              comment: assignment.comment,
              completedAt: assignment.completedAt ? new Date(assignment.completedAt) : null,
              createdAt: new Date(assignment.createdAt),
              updatedAt: new Date(assignment.updatedAt),
            },
          });
          restoredCounts.assignments++;
        } catch (assignmentError) {
          console.error(`Failed to restore assignment ${assignment.name}:`, assignmentError);
          // Continue with other assignments
        }
      }
    }

    // Restore team schedules
    if (backupData.data.teamSchedules && Array.isArray(backupData.data.teamSchedules)) {
      for (const schedule of backupData.data.teamSchedules) {
        try {
          await prisma.teamSchedule.create({
            data: {
              id: schedule.id,
              date: new Date(schedule.date),
              userId: schedule.userId,
              createdAt: new Date(schedule.createdAt),
              updatedAt: new Date(schedule.updatedAt),
            },
          });
          restoredCounts.teamSchedules++;
        } catch (scheduleError) {
          console.error(`Failed to restore team schedule:`, scheduleError);
          // Continue with other schedules
        }
      }
    }

    return NextResponse.json({
      message: 'Backup restored successfully',
      originalBackup: {
        exportedAt: backupData.metadata.exportedAt,
        exportedBy: backupData.metadata.exportedBy,
        totalRecords: backupData.metadata.totalRecords,
      },
      restored: restoredCounts,
      notes: 'Restored users have default password: defaultpass123. Please ask them to change it.',
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while restoring backup' 
    }, { status: 500 });
  }
}