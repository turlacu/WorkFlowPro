import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('No bootstrap credentials supplied; seed completed without changing users.');
    return;
  }

  if (password.length < 12) {
    throw new Error('INITIAL_ADMIN_PASSWORD must contain at least 12 characters.');
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (existingAdmin) {
    console.log(`Bootstrap user ${email} already exists; no changes made.`);
    return;
  }

  const adminPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      passwordResetRequired: true,
    },
  });
  console.log(`Created bootstrap administrator ${email}.`);
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
