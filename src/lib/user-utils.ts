import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

/**
 * Safely get user from database, handling cases where session ID might be stale
 * (e.g., after database reseed). Falls back to email lookup if ID lookup fails.
 */
export async function getUserFromSession(session: Session) {
  if (!session?.user?.id) {
    return null;
  }

  // First try to find user by ID
  let user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  // If user not found by ID and we have an email, try finding by email
  // This handles cases where the database was reseeded and user IDs changed
  if (!user && session.user.email) {
    console.log('User not found by ID, trying by email:', session.user.email);
    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user) {
      console.log('User found by email, ID mismatch detected:', {
        sessionId: session.user.id,
        databaseId: user.id,
        email: session.user.email
      });
      // Update the session user ID to match the database
      session.user.id = user.id;
    }
  }

  return user;
}