import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      sessionVersion: number;
      passwordResetRequired: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    sessionVersion: number;
    passwordResetRequired: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    sessionVersion: number;
    passwordResetRequired: boolean;
  }
}
