import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Menghapus cookie otoritas
  cookies().set('user_role', '', { 
    maxAge: 0,
    path: '/' 
  });

  return NextResponse.json({ success: true, message: 'LOGOUT BERHASIL' });
}