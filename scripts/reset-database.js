#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Clear all existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.assignment.deleteMany({});
    await prisma.teamSchedule.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.verificationToken.deleteMany({});
    await prisma.shiftColorLegend.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user with proper password hash
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@workflowpro.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Database reset completed successfully!');
    console.log('📋 Admin credentials:');
    console.log('   Email: admin@workflowpro.com');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN');
    
    return admin;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };