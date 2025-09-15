import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can access configurations' }, { status: 403 });
    }

    const configuration = await prisma.excelUploadConfiguration.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        UploadConfigurationLog: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedByUser: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json(configuration);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can delete configurations' }, { status: 403 });
    }

    // Check if configuration exists and get usage count
    const configuration = await prisma.excelUploadConfiguration.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { UploadConfigurationLog: true }
        }
      }
    });

    if (!configuration) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // If configuration has been used, maybe we should soft delete or warn
    if (configuration._count.UploadConfigurationLog > 0) {
      // For now, we'll allow deletion but could add a flag later
      console.log(`Deleting configuration ${configuration.name} that was used ${configuration._count.UploadConfigurationLog} times`);
    }

    await prisma.excelUploadConfiguration.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}