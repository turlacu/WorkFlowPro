const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleAssignments() {
  try {
    console.log('🔍 Checking existing data...');
    
    // Check if assignments already exist
    const existingAssignments = await prisma.assignment.count();
    console.log(`Found ${existingAssignments} existing assignments`);
    
    if (existingAssignments > 0) {
      console.log('✅ Assignments already exist, skipping creation');
      return;
    }
    
    // Get users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      return;
    }
    
    const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
    const producerUser = users.find(u => u.role === 'PRODUCER') || users[0];
    const operatorUser = users.find(u => u.role === 'OPERATOR') || users[0];
    
    console.log('👥 Using users:', {
      admin: adminUser?.name || 'N/A',
      producer: producerUser?.name || 'N/A', 
      operator: operatorUser?.name || 'N/A'
    });
    
    // Create sample assignments
    const assignments = [
      {
        name: 'Review monthly reports',
        description: 'Review and analyze monthly performance reports',
        author: 'System',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'NORMAL',
        status: 'COMPLETED',
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        comment: 'Reports reviewed and approved'
      },
      {
        name: 'Update system documentation',
        description: 'Update technical documentation for new features',
        author: 'System',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        createdById: adminUser.id,
        lastUpdatedById: adminUser.id,
        assignedToId: operatorUser.id
      },
      {
        name: 'Maintenance check',
        description: 'Perform routine maintenance checks',
        author: 'System',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'NORMAL',
        status: 'PENDING',
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id
      },
      {
        name: 'Quality assurance review',
        description: 'Review quality standards and procedures',
        author: 'System',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: 'NORMAL',
        status: 'COMPLETED',
        createdById: producerUser.id,
        lastUpdatedById: producerUser.id,
        assignedToId: operatorUser.id,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        comment: 'All standards met'
      },
      {
        name: 'Training coordination',
        description: 'Coordinate upcoming training sessions',
        author: 'System',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: 'LOW',
        status: 'PENDING',
        createdById: adminUser.id,
        lastUpdatedById: adminUser.id,
        assignedToId: operatorUser.id
      }
    ];
    
    console.log('📝 Creating assignments...');
    
    for (const assignment of assignments) {
      const created = await prisma.assignment.create({
        data: assignment
      });
      console.log(`✅ Created: ${created.name} (${created.status})`);
    }
    
    console.log(`🎉 Successfully created ${assignments.length} sample assignments!`);
    
    // Verify the creation
    const finalCount = await prisma.assignment.count();
    console.log(`📊 Total assignments in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Error creating sample assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAssignments();