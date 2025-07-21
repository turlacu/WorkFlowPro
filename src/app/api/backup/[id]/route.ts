import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const fileName = `${id}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read the file
      const fileContent = await fs.readFile(filePath);
      
      // Return file as download
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } catch (fileError) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while downloading backup' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const fileName = `${id}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Delete the file
      await fs.unlink(filePath);
      
      return NextResponse.json({ message: 'Backup deleted successfully' });
    } catch (fileError) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ 
      error: 'Internal server error occurred while deleting backup' 
    }, { status: 500 });
  }
}