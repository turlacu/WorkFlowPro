import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear all existing data first
  console.log('Clearing existing database...');
  await prisma.assignment.deleteMany({});
  await prisma.teamSchedule.deleteMany({});
  await prisma.user.deleteMany({});

  // Create only admin user
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@workflowpro.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Database cleared and reseeded successfully!');
  console.log('Only admin user created:');
  console.log('- Admin: admin@workflowpro.com / admin123');
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