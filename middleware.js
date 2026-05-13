import { NextResponse } from 'next/server';

export function middleware(request) {
  const authCookie = request.cookies.get('user_role');
  const path = request.nextUrl.pathname;

  // Proteksi rute /admin (HANYA ADMIN)
  if (path.startsWith('/admin')) {
    if (!authCookie || authCookie.value !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Proteksi rute /pos (ADMIN & POS BOLEH MASUK)
  if (path.startsWith('/pos')) {
    if (!authCookie || (authCookie.value !== 'POS' && authCookie.value !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};