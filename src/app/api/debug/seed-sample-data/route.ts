import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if there are already assignments
    const existingAssignments = await prisma.assignment.count();
    if (existingAssignments > 0) {
      return NextResponse.json({ 
        message: 'Sample data already exists', 
        existingAssignments 
      });
    }

    // Get existing users
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found. Please create users first.' }, { status: 400 });
    }

    const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
    const producerUser = users.find(u => u.role === 'PRODUCER') || users[0];
    const operatorUser = users.find(u => u.role === 'OPERATOR') || users[0];

    // Create sample assignments
    const sampleAssignments = [
      {
        name: 'Review monthly reports',
        description: 'Review and analyze monthly performance reports',
        author: 'System',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'NORMAL' as const,
        status: 'COMPLETED' as const,
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id,
        comment: 'Reports reviewed and approved'
      },
      {
        name: 'Update system documentation',
        description: 'Update technical documentation for new features',
        author: 'System',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        priority: 'URGENT' as const,
        status: 'IN_PROGRESS' as const,
        createdById: adminUser.id,
        lastUpdatedById: adminUser.id,
        assignedToId: operatorUser.id
      },
      {
        name: 'Maintenance check',
        description: 'Perform routine maintenance checks',
        author: 'System',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'NORMAL' as const,
        status: 'PENDING' as const,
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id
      },
      {
        name: 'Quality assurance review',
        description: 'Review quality standards and procedures',
        author: 'System',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: 'NORMAL' as const,
        status: 'COMPLETED' as const,
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        comment: 'All standards met'
      },
      {
        name: 'Training session coordination',
        description: 'Coordinate upcoming training sessions for team',
        author: 'System',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        priority: 'LOW' as const,
        status: 'PENDING' as const,
        createdById: adminUser.id,
        lastUpdatedById: adminUser.id,
        assignedToId: operatorUser.id
      }
    ];

    // Create assignments
    const createdAssignments = [];
    for (const assignment of sampleAssignments) {
      const created = await prisma.assignment.create({
        data: assignment
      });
      createdAssignments.push(created);
    }

    return NextResponse.json({
      message: 'Sample data created successfully',
      assignmentsCreated: createdAssignments.length,
      assignments: createdAssignments.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status
      }))
    });

  } catch (error) {
    console.error('Error creating sample data:', error);
    return NextResponse.json({ 
      error: 'Failed to create sample data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}