'use client';
import { useState } from 'react';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: 'OTORISASI...' });

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });

      const data = await res.json();
      if (res.ok) {
        window.location.replace(data.role === 'admin' ? '/admin' : '/pos');
      } else {
        setStatus({ type: 'error', msg: data.error });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'KONEKSI GAGAL' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 rounded-[2.5rem] border border-slate-800 p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <ShieldCheck className="text-cyan-400 mb-4" size={40} />
          <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">Security Gate</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-xl text-white tracking-[0.5em] text-center outline-none focus:border-cyan-400 font-bold"
              placeholder="••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2"
          >
            {status?.type === 'loading' ? <Loader2 className="animate-spin" /> : 'Authorize'}
          </button>
        </form>
        {status?.type === 'error' && (
          <p className="mt-4 text-center text-rose-500 text-xs font-bold uppercase">{status.msg}</p>
        )}
      </div>
    </div>
  );
}