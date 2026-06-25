'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'; 
import { QrCode, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut, Keyboard, Loader2, User, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PosTerminal() {
  const [scannedId, setScannedId] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [scannedUuid, setScannedUuid] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('charge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchResults, setSearchResults] = useState([]); // STATE BARU UNTUK DAFTAR KANDIDAT
  const [uiMessage, setUiMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resetTargetState = () => {
    setScannedId(''); setScannedName(''); setScannedUuid('');
    setAmount(''); setShowDeleteConfirm(false); setUiMessage({ type: '', text: '' });
    setSearchResults([]); 
  };

  useEffect(() => {
    let html5QrCode;
    if (!scannedId) {
      html5QrCode = new Html5Qrcode("tactical-scanner", {
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      });
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 100, height: 100 } },
        (decodedText) => {
          if (html5QrCode.getState() === 2) {
            html5QrCode.pause();
            setUiMessage({ type: 'loading', text: 'VERIFYING ID...' });
            const targetId = decodedText.toUpperCase();
            supabase.from('rangers').select('id, qr_code, name').ilike('qr_code', targetId).limit(1)
              .then(({ data, error }) => {
                if (error || !data || data.length === 0) {
                  setUiMessage({ type: 'error', text: `ID [${targetId}] TIDAK VALID` });
                  setTimeout(() => { setUiMessage({ type: '', text: '' }); html5QrCode.resume(); }, 2000);
                } else {
                  setScannedUuid(data[0].id); setScannedId(data[0].qr_code);
                  setScannedName(data[0].name || 'UNKNOWN RANGER'); setUiMessage({ type: '', text: '' });
                  html5QrCode.stop().catch(console.error);
                }
              });
          }
        },
        () => {}
      ).catch((err) => console.error("Scanner Error:", err));
    }
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(console.error); };
  }, [scannedId]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setIsProcessing(true); setUiMessage({ type: 'loading', text: 'MENCARI DATA...' });
      const queryTerm = manualInput.trim();
      try {
        // DUAL-QUERY: Geledah kolom qr_code ATAU kolom name
        const { data, error } = await supabase
          .from('rangers')
          .select('id, qr_code, name')
          .or(`qr_code.ilike.%${queryTerm}%,name.ilike.%${queryTerm}%`)
          .limit(5); // Batasi 5 hasil agar layar tidak penuh
          
        if (error || !data || data.length === 0) throw new Error(`[${queryTerm}] TIDAK DITEMUKAN.`);
        
        if (data.length === 1) {
          // Kalau cuma ketemu 1, langsung lock target
          setScannedUuid(data[0].id); setScannedId(data[0].qr_code);
          setScannedName(data[0].name || 'UNKNOWN RANGER'); 
          setUiMessage({ type: '', text: '' });
          setManualInput(''); setSearchResults([]);
        } else {
          // Kalau lebih dari 1 (nama mirip), munculkan list
          setSearchResults(data);
          setUiMessage({ type: 'success', text: `DITEMUKAN ${data.length} KANDIDAT` });
        }
      } catch (err) { 
        setUiMessage({ type: 'error', text: err.message }); 
        setTimeout(() => setUiMessage({ type: '', text: '' }), 3000); 
      }
      setIsProcessing(false); 
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount)) return;
    setIsProcessing(true); setUiMessage({ type: 'loading', text: 'MEMPROSES...' });
    try {
      const { data, error: fetchError } = await supabase.from('rangers').select('balance').eq('id', scannedUuid).limit(1);
      if (fetchError || !data || data.length === 0) throw new Error("Gagal mengambil data saldo.");
      const newBalance = transactionType === 'charge' ? (data[0].balance || 0) - Number(amount) : (data[0].balance || 0) + Number(amount);
      if (newBalance < 0) throw new Error("SALDO TIDAK MENCUKUPI!");
      
      const { error: updateError } = await supabase.from('rangers').update({ balance: newBalance }).eq('id', scannedUuid);
      if (updateError) throw new Error("GAGAL UPDATE SALDO.");
      
      const logAmount = transactionType === 'charge' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      await supabase.from('ledger').insert([{ to_id: scannedUuid, from_id: null, amount: logAmount, description: 'Transaction Executed' }]);
      
      setUiMessage({ type: 'success', text: `BERHASIL! SISA SALDO: KKC${newBalance.toLocaleString()}` });
      setTimeout(resetTargetState, 3000);
    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000);
    } finally { setIsProcessing(false); }
  };

  const handleDeleteTarget = async () => {
    setIsProcessing(true); setUiMessage({ type: 'loading', text: 'MENGHAPUS...' });
    try {
      const { error } = await supabase.from('rangers').delete().eq('id', scannedUuid);
      if (error) throw new Error(`GAGAL HAPUS: Pastikan riwayat transaksi kosong.`);
      setUiMessage({ type: 'success', text: `TARGET BERHASIL DIHAPUS.` });
      setTimeout(resetTargetState, 3000);
    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 6000);
    } finally { setIsProcessing(false); setShowDeleteConfirm(false); }
  };

  const handleLogout = () => { document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      <div className="max-w-md mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div><h1 className="text-xl font-black italic tracking-tighter text-cyan-500 underline decoration-cyan-500/30">POS TERMINAL</h1><p className="text-[10px] tracking-[0.2em] text-slate-500 uppercase font-bold">Secure Access Node</p></div>
        <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500 transition-all"><LogOut size={20} /></button>
      </div>
      <div className="max-w-md mx-auto">
        {uiMessage.text && (<div className={`mb-6 p-4 rounded-xl border text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl ${uiMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : uiMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-cyan-500/10 border-cyan-500 text-cyan-500 animate-pulse'}`}>{uiMessage.type === 'loading' && <Loader2 size={16} className="animate-spin" />}{uiMessage.text}</div>)}
        {!scannedId ? (
          <div className="space-y-6">
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 justify-center text-cyan-500"><QrCode size={24} /><h2 className="text-sm font-black tracking-widest uppercase italic">Optical Scanner</h2></div>
              <div className={`rounded-2xl overflow-hidden border-2 relative bg-black w-full min-h-[300px] flex items-center justify-center transition-all ${uiMessage.type === 'error' ? 'border-rose-500' : 'border-cyan-500/20'}`}>
                <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none"><div className="bg-rose-500/90 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(225,29,72,0.5)] animate-pulse">⚠️ JAUHKAN HP 10-15 CM</div></div>
                <div id="tactical-scanner" className="w-full h-full"></div>
              </div>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4 justify-center text-slate-500 uppercase"><Keyboard size={18} /><h2 className="text-[10px] font-black tracking-widest">Manual Override</h2></div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ID ATAU NAMA..." 
                  value={manualInput} 
                  onChange={(e) => {
                    setManualInput(e.target.value);
                    if (e.target.value === '') setSearchResults([]); // Otomatis hapus list kalau input dikosongkan
                  }} 
                  className="flex-1 bg-black/60 border border-slate-800 p-4 rounded-xl text-sm font-mono outline-none focus:border-cyan-500/50 text-white tracking-widest uppercase transition-all" 
                />
                <button type="submit" disabled={!manualInput || isProcessing} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20">CARI</button>
              </form>

              {/* DAFTAR KANDIDAT MUNCUL DI SINI JIKA NAMA LEBIH DARI SATU */}
              {searchResults.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                  {searchResults.map((ranger) => (
                    <button 
                      key={ranger.id}
                      onClick={() => {
                        setScannedUuid(ranger.id); setScannedId(ranger.qr_code);
                        setScannedName(ranger.name || 'UNKNOWN RANGER');
                        setSearchResults([]); setManualInput(''); setUiMessage({ type: '', text: '' });
                      }}
                      className="flex justify-between items-center bg-black/40 border border-cyan-500/30 p-3 rounded-xl hover:bg-cyan-500/20 transition-all text-left group"
                    >
                      <div>
                        <p className="text-xs font-black text-white uppercase group-hover:text-cyan-400 transition-colors">{ranger.name}</p>
                        <p className="text-[10px] text-cyan-500/70 font-mono mt-0.5">{ranger.qr_code}</p>
                      </div>
                      <User size={16} className="text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl mb-6 border border-slate-800 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10"><div className="bg-cyan-500/10 p-3 rounded-full text-cyan-500 border border-cyan-500/20"><User size={24} /></div><div><p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Authorized Ranger</p><p className="font-sans font-black text-white text-lg uppercase tracking-wider">{scannedName}</p><p className="font-mono text-cyan-500 font-bold text-xs mt-1 bg-cyan-500/10 px-2 py-0.5 rounded inline-block">{scannedId}</p></div></div>
              <div className="flex gap-3 relative z-10"><button onClick={() => setShowDeleteConfirm(true)} disabled={isProcessing} className="text-slate-600 hover:text-rose-500 transition-all disabled:opacity-30"><Trash2 size={24} /></button><button onClick={resetTargetState} disabled={isProcessing} className="text-slate-600 hover:text-cyan-500 transition-all disabled:opacity-30"><XCircle size={28} /></button></div>
            </div>
            {showDeleteConfirm ? (
              <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl mb-6 flex flex-col gap-4"><p className="text-[10px] font-black text-rose-500 tracking-widest uppercase text-center">Konfirmasi: Hapus Ranger Ini?</p><div className="flex gap-3"><button onClick={() => setShowDeleteConfirm(false)} disabled={isProcessing} className="flex-1 p-3 bg-black/40 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all disabled:opacity-30">BATAL</button><button onClick={handleDeleteTarget} disabled={isProcessing} className="flex-1 p-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-[10px] font-black text-white tracking-widest transition-all disabled:opacity-30">EKSEKUSI</button></div></div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6"><button onClick={() => setTransactionType('charge')} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 ${transactionType === 'charge' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-black/40 border-slate-800 text-slate-500'}`}><ArrowDownCircle size={24} /><span className="text-[10px] font-black tracking-widest uppercase">Charge</span></button><button onClick={() => setTransactionType('topup')} className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 ${transactionType === 'topup' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-black/40 border-slate-800 text-slate-500'}`}><ArrowUpCircle size={24} /><span className="text-[10px] font-black tracking-widest uppercase">Top Up</span></button></div>
                <div className="mb-6"><input type="number" placeholder="NOMINAL (KKC)..." value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-black/60 border border-slate-800 p-5 rounded-2xl text-center text-xl font-mono outline-none focus:border-cyan-500/50 text-white tracking-[0.2em] transition-all" /></div>
                <button onClick={handleTransaction} disabled={!amount || isProcessing} className={`w-full p-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all ${transactionType === 'charge' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:opacity-30`}>{isProcessing ? 'Transmitting Data...' : 'Confirm Transaction'}</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}