'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut, Keyboard, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PosTerminal() {
  const [scannedId, setScannedId] = useState('');
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
              .select('qr_code')
              .ilike('qr_code', targetId)
              .limit(1) // TAKTIK ANTI-PGRST116
              .then(({ data, error }) => {
                if (error) {
                  setUiMessage({ type: 'error', text: `DB ERROR: ${error.message}` });
                  setTimeout(() => { setUiMessage({ type: '', text: '' }); html5QrCode.resume(); }, 3000);
                } else if (!data || data.length === 0) {
                  setUiMessage({ type: 'error', text: `AKSES DITOLAK: ID [${targetId}] TIDAK DITEMUKAN / DIBLOKIR RLS` });
                  setTimeout(() => { setUiMessage({ type: '', text: '' }); html5QrCode.resume(); }, 3000);
                } else {
                  setScannedId(targetId);
                  setUiMessage({ type: '', text: '' });
                  html5QrCode.stop().catch(console.error);
                }
              });
          }
        },
        () => {} 
      ).catch((err) => console.error("Optic Init Error:", err));
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [scannedId]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setIsProcessing(true);
      setUiMessage({ type: 'loading', text: 'INVESTIGASI DATABASE...' });
      const targetId = manualInput.trim().toUpperCase();
      
      try {
        const { data, error } = await supabase
          .from('rangers')
          .select('qr_code')
          .eq('qr_code', targetId)
          .limit(1); // TAKTIK ANTI-PGRST116

        if (error) {
          setUiMessage({ type: 'error', text: `SUPABASE ERROR: ${error.message}` });
        } else if (!data || data.length === 0) {
          setUiMessage({ type: 'error', text: `TOLAK: Tabel diakses, tapi ID [${targetId}] tidak ditemukan. Cek RLS SELECT!` });
        } else {
          setScannedId(targetId);
          setUiMessage({ type: '', text: '' });
        }
      } catch (err) {
        setUiMessage({ type: 'error', text: `NETWORK FATAL: ${err.message}` });
      }

      setIsProcessing(false);
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000);
      setManualInput('');
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount)) return;
    setIsProcessing(true);
    setUiMessage({ type: 'loading', text: 'EXECUTING TRANSACTION...' });

    try {
      const { data, error: fetchError } = await supabase
        .from('rangers')
        .select('balance')
        .eq('qr_code', scannedId)
        .limit(1); // TAKTIK ANTI-PGRST116

      if (fetchError) throw new Error(`TRANSACTION DB ERROR: ${fetchError.message}`);
      if (!data || data.length === 0) throw new Error("Akses data saldo digagalkan oleh RLS.");

      const currentBalance = data[0].balance || 0;
      const nominal = Number(amount);
      const newBalance = transactionType === 'topup' ? currentBalance + nominal : currentBalance - nominal;

      if (newBalance < 0) {
        throw new Error("SALDO TIDAK MENCUKUPI!");
      }

      const { error: updateError } = await supabase
        .from('rangers')
        .update({ balance: newBalance })
        .eq('qr_code', scannedId);

      if (updateError) throw new Error(`UPDATE DB ERROR: ${updateError.message}`);

      setUiMessage({ type: 'success', text: `TRANSAKSI BERHASIL! SISA SALDO: Rp${newBalance.toLocaleString()}` });
      
      setTimeout(() => {
        setScannedId('');
        setAmount('');
        setUiMessage({ type: '', text: '' });
      }, 3000);

    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <div className="max-w-md mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter text-cyan-500">POS TERMINAL</h1>
          <p className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">Operational Node</p>
        </div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="max-w-md mx-auto">
        {uiMessage.text && (
          <div className={`mb-6 p-4 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 ${
            uiMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' :
            uiMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' :
            'bg-cyan-500/10 border-cyan-500 text-cyan-500 animate-pulse'
          }`}>
            {uiMessage.type === 'loading' && <Loader2 size={16} className="animate-spin" />}
            {uiMessage.text}
          </div>
        )}

        {!scannedId ? (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 justify-center text-cyan-500">
                <QrCode size={24} />
                <h2 className="text-sm font-bold tracking-widest uppercase">Auto-Scan QR</h2>
              </div>
              
              <div className={`rounded-2xl overflow-hidden border-2 relative bg-black w-full min-h-[300px] flex items-center justify-center transition-all ${uiMessage.type === 'error' ? 'border-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'border-cyan-500/30'}`}>
                <div id="tactical-scanner" className="w-full h-full"></div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl">
               <div className="flex items-center gap-3 mb-4 justify-center text-slate-500">
                <Keyboard size={18} />
                <h2 className="text-[10px] font-bold tracking-widest uppercase">Manual Override</h2>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="INPUT ID..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-black/60 border border-slate-800 p-4 rounded-xl text-sm font-mono outline-none focus:border-cyan-500/50 transition-all text-white tracking-widest uppercase"
                />
                <button 
                  type="submit"
                  disabled={!manualInput || isProcessing}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                >
                  ENTER
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl mb-6 border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Target ID</p>
                <p className="font-mono text-cyan-500 font-bold text-lg">{scannedId}</p>
              </div>
              <button 
                onClick={() => setScannedId('')}
                className="text-slate-500 hover:text-rose-500 transition-colors"
              >
                <XCircle size={28} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setTransactionType('charge')}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  transactionType === 'charge' 
                    ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
                    : 'bg-black/40 border-slate-800 text-slate-500'
                }`}
              >
                <ArrowDownCircle size={24} />
                <span className="text-xs font-bold tracking-widest uppercase">Charge</span>
              </button>
              <button
                onClick={() => setTransactionType('topup')}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                  transactionType === 'topup' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                    : 'bg-black/40 border-slate-800 text-slate-500'
                }`}
              >
                <ArrowUpCircle size={24} />
                <span className="text-xs font-bold tracking-widest uppercase">Top Up</span>
              </button>
            </div>

            <div className="mb-6">
              <input
                type="number"
                placeholder="AMOUNT (Rp)..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 p-5 rounded-2xl text-center text-xl font-mono outline-none focus:border-cyan-500/50 transition-all text-white tracking-widest"
              />
            </div>

            <button
              onClick={handleTransaction}
              disabled={!amount || isProcessing}
              className={`w-full p-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                transactionType === 'charge'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(5,150,105,0.2)]'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isProcessing ? 'Executing...' : 'Confirm Transaction'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}