import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const email = argument('email')?.trim().toLowerCase();
  const name = argument('name')?.trim() || 'Administrator';
  const suppliedPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const generatedPassword = randomBytes(18).toString('base64url');
  const password = suppliedPassword || generatedPassword;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Usage: npm run admin:create -- --email=admin@example.com [--name=Administrator]');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'ADMIN',
      password: passwordHash,
      passwordResetRequired: true,
      sessionVersion: { increment: 1 },
    },
    create: {
      email,
      name,
      role: 'ADMIN',
      password: passwordHash,
      passwordResetRequired: true,
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`Administrator ready: ${admin.email}`);
  if (!suppliedPassword) {
    console.log(`One-time password: ${generatedPassword}`);
  }
  console.log('The administrator must change this password after first sign-in.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
