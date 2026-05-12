'use client';
import { useState, useEffect } from 'react';
import QRScanner from '../../components/qrscanner';
import { Camera, Zap, User, Receipt, AlertCircle, CheckCircle2, Waves } from 'lucide-react';

export default function CoastalPOS() {
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);

  // PROTEKSI SATPAM: Cek akses via LocalStorage
  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (!role || (role !== 'pos' && role !== 'admin')) {
      window.location.href = '/login';
    }
  }, []);

  const handleTransaction = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'MEMPROSES TRANSAKSI...' });

    try {
      const res = await fetch('/api/transact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrCode: targetId, 
          amount: amount 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ type: 'success', msg: `BERHASIL! Saldo ${data.rangerName} terpotong.` });
        setTargetId('');
        setAmount('');
      } else {
        setStatus({ type: 'error', msg: data.error || 'TRANSAKSI GAGAL' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'SERVER TIDAK MERESPONS' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
      
      <header className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-5 relative z-10">
        <Zap className="text-amber-400" fill="currentColor" size={24} />
        <div>
          <h1 className="text-xl font-black text-white tracking-widest uppercase">Coastal POS</h1>
          <p className="text-[10px] text-cyan-500 tracking-[0.3em] font-bold uppercase">Authorized Merchant Only</p>
        </div>
      </header>

      <main className="max-w-md mx-auto relative z-10">
        {!targetId ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <QRScanner onScanSuccess={(text) => setTargetId(text)} />
            </div>
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">Arahkan kamera ke QR Peserta</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950 rounded-lg text-cyan-400">
                  <User size={20} />
                </div>
                <span className="font-mono text-sm tracking-tighter text-white">{targetId}</span>
              </div>
              <button 
                onClick={() => {setTargetId(''); setStatus(null);}}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 tracking-widest uppercase"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleTransaction} className="p-8 space-y-8">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-4 tracking-[0.2em] uppercase">Nominal Transaksi (IDR)</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xl">Rp</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-slate-700 pb-4 pl-10 text-4xl text-white outline-none focus:border-cyan-500 transition-all font-bold"
                    placeholder="0"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={status?.type === 'loading'}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 tracking-[0.2em] uppercase disabled:opacity-50"
              >
                {status?.type === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Receipt size={20} />
                    Proses Bayar
                  </>
                )}
              </button>
            </form>

            {status && status.type !== 'loading' && (
              <div className={`m-8 mt-0 p-4 rounded-xl flex items-center gap-3 border ${status.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/50 bg-rose-500/5 text-rose-400'}`}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <p className="text-[11px] font-bold tracking-wide uppercase">{status.msg}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Wave Decoration */}
      <div className="fixed bottom-0 left-0 w-full opacity-5 pointer-events-none">
        <Waves size={400} className="w-full h-auto" />
      </div>
    </div>
  );
}