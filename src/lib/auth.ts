import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  // Don't use PrismaAdapter with credentials provider and JWT strategy
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          console.log('User found:', !!user);

          if (!user || !user.password) {
            console.log('User not found or no password');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('Password valid:', isPasswordValid);
          
          if (!isPasswordValid) {
            return null;
          }

          const result = {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
          };
          console.log('Returning user:', result);
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
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};