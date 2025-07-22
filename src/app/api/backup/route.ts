import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

// Create backups directory if it doesn't exist
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

async function ensureBackupsDir() {
  try {
    await fs.access(BACKUPS_DIR);
  } catch {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  }
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

    await ensureBackupsDir();

    // Export all data from database
    const [users, assignments, teamSchedules, shiftColorLegends] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Don't include password for security
        },
      }),
      prisma.assignment.findMany({
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          lastUpdatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.teamSchedule.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.shiftColorLegend.findMany(),
    ]);

    const backupData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        version: '1.0',
        totalRecords: users.length + assignments.length + teamSchedules.length + shiftColorLegends.length,
      },
      data: {
        users,
        assignments,
        teamSchedules,
        shiftColorLegends,
      },
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    // Write backup file
    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2));

    // Get file size
    const stats = await fs.stat(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Create backup record
    const backupRecord = {
      id: `backup-${Date.now()}`,
      fileName,
      filePath,
      createdAt: new Date(),
      size: `${sizeInMB} MB`,
      recordCount: backupData.metadata.totalRecords,
    };

    return NextResponse.json(backupRecord);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while creating backup' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    await ensureBackupsDir();

    // Read all backup files
    const files = await fs.readdir(BACKUPS_DIR);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));

    const backups = await Promise.all(
      backupFiles.map(async (fileName) => {
        const filePath = path.join(BACKUPS_DIR, fileName);
        const stats = await fs.stat(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        return {
          id: fileName.replace('.json', ''),
          fileName,
          filePath,
          createdAt: stats.birthtime,
          size: `${sizeInMB} MB`,
        };
      })
    );

    // Sort by creation date, newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(backups);
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while fetching backups' 
    }, { status: 500 });
  }
}