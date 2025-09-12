import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserFromSession } from '@/lib/user-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('=== ASSIGNMENT TEST ENDPOINT ===');
    
    // Test session
    const session = await getServerSession(authOptions);
    console.log('Test - Session:', session ? 'EXISTS' : 'MISSING');
    if (session) {
      console.log('Test - User:', { id: session.user.id, email: session.user.email, role: session.user.role });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Test user lookup
    console.log('Test - Looking up user...');
    const user = await getUserFromSession(session);
    console.log('Test - User lookup result:', user ? 'FOUND' : 'NOT_FOUND');
    if (user) {
      console.log('Test - User details:', { id: user.id, email: user.email, role: user.role });
    }

    // Test request body parsing
    const body = await request.json();
    console.log('Test - Request body:', body);
    console.log('Test - Body type:', typeof body);
    console.log('Test - Body keys:', Object.keys(body));

    return NextResponse.json({
      success: true,
      session: !!session,
      user: !!user,
      body: body,
      message: 'Test endpoint working'
    });

  } catch (error) {
    console.error('Test - Error:', error);
    console.error('Test - Error type:', typeof error);
    console.error('Test - Error message:', error instanceof Error ? error.message : 'Unknown');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error
    }, { status: 500 });
  }
}