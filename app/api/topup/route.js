import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { qrCode, amount, adminPin } = await request.json();

    // Validasi PIN Admin untuk keamanan ganda
    if (adminPin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: 'OTORISASI ADMIN GAGAL' }, { status: 401 });
    }

    // Cari ID peserta berdasarkan QR
    const { data: ranger } = await supabase
      .from('rangers')
      .select('id, name')
      .eq('qr_code', qrCode)
      .single();

    if (!ranger) return NextResponse.json({ error: 'PESERTA TIDAK DITEMUKAN' }, { status: 404 });

    // Injeksi Saldo ke Ledger
    // to_id diisi ID peserta, from_id diisi ID Admin (atau UUID statis admin lu)
    const { error } = await supabase.from('ledger').insert([{
      from_id: '00000000-0000-0000-0000-000000000000', // UUID dummy untuk Admin
      to_id: ranger.id,
      amount: parseInt(amount),
      description: 'Top Up Saldo - Admin'
    }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Berhasil Top Up Rp${amount} ke ${ranger.name}` });
  } catch (e) {
    return NextResponse.json({ error: 'GAGAL INJEKSI SALDO' }, { status: 500 });
  }
}