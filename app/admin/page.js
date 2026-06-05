'use client';
import { useState, useEffect } from 'react';
import { 
  PlusCircle, MinusCircle, LayoutDashboard, Loader2, QrCode, 
  Search, User, LogOut, ShieldCheck, History, Wifi, WifiOff, AlertTriangle, UserPlus 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  
  // --- STATE SYSTEM ---
  const [participants, setParticipants] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');
  
  // mode: 'add' (Injection), 'sub' (Deduction), 'recruit' (Add User)
  const [mode, setMode] = useState('add'); 
  
  // States for Transaction
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRanger, setSelectedRanger] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  
  // States for Recruitment
  const [newRangerId, setNewRangerId] = useState('');
  const [newRangerName, setNewRangerName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); 

  // --- RESET STATES ---
  const [resetStep, setResetStep] = useState(0); 
  const [isResetting, setIsResetting] = useState(false);

  // --- AUTO SYNC ---
  const sync = async () => {
    try {
      const [resP, resH] = await Promise.all([ fetch('/api/participants'), fetch('/api/transactions') ]);
      if (resP.ok && resH.ok) {
        setParticipants(await resP.json());
        setAllHistory(await resH.json());
        setServerStatus('online');
      }
    } catch { setServerStatus('offline'); }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 10000); 
    return () => clearInterval(interval);
  }, []);

  // --- EXECUTE SUBMISSION (TRANSACTION OR RECRUIT) ---
  const handleExecute = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // JALUR REKRUTMEN (ADD USER)
      if (mode === 'recruit') {
        if (!newRangerId || !newRangerName) return;
        
        const res = await fetch('/api/participants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: newRangerId, name: newRangerName })
        });

        if (res.ok) {
          setStatusMessage({ type: 'success', text: `PROTOCOL SUCCESS: ${newRangerName.toUpperCase()} ENLISTED` });
          setNewRangerId('');
          setNewRangerName('');
          await sync(); // Langsung tarik data biar masuk ke suggestion
        } else {
          const errorData = await res.json();
          setStatusMessage({ type: 'error', text: `REJECTED: ${errorData.error || 'FAILED TO ENLIST'}` });
        }
      } 
      // JALUR TRANSAKSI (INJECTION / DEDUCTION)
      else {
        if (!selectedRanger || !topUpAmount) return;
        const amount = mode === 'add' ? Number(topUpAmount) : -Number(topUpAmount);

        const res = await fetch('/api/participants', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedRanger.id, amount })
        });

        if (res.ok) {
          setStatusMessage({ type: 'success', text: `PROTOCOL SUCCESS: ${selectedRanger.name.toUpperCase()} UPDATED` });
          setTopUpAmount('');
          setSelectedRanger(null);
          setSearchQuery('');
          await sync(); 
        } else {
          setStatusMessage({ type: 'error', text: `PROTOCOL REJECTED` });
        }
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'NODE FAILURE' });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // --- EXECUTE MASS RESET ---
  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `MASS RESET COMPLETE. ALL BALANCES: 0` });
        await sync();
      } else {
        setStatusMessage({ type: 'error', text: `RESET PROTOCOL FAILED` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: `NODE FAILURE DURING RESET` });
    } finally {
      setIsResetting(false);
      setResetStep(0);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // --- SECURITY: LOGOUT ---
  const handleLogout = () => {
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      
      {/* --- RESET MODAL --- */}
      {resetStep > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-rose-500 p-10 rounded-[2.5rem] max-w-md w-full text-center shadow-[0_0_50px_rgba(225,29,72,0.3)]">
            <AlertTriangle size={64} className="mx-auto text-rose-500 mb-6 animate-pulse" />
            <h2 className="text-2xl font-black uppercase italic text-rose-500 mb-2">CRITICAL WARNING</h2>
            <p className="text-[11px] text-slate-400 font-mono mb-8">
              {resetStep === 1 
                ? "This protocol will wipe all participant balances to 0. This action cannot be undone." 
                : "FINAL CONFIRMATION REQUIRED. ARE YOU ABSOLUTELY SURE?"}
            </p>
            
            <div className="space-y-4">
              {resetStep === 1 ? (
                <button onClick={() => setResetStep(2)} className="w-full p-4 bg-rose-600/20 border border-rose-500 text-rose-500 rounded-2xl font-black uppercase italic text-xs hover:bg-rose-600 hover:text-white transition-all">
                  Acknowledge & Proceed
                </button>
              ) : (
                <button onClick={handleResetAll} disabled={isResetting} className="w-full p-4 bg-rose-600 text-white rounded-2xl font-black uppercase italic text-xs hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                  {isResetting ? 'Wiping Databases...' : 'CONFIRM WIPE OUT'}
                </button>
              )}
              <button onClick={() => setResetStep(0)} className="w-full p-4 text-slate-500 text-xs font-bold uppercase hover:text-white transition-all">
                Cancel Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-start mb-16 relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-[1.5rem] text-cyan-500 shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">KKYC <span className="text-cyan-500">COMMAND CENTER</span></h1>
            <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] mt-2 ${serverStatus === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {serverStatus === 'online' ? <Wifi size={10} className="animate-pulse" /> : <WifiOff size={10} />}
              DATABASE LINK STATUS: {serverStatus}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setResetStep(1)} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500/20 transition-all group shadow-xl">
            <AlertTriangle size={24} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={handleLogout} className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-xl group">
            <LogOut size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        
        {/* MASTER LOG */}
        <div className="space-y-10">
          <Link href="/admin/ledger" className="flex items-center justify-between p-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-[2.5rem] hover:border-cyan-500/40 transition-all border-l-[6px] border-l-cyan-500 shadow-2xl">
            <div className="flex items-center gap-6">
              <LayoutDashboard size={36} className="text-cyan-500" />
              <div>
                <span className="block font-black text-lg tracking-widest uppercase italic text-white">MONEY DASHBOARD</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Live Assets Monitoring</span>
              </div>
            </div>
          </Link>

          <section className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 h-[520px] flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 text-slate-400 mb-8 italic border-b border-slate-800 pb-4">
              <History size={18} />
              <h2 className="text-[11px] font-black tracking-[0.3em] uppercase italic">Master Activity Log</h2>
            </div>
            <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar">
              {allHistory.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-5 bg-black/30 rounded-2xl border border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-xl ${log.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : log.amount < 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {log.amount === 0 ? <AlertTriangle size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-white tracking-widest group-hover:text-cyan-400 transition-colors">{log.targetName}</p>
                      <p className="text-[8px] text-cyan-500 font-mono mt-1">OP: {log.operatorName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[12px] font-black italic ${log.amount > 0 ? 'text-emerald-400' : log.amount < 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                      {log.amount > 0 ? '+' : ''}KKC {log.amount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[7px] text-slate-600 font-mono mt-1">{new Date(log.time).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CONSOLE */}
        <section className={`bg-slate-900/40 backdrop-blur-xl p-10 rounded-[3rem] border shadow-2xl transition-all h-fit ${mode === 'recruit' ? 'border-indigo-500/20' : mode === 'add' ? 'border-cyan-500/20' : 'border-rose-500/20'}`}>
          
          {/* TAB MENU */}
          <div className="flex p-1.5 bg-black/50 rounded-[1.5rem] border border-slate-800 mb-10">
            <button onClick={() => setMode('add')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase ${mode === 'add' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-600'}`}>INJECT</button>
            <button onClick={() => setMode('sub')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase ${mode === 'sub' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600'}`}>DEDUCT</button>
            <button onClick={() => setMode('recruit')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase ${mode === 'recruit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-600'}`}>ADD PERSON</button>
          </div>

          <form onSubmit={handleExecute} className="space-y-8">
            
            {/* CONDITIONAL FORM RENDERING */}
            {mode === 'recruit' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* RANGER ID */}
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-4 block tracking-[0.3em] italic">Code / Ranger ID</label>
                  <div className="relative">
                    <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. KK1" 
                      value={newRangerId} 
                      onChange={(e) => setNewRangerId(e.target.value)} 
                      className="w-full bg-black/60 border border-slate-800 p-6 pl-14 rounded-[2rem] text-sm font-mono outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest text-white shadow-inner" 
                    />
                  </div>
                </div>

                {/* RANGER NAME */}
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-4 block tracking-[0.3em] italic">Full Name</label>
                  <div className="relative">
                    <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                    <input 
                      type="text" 
                      placeholder="ENTER FULL NAME" 
                      value={newRangerName} 
                      onChange={(e) => setNewRangerName(e.target.value)} 
                      className="w-full bg-black/60 border border-slate-800 p-6 pl-14 rounded-[2rem] text-sm font-mono outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest text-white shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* SEARCH AREA (INJECTION / DEDUCTION) */}
                <div className="relative">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-4 block tracking-[0.3em] italic">Search Personnel</label>
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-cyan-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="ID (KK1) / NAME..." 
                      value={searchQuery} 
                      onFocus={() => setShowSuggestions(true)} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      className="w-full bg-black/60 border border-slate-800 p-6 pl-14 rounded-[2rem] text-sm font-mono outline-none focus:border-cyan-500/50 transition-all uppercase tracking-widest text-white shadow-inner" 
                    />
                  </div>

                  {/* ENHANCED SUGGESTIONS PANEL */}
                  {showSuggestions && searchQuery.length > 0 && (
                    <div className="absolute z-50 w-full mt-4 bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-60 overflow-y-auto custom-scrollbar">
                      {participants
                        .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => { setSelectedRanger(p); setSearchQuery(`${p.id.toUpperCase()} - ${p.name}`); setShowSuggestions(false); }}
                          className="p-6 hover:bg-cyan-500/10 cursor-pointer border-b border-slate-800/50 flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all"><User size={14} /></div>
                            <div>
                              <p className="text-[11px] font-black text-white group-hover:text-cyan-400 uppercase italic tracking-wider transition-colors">{p.name}</p>
                              <p className="text-[8px] text-slate-600 font-mono italic mt-0.5">{p.id.toUpperCase()}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-500/70 group-hover:text-emerald-400 transition-colors">KKC {p.balance.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      
                      {participants.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.id?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                         <div className="p-6 text-center text-[10px] text-rose-500 uppercase font-black italic tracking-widest">
                           Personnel Not Found
                         </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AMOUNT */}
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-4 block tracking-[0.3em] italic">Value Transmission (IDR)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={topUpAmount} 
                    onChange={(e) => setTopUpAmount(e.target.value)} 
                    className={`w-full bg-black/60 border p-6 rounded-[2rem] text-xl font-mono outline-none transition-all duration-500 shadow-inner ${mode === 'add' ? 'focus:border-cyan-500 border-slate-800' : 'focus:border-rose-500 border-rose-500/30 text-rose-400'}`} 
                  />
                </div>
              </div>
            )}

            {/* DYNAMIC SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={isProcessing || (mode === 'recruit' ? (!newRangerId || !newRangerName) : (!selectedRanger || !topUpAmount))} 
              className={`w-full p-7 rounded-[2.5rem] text-[12px] font-black uppercase italic shadow-2xl transition-all disabled:opacity-30 
                ${mode === 'recruit' ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.2)]' : 
                  mode === 'add' ? 'bg-cyan-600 text-white shadow-[0_0_30px_rgba(8,145,178,0.2)]' : 'bg-rose-600 text-white shadow-[0_0_30px_rgba(225,29,72,0.2)]'}`}
            >
              {isProcessing ? 'Executing...' : mode === 'recruit' ? 'Execute Enlistment' : 'Execute Protocol'}
            </button>

            {/* FEEDBACK */}
            {statusMessage && (
              <div className={`p-4 rounded-xl text-[10px] font-black text-center animate-bounce uppercase tracking-widest italic ${statusMessage.type === 'success' ? 'text-emerald-500 border border-emerald-500/30 bg-emerald-500/10' : 'text-rose-500 border border-rose-500/30 bg-rose-500/10'}`}>
                {statusMessage.text}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}