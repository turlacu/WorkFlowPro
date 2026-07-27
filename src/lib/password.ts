import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const BCRYPT_COST = 12;
const TEMPORARY_PASSWORD_LENGTH = 20;
const TEMPORARY_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generateTemporaryPassword(): string {
  return Array.from(
    { length: TEMPORARY_PASSWORD_LENGTH },
    () => TEMPORARY_PASSWORD_ALPHABET[randomInt(TEMPORARY_PASSWORD_ALPHABET.length)],
  ).join('');
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
