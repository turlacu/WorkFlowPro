import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token;
    if (!token) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const publicOrigin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      const loginUrl = new URL('/login', publicOrigin);
      loginUrl.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    const mustResetPassword = token.passwordResetRequired;
    if (
      mustResetPassword &&
      !request.nextUrl.pathname.startsWith('/api/') &&
      request.nextUrl.pathname !== '/settings'
    ) {
      const publicOrigin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      const settingsUrl = new URL('/settings', publicOrigin);
      settingsUrl.searchParams.set('passwordResetRequired', '1');
      return NextResponse.redirect(settingsUrl);
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|api/health(?:z)?|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
