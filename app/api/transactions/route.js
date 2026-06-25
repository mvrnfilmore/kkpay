import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('ledger')
      .select(`
        tx_id, amount, timestamp,
        target:rangers!ledger_to_id_fkey(name)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data.map(log => ({
      id: log.tx_id,
      amount: log.amount,
      time: log.timestamp,
      operatorName: 'SYSTEM', // Statis, ga pusing
      targetName: log.target?.name || 'UNKNOWN'
    })));
  } catch (err) { 
    return NextResponse.json({ error: err.message }, { status: 500 }); 
  }
}