import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pin } = await request.json();
    
    // Server-side bisa baca ADMIN_PIN tanpa NEXT_PUBLIC_
    if (pin === process.env.ADMIN_PIN) {
      const response = NextResponse.json({ success: true });
      
      // Set cookie di sisi server agar lebih solid
      response.cookies.set('user_role', 'admin', {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
        httpOnly: false, // Biar bisa dibaca client-side kalau perlu
      });
      
      return response;
    }

    return NextResponse.json({ error: 'INVALID PIN' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'SERVER ERROR' }, { status: 500 });
  }
}