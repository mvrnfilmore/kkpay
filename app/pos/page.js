'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut, Keyboard, Loader2, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// INISIALISASI KONEKSI DATABASE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PosTerminal() {
  const [scannedId, setScannedId] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('charge'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [uiMessage, setUiMessage] = useState({ type: '', text: '' }); 

  useEffect(() => {
    let html5QrCode;
    if (!scannedId) {
      html5QrCode = new Html5Qrcode("tactical-scanner");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (html5QrCode.getState() === 2) { 
            html5QrCode.pause(); 
            setUiMessage({ type: 'loading', text: 'VERIFYING ID...' });
            const targetId = decodedText.toUpperCase();
            supabase
              .from('rangers')
              .select('qr_code, name') 
              .ilike('qr_code', targetId) 
              .limit(1) 
              .then(({ data, error }) => {
                if (error || !data || data.length === 0) {
                  setUiMessage({ type: 'error', text: `ID [${targetId}] TIDAK VALID` });
                  setTimeout(() => { setUiMessage({ type: '', text: '' }); html5QrCode.resume(); }, 2000);
                } else {
                  setScannedId(data[0].qr_code); 
                  setScannedName(data[0].name || 'UNKNOWN RANGER'); 
                  setUiMessage({ type: '', text: '' });
                  html5QrCode.stop().catch(console.error);
                }
              });
          }
        },
        () => {} 
      ).catch((err) => console.error("Scanner Init Error:", err));
    }
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error); };
  }, [scannedId]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setIsProcessing(true);
      setUiMessage({ type: 'loading', text: 'MENCARI DATA...' });
      const targetId = manualInput.trim().toUpperCase();
      try {
        const { data, error } = await supabase.from('rangers').select('qr_code, name').ilike('qr_code', targetId).limit(1);
        if (error || !data || data.length === 0) {
          setUiMessage({ type: 'error', text: `ID [${targetId}] tidak ditemukan.` });
        } else {
          setScannedId(data[0].qr_code);
          setScannedName(data[0].name || 'UNKNOWN RANGER');
          setUiMessage({ type: '', text: '' });
        }
      } catch (err) { setUiMessage({ type: 'error', text: `ERROR: ${err.message}` }); }
      setIsProcessing(false);
      setTimeout(() => setUiMessage({ type: '', text: '' }), 3000);
      setManualInput('');
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount)) return;
    setIsProcessing(true);
    setUiMessage({ type: 'loading', text: 'MEMPROSES TRANSAKSI...' });

    try {
      const { data, error: fetchError } = await supabase.from('rangers').select('id, balance').ilike('qr_code', scannedId).limit(1); 
      if (fetchError || !data || data.length === 0) throw new Error("Gagal mengambil data saldo.");

      const rangerUuid = data[0].id;
      const currentBalance = data[0].balance || 0;
      const nominal = Number(amount);
      const newBalance = transactionType === 'charge' ? currentBalance - nominal : currentBalance + nominal;

      if (newBalance < 0) throw new Error("SALDO TIDAK MENCUKUPI!");

      // 1. UPDATE SALDO DI TABEL RANGERS
      const { error: updateError } = await supabase.from('rangers').update({ balance: newBalance }).eq('id', rangerUuid);
      if (updateError) throw new Error(`GAGAL UPDATE SALDO: ${updateError.message}`);

      // 2. INJEKSI LOG KE TABEL LEDGER
      const logAmount = transactionType === 'charge' ? -Math.abs(nominal) : Math.abs(nominal);
      const { error: logError } = await supabase.from('ledger').insert([{ 
          to_id: rangerUuid, 
          from_id: null, // Tetap NULL kecuali Dashboard butuh UUID spesifik agar muncul
          amount: logAmount,
          description: 'Transaction Executed'
      }]);

      if (logError) console.error("LOG ERROR:", logError.message);

      setUiMessage({ type: 'success', text: `BERHASIL! SISA SALDO: KKC${newBalance.toLocaleString()}` });
      setTimeout(() => { setScannedId(''); setScannedName(''); setAmount(''); setUiMessage({ type: '', text: '' }); }, 3000);
    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000);
    } finally { setIsProcessing(false); }
  };

  const handleLogout = () => {
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <div className="max-w-md mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter text-cyan-500 underline decoration-cyan-500/30">POS TERMINAL</h1>
          <p className="text-[10px] tracking-[0.2em] text-slate-500 uppercase font-bold">Secure Access Node</p>
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500 transition-all"><LogOut size={20} /></button>
      </div>

      <div className="max-w-md mx-auto">
        {uiMessage.text && (
          <div className={`mb-6 p-4 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl ${
            uiMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-rose-500/10' :
            uiMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-emerald-500/10' : 
            'bg-cyan-500/10 border-cyan-500 text-cyan-500 animate-pulse'
          }`}>
            {uiMessage.type === 'loading' && <Loader2 size={16} className="animate-spin" />}
            {uiMessage.text}
          </div>
        )}

        {!scannedId ? (
          <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 justify-center text-cyan-500"><QrCode size={24} /><h2 className="text-sm font-black tracking-widest uppercase italic">Optical Scanner</h2></div>
              <div className={`rounded-2xl overflow-hidden border-2 relative bg-black w-full min-h-[300px] flex items-center justify-center transition-all ${uiMessage.type === 'error' ? 'border-rose-500' : 'border-cyan-500/20'}`}><div id="tactical-scanner" className="w-full h-full"></div></div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
               <div className="flex items-center gap-3 mb-4 justify-center text-slate-500 uppercase"><Keyboard size={18} /><h2 className="text-[10px] font-black tracking-widest">Manual Override</h2></div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input type="text" placeholder="INPUT ID..." value={manualInput} onChange={(e) => setManualInput(e.target.value)} className="flex-1 bg-black/60 border border-slate-800 p-4 rounded-xl text-sm font-mono outline-none focus:border-cyan-500/50 text-white tracking-widest uppercase transition-all" />
                <button type="submit" disabled={!manualInput || isProcessing} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20">ENTER</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl mb-6 border border-slate-800 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-cyan-500/10 p-3 rounded-full text-cyan-500 border border-cyan-500/20"><User size={24} /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Authorized Ranger</p>
                  <p className="font-sans font-black text-white text-lg uppercase tracking-wider">{scannedName}</p>
                  <p className="font-mono text-cyan-500 font-bold text-xs mt-1 bg-cyan-500/10 px-2 py-0.5 rounded inline-block">{scannedId}</p>
                </div>
              </div>
              <button onClick={() => { setScannedId(''); setScannedName(''); }} className="text-slate-600 hover:text-rose-500 transition-all relative z-10"><XCircle size={28} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => setTransactionType('charge')} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${transactionType === 'charge' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/10' : 'bg-black/40 border-slate-800 text-slate-500'}`}><ArrowDownCircle size={24} className="group-hover:-translate-y-1 transition-transform" /><span className="text-[10px] font-black tracking-widest uppercase">Charge</span></button>
              <button onClick={() => setTransactionType('topup')} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${transactionType === 'topup' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-black/40 border-slate-800 text-slate-500'}`}><ArrowUpCircle size={24} className="group-hover:-translate-y-1 transition-transform" /><span className="text-[10px] font-black tracking-widest uppercase">Top Up</span></button>
            </div>
            <div className="mb-6"><input type="number" placeholder="NOMINAL (KKC)..." value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/60 border border-slate-800 p-5 rounded-2xl text-center text-xl font-mono outline-none focus:border-cyan-500/50 text-white tracking-[0.2em] transition-all" /></div>
            <button onClick={handleTransaction} disabled={!amount || isProcessing} className={`w-full p-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all ${transactionType === 'charge' ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'} disabled:opacity-30 disabled:scale-100 active:scale-95`}>{isProcessing ? 'Transmitting Data...' : 'Confirm Transaction'}</button>
          </div>
        )}
      </div>
    </div>
  );
}