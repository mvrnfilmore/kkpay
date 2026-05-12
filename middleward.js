import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('camp_session');
  const role = session?.value;
  const { pathname, searchParams } = request.nextUrl;

  // Taktik cadangan: Cek apakah ada 'pass' di URL (misal: /admin?pass=KUDUSCOMMAND)
  const bypass = searchParams.get('pass');

  // Izinkan jika ada cookie valid ATAU jika sedang login
  if (pathname.startsWith('/admin')) {
    if (role === 'admin' || bypass === 'KUDUSCOMMAND') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/pos')) {
    if (['admin', 'pos'].includes(role) || bypass === 'BEACHMERCHANT' || bypass === 'KUDUSCOMMAND') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/pos/:path*'],
};