import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple status check without database
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      nextAuthUrl: process.env.NEXTAUTH_URL || 'missing'
    });
  } catch (error) {
    console.error('Status check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
        nextAuthUrl: process.env.NEXTAUTH_URL || 'missing'
      },
      { status: 500 }
    );
  }
}