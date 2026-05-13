import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const users = [
      { user: process.env.ADMIN_USER, pass: process.env.ADMIN_PASS, id: process.env.ADMIN_UUID, role: 'admin' },
      { user: process.env.POS1_USER, pass: process.env.POS1_PASS, id: process.env.POS1_UUID, role: 'pos' },
      { user: process.env.POS2_USER, pass: process.env.POS2_PASS, id: process.env.POS2_UUID, role: 'pos' },
    ];

    const auth = users.find(u => u.user === username && u.pass === password);

    if (auth) {
      const res = NextResponse.json({ success: true });
      // Gunakan sameSite: 'lax' agar cookie aman tapi tetap bisa dibaca antar route
      res.cookies.set('user_id', auth.id, { path: '/', httpOnly: true, sameSite: 'lax' });
      res.cookies.set('user_name', auth.user, { path: '/', httpOnly: true, sameSite: 'lax' });
      return res;
    }
    return NextResponse.json({ error: 'DENIED' }, { status: 401 });
  } catch (err) { return NextResponse.json({ error: 'ERROR' }, { status: 500 }); }
}