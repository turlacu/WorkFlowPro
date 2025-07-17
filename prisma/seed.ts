import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@workflowpro.com' },
    update: {},
    create: {
      email: 'admin@workflowpro.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create producers
  const producer1Password = await bcrypt.hash('producer123', 12);
  const producer1 = await prisma.user.upsert({
    where: { email: 'adrian.doros@workflowpro.com' },
    update: {},
    create: {
      email: 'adrian.doros@workflowpro.com',
      name: 'Adrian Doroș',
      password: producer1Password,
      role: 'PRODUCER',
    },
  });

  const producer2Password = await bcrypt.hash('producer123', 12);
  const producer2 = await prisma.user.upsert({
    where: { email: 'marian.cosor@workflowpro.com' },
    update: {},
    create: {
      email: 'marian.cosor@workflowpro.com',
      name: 'Marian Cosor',
      password: producer2Password,
      role: 'PRODUCER',
    },
  });

  const producer3Password = await bcrypt.hash('producer123', 12);
  const producer3 = await prisma.user.upsert({
    where: { email: 'bogdan.turlacu@workflowpro.com' },
    update: {},
    create: {
      email: 'bogdan.turlacu@workflowpro.com',
      name: 'Bogdan Turlacu',
      password: producer3Password,
      role: 'PRODUCER',
    },
  });

  // Create operators
  const operator1Password = await bcrypt.hash('operator123', 12);
  const operator1 = await prisma.user.upsert({
    where: { email: 'alina.doncea@workflowpro.com' },
    update: {},
    create: {
      email: 'alina.doncea@workflowpro.com',
      name: 'Alina Doncea',
      password: operator1Password,
      role: 'OPERATOR',
    },
  });

  const operator2Password = await bcrypt.hash('operator123', 12);
  const operator2 = await prisma.user.upsert({
    where: { email: 'manuela.carleciuc@workflowpro.com' },
    update: {},
    create: {
      email: 'manuela.carleciuc@workflowpro.com',
      name: 'Manuela Carleciuc',
      password: operator2Password,
      role: 'OPERATOR',
    },
  });

  const operator3Password = await bcrypt.hash('operator123', 12);
  const operator3 = await prisma.user.upsert({
    where: { email: 'francesca.vintilescu@workflowpro.com' },
    update: {},
    create: {
      email: 'francesca.vintilescu@workflowpro.com',
      name: 'Francesca Vintilescu',
      password: operator3Password,
      role: 'OPERATOR',
    },
  });

  // Create sample assignments
  const assignment1 = await prisma.assignment.create({
    data: {
      name: 'Develop login feature',
      description: 'Implement the full login flow including forgot password functionality.',
      dueDate: new Date('2025-07-20'),
      status: 'COMPLETED',
      priority: 'NORMAL',
      assignedToId: operator1.id,
      createdById: producer1.id,
      lastUpdatedById: producer1.id,
      sourceLocation: 'Project Y > Backend Tasks',
      completedAt: new Date('2025-07-20T15:00:00Z'),
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      name: 'Design new dashboard UI',
      description: 'Create mockups and prototypes for the new user dashboard.',
      dueDate: new Date('2025-07-21'),
      status: 'PENDING',
      priority: 'URGENT',
      assignedToId: operator2.id,
      createdById: producer1.id,
      lastUpdatedById: producer1.id,
      sourceLocation: 'Design Files > Figma',
    },
  });

  const assignment3 = await prisma.assignment.create({
    data: {
      name: 'Test payment gateway',
      description: 'Thoroughly test all aspects of the payment gateway integration.',
      dueDate: new Date('2025-07-21'),
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      assignedToId: operator1.id,
      createdById: producer2.id,
      lastUpdatedById: operator1.id,
    },
  });

  const assignment4 = await prisma.assignment.create({
    data: {
      name: 'Write API documentation',
      description: 'Document all public API endpoints with examples.',
      dueDate: new Date('2025-07-22'),
      status: 'PENDING',
      priority: 'NORMAL',
      assignedToId: operator3.id,
      createdById: producer2.id,
      lastUpdatedById: producer2.id,
      sourceLocation: 'Docs Repo > API',
    },
  });

  const assignment5 = await prisma.assignment.create({
    data: {
      name: 'Fix navigation bug',
      description: 'The main navigation menu is not working on mobile devices.',
      dueDate: new Date('2025-07-23'),
      status: 'PENDING',
      priority: 'URGENT',
      assignedToId: operator1.id,
      createdById: producer3.id,
      lastUpdatedById: producer3.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Users created:');
  console.log('- Admin: admin@workflowpro.com / admin123');
  console.log('- Producer 1: adrian.doros@workflowpro.com / producer123');
  console.log('- Producer 2: marian.cosor@workflowpro.com / producer123');
  console.log('- Producer 3: bogdan.turlacu@workflowpro.com / producer123');
  console.log('- Operator 1: alina.doncea@workflowpro.com / operator123');
  console.log('- Operator 2: manuela.carleciuc@workflowpro.com / operator123');
  console.log('- Operator 3: francesca.vintilescu@workflowpro.com / operator123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });