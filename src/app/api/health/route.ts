import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isStorageHealthy } from '@/lib/minio';

export async function GET() {
  try {
    const [, storageHealthy] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      isStorageHealthy(),
    ]);
    if (!storageHealthy) throw new Error('Object storage unavailable');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: { database: 'healthy', objectStorage: 'healthy' },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: { database: 'unknown', objectStorage: 'unknown' },
      },
      { status: 503 }
    );
  }
}
