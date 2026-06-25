import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inisialisasi Supabase menggunakan Service Role Key.
// Kunci ini memiliki otoritas absolut dan HANYA boleh ada di sisi server ini.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. Ekstrak data yang dikirim dari Terminal POS
    const { qrCode, merchantId, amount, description } = await request.json();

    if (!qrCode || !merchantId || !amount) {
      return NextResponse.json({ error: 'Data transaksi tidak lengkap.' }, { status: 400 });
    }

    // 2. Validasi Entitas: Cari ID Peserta berdasarkan QR Code
    const { data: ranger, error: rangerErr } = await supabase
      .from('rangers')
      .select('id, name')
      .eq('qr_code', qrCode)
      .single();

    if (rangerErr || !ranger) {
      return NextResponse.json({ error: 'Identitas QR Code tidak valid/tidak ditemukan.' }, { status: 404 });
    }

    // 3. Verifikasi Saldo: Gunakan fungsi RPC database yang sudah kita buat
    const { data: currentBalance, error: balanceErr } = await supabase
      .rpc('get_balance', { rangers_id: ranger.id });

    if (balanceErr) {
      console.error("Error cek saldo:", balanceErr);
      return NextResponse.json({ error: 'Gagal memverifikasi saldo di database.' }, { status: 500 });
    }

    // 4. Logika Penahanan: Cegah jika saldo minus
    if (currentBalance < amount) {
      return NextResponse.json({ 
        error: `Saldo tidak mencukupi. Sisa saldo: Rp${currentBalance.toLocaleString('id-ID')}` 
      }, { status: 400 });
    }

    // 5. Eksekusi Pencatatan Transaksi ke Ledger
    const { error: txErr } = await supabase
      .from('ledger')
      .insert([{
        from_id: ranger.id,
        to_id: merchantId,
        amount: amount,
        description: description || 'Transaksi Merchant Beachside'
      }]);

    if (txErr) {
      console.error("Error insert ledger:", txErr);
      throw txErr;
    }

    // 6. Selesai: Kembalikan status sukses ke Terminal POS
    return NextResponse.json({ 
      success: true, 
      message: `Rp${amount.toLocaleString('id-ID')} berhasil dipotong dari ${ranger.name}` 
    });

  } catch (error) {
    console.error('SYSTEM FAULT:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}