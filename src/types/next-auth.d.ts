import type { UserRole } from '@prisma/client';
import type { PermissionKey } from '@/lib/permissions';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      sessionVersion: number;
      passwordResetRequired: boolean;
      permissions: PermissionKey[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    sessionVersion: number;
    passwordResetRequired: boolean;
    permissions: PermissionKey[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    sessionVersion: number;
    passwordResetRequired: boolean;
    permissions?: PermissionKey[];
  }
}
