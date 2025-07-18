import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@workflowpro.com' }
    });

    // Test password hash
    let passwordTest = false;
    if (admin && admin.password) {
      passwordTest = await bcrypt.compare('admin123', admin.password);
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount,
        adminExists: !!admin,
        adminHasPassword: !!(admin?.password),
        passwordTest
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
        nextAuthUrl: process.env.NEXTAUTH_URL || 'missing'
      }
    });
  } catch (error) {
    console.error('Debug check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
          nextAuthUrl: process.env.NEXTAUTH_URL || 'missing'
        }
      },
      { status: 500 }
    );
  }
}