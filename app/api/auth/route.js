import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { passcode } = await request.json();
    
    // Pastikan ini matching dengan .env.local lu
    const adminPin = process.env.ADMIN_PIN;
    const posPin = process.env.POS_PIN;

    let role = '';
    if (passcode === adminPin) {
      role = 'admin';
    } else if (passcode === posPin) {
      role = 'pos';
    } else {
      return NextResponse.json({ error: 'KODE AKSES DITOLAK.' }, { status: 401 });
    }

    // Hanya kirim JSON, tidak perlu set cookie
    return NextResponse.json({ success: true, role });

  } catch (error) {
    return NextResponse.json({ error: 'Kesalahan Server Internal.' }, { status: 500 });
  }
}