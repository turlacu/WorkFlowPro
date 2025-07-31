import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resetDatabase } from '../../../../../scripts/reset-database.js';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can reset database' }, { status: 403 });
    }

    // Only allow in development or with explicit confirmation
    const { confirmation } = await request.json();
    
    if (process.env.NODE_ENV === 'production' && confirmation !== 'RESET_PRODUCTION_DATABASE') {
      return NextResponse.json({ 
        error: 'Database reset in production requires explicit confirmation',
        required: 'Send { "confirmation": "RESET_PRODUCTION_DATABASE" } in request body'
      }, { status: 400 });
    }

    console.log(`Database reset initiated by ${session.user.email}`);
    
    const admin = await resetDatabase();
    
    return NextResponse.json({ 
      message: 'Database reset successfully',
      adminUser: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      credentials: {
        email: 'admin@workflowpro.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}