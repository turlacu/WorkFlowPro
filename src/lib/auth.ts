import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { checkRateLimit, resetRateLimit } from './rate-limit';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  // Don't use PrismaAdapter with credentials provider and JWT strategy
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const forwardedFor = request.headers?.['cf-connecting-ip'] || request.headers?.['x-forwarded-for'];
        const clientAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();
        const accountLimit = checkRateLimit(`login:account:${email}`, { limit: 10, windowMs: 15 * 60_000 });
        const addressLimit = checkRateLimit(`login:address:${clientAddress || 'unknown'}`, {
          limit: 30,
          windowMs: 15 * 60_000,
        });
        if (!accountLimit.allowed || !addressLimit.allowed) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await verifyPassword(credentials.password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          resetRateLimit(`login:account:${email}`);

          const result = {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            sessionVersion: user.sessionVersion,
            passwordResetRequired: user.passwordResetRequired,
          };
          return result;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // Set the user ID in the token
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        token.passwordResetRequired = user.passwordResetRequired;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.sessionVersion = token.sessionVersion;
        session.user.passwordResetRequired = token.passwordResetRequired;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
