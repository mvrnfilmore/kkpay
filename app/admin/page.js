'use client';
import { useState, useEffect } from 'react';
import QRScanner from '../../components/qrscanner';
import { 
  Compass, 
  Users, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp,
  LogOut,
  Loader2
} from 'lucide-react';

export default function CommandCenter() {
  const [showTopUp, setShowTopUp] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [stats, setStats] = useState({ circulation: 0, txCount: 0 });

  // Simulasi fetch data statistik (Bisa lu hubungkan ke Firebase nanti)
  useEffect(() => {
    setStats({ circulation: 2500000, txCount: 42 });
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.replace('/login');
      }
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'MENGIRIM DANA...' });

    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrCode: targetId, 
          amount: amount,
          adminPin: 'KUDUSCOMMAND' 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', msg: data.message });
        setTimeout(() => {
          setShowTopUp(false);
          setTargetId('');
          setAmount('');
          setStatus(null);
        }, 2000);
      } else {
        setStatus({ type: 'error', msg: data.error });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'SERVER TIDAK MERESPONS' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans p-6 md:p-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Compass className="text-cyan-400" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase">Central Command</h1>
            <p className="text-[10px] text-cyan-500 tracking-[0.4em] font-bold uppercase">KKYC 2026 Intelligence</p>
          </div>
        </div>

        {/* Tombol Logout Taktis */}
        <button 
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 group"
        >
          {logoutLoading ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
          <span className="hidden md:inline text-[10px] font-black tracking-widest uppercase">Terminate Session</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
        <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-cyan-400">Total Circulation</p>
          <p className="text-4xl text-white font-black tracking-tighter">
            <span className="text-lg text-slate-500 mr-2 font-medium">Rp</span>
            {stats.circulation.toLocaleString('id-ID')}
          </p>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-xl">
          <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">TX Volume</p>
          <p className="text-4xl text-white font-black tracking-tighter">
            {stats.txCount} 
            <span className="text-sm font-bold text-slate-500 tracking-widest ml-3 uppercase italic">Ops</span>
          </p>
        </div>

        <button 
          onClick={() => setShowTopUp(true)}
          className="group relative flex flex-col items-center justify-center gap-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl shadow-2xl transition-all active:scale-95 overflow-hidden"
        >
          <PlusCircle size={32} />
          <span className="font-black tracking-[0.2em] text-xs uppercase">Balance Injection</span>
        </button>
      </div>

      {/* Modal Injection Saldo */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h2 className="text-white font-bold tracking-[0.2em] text-[10px] uppercase">Ranger Authorization</h2>
              <button onClick={() => setShowTopUp(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-10 text-center">
              {!targetId ? (
                <div className="space-y-6">
                  <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 flex justify-center">
                    <QRScanner onScanSuccess={(text) => setTargetId(text)} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Scan Participant ID</p>
                </div>
              ) : (
                <form onSubmit={handleTopUp} className="space-y-8">
                  <div className="inline-block px-4 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full text-cyan-400 font-mono text-xs tracking-widest">
                    TARGET: {targetId}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Nominal (IDR)</label>
                    <input 
                      type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-slate-800 p-4 text-4xl text-white outline-none focus:border-cyan-500 text-center font-black"
                      placeholder="0" required autoFocus
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={status?.type === 'loading'}
                    className="w-full bg-cyan-600 text-white font-black py-4 rounded-2xl tracking-[0.2em] shadow-lg hover:bg-cyan-500 disabled:opacity-50 uppercase text-[10px]"
                  >
                    {status?.type === 'loading' ? 'Processing...' : 'Confirm Injection'}
                  </button>
                  <button type="button" onClick={() => setTargetId('')} className="w-full text-[9px] text-slate-600 font-bold tracking-[0.2em] uppercase">Reset Target</button>
                </form>
              )}

              {status && (
                <div className={`mt-8 p-4 rounded-xl flex items-center justify-center gap-3 border ${status.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-rose-500/30 bg-rose-500/5 text-rose-400'}`}>
                  {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertOctagon size={20} />}
                  <p className="text-[10px] font-bold tracking-wide uppercase leading-tight">{status.msg}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
