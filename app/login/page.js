'use client';
import { useState } from 'react';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e) => {
    // KUNCI MUTLAK: Cegah browser HP/IP nge-refresh halaman
    e.preventDefault(); 
    
    if (!password) {
      setErrorMsg('SECURITY KEY REQUIRED');
      return;
    }

    setErrorMsg('');
    setIsAuthenticating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const masterKey = process.env.NEXT_PUBLIC_COMMAND_KEY || 'KKYCKECE';
      const posKey = process.env.NEXT_PUBLIC_POS_KEY || 'rangerpos123';

      if (password.toUpperCase() === masterKey.toUpperCase()) {
        document.cookie = "user_role=ADMIN; path=/; max-age=86400";
        document.cookie = "user_id=MASTER-ADMIN; path=/; max-age=86400";
        window.location.href = '/admin';
      } else if (password === posKey) {
        document.cookie = "user_role=POS; path=/; max-age=86400";
        window.location.href = '/pos';
      } else {
        setErrorMsg('ACCESS DENIED: INVALID KEY');
        setIsAuthenticating(false);
      }
    } catch (err) {
      setErrorMsg('SYSTEM ERROR. REBOOT REQUIRED.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center mb-10">
          <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-[2rem] text-cyan-500 mb-6 shadow-lg">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white text-center">
            KKYC <span className="text-cyan-500">COMMAND CENTER</span>
          </h1>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 italic mt-2">Money Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="ENTER SECURITY KEY..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 p-6 pl-16 rounded-[2rem] text-sm font-mono outline-none focus:border-cyan-500/50 transition-all text-white tracking-widest shadow-inner text-center uppercase"
              autoComplete="new-password"
            />
          </div>

          {errorMsg && (
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic text-center animate-pulse">
              {errorMsg}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full p-6 rounded-[2.5rem] text-[12px] font-black uppercase italic shadow-2xl transition-all disabled:opacity-50 bg-cyan-600 text-white shadow-[0_0_30px_rgba(8,145,178,0.2)] hover:bg-cyan-500 active:scale-95 cursor-pointer"
          >
            {isAuthenticating ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin" size={18} />
                <span>Decrypting...</span>
              </div>
            ) : (
              'Initiate Connection'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}