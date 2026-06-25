import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST() {
  try {
    // 1. Ambil semua ID ranger yang bukan Admin/Operator
    const { data: rangers, error: fetchErr } = await supabase
      .from('rangers')
      .select('id')
      .not('role', 'in', '("ADMIN","OPERATOR")');
      
    if (fetchErr) throw fetchErr;

    // 2. Reset semua saldo menjadi 0
    const { error: resetErr } = await supabase
      .from('rangers')
      .update({ balance: 0 })
      .not('role', 'in', '("ADMIN","OPERATOR")');

    if (resetErr) throw resetErr;

    // 3. (Opsional tapi taktis) Catat massal ke ledger bahwa saldo di-reset
    const logs = rangers.map(r => ({
      to_id: r.id,
      amount: 0, // 0 menandakan reset
      description: 'MASS RESET INITIATED'
    }));

    if (logs.length > 0) {
      await supabase.from('ledger').insert(logs);
    }

    return NextResponse.json({ success: true, message: 'ALL BALANCES RESET TO ZERO' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}