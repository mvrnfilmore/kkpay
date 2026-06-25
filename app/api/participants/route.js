import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// --- GET: AMBIL SEMUA PESERTA ---
export async function GET() {
  const { data, error } = await supabase.from('rangers').select('*').not('role', 'in', '("ADMIN","OPERATOR")');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(i => ({ id: i.qr_code, internalId: i.id, name: i.name, balance: i.balance ?? 0 })));
}

// --- PATCH: UPDATE SALDO (INJECTION / DEDUCTION) ---
export async function PATCH(request) {
  try {
    const { userId, amount } = await request.json();

    const { data: ranger } = await supabase.from('rangers').select('id, balance').eq('qr_code', userId).single();
    if (!ranger) throw new Error("Target tidak ditemukan");

    const newBalance = Number(ranger.balance || 0) + Number(amount);

    await supabase.from('rangers').update({ balance: newBalance }).eq('id', ranger.id);

    // Catat ke Ledger
    await supabase.from('ledger').insert([{ 
      to_id: ranger.id, 
      amount: Number(amount),
      description: 'Transaction Executed'
    }]);

    return NextResponse.json({ success: true });
  } catch (err) { 
    return NextResponse.json({ error: err.message }, { status: 500 }); 
  }
}

// --- POST: TAMBAH PESERTA BARU (ENLISTMENT) ---
export async function POST(request) {
  try {
    const { qrCode, name } = await request.json();

    // Validasi: Pastikan ID belum dipakai
    const { data: existing } = await supabase.from('rangers').select('id').eq('qr_code', qrCode).single();
    if (existing) {
      return NextResponse.json({ error: 'ID CODE ALREADY EXISTS' }, { status: 400 });
    }

    // Insert peserta baru
    const { error } = await supabase.from('rangers').insert([{
      id: crypto.randomUUID(), // Generate UUID otomatis
      qr_code: qrCode.toUpperCase(),
      name: name.toUpperCase(),
      role: 'RANGER',
      balance: 0
    }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}