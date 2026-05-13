'use client';
import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, ScanLine, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut } from 'lucide-react';

export default function PosTerminal() {
  const [scannedId, setScannedId] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('charge'); // 'charge' atau 'topup'
  const [isProcessing, setIsProcessing] = useState(false);

  // Fungsi ketika QR berhasil terbaca
  const handleScan = (text) => {
    if (text) {
      setScannedId(text);
      // Mainkan suara beep kecil jika diperlukan (opsional)
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount)) return;
    setIsProcessing(true);

    // TODO: Masukkan logika API Supabase lu di sini untuk potong/tambah saldo
    console.log(`Executing ${transactionType} of ${amount} for ID: ${scannedId}`);
    
    // Simulasi delay API
    await new Promise(res => setTimeout(res, 1000));

    alert(`TRANSACTION SUCCESS: ${transactionType.toUpperCase()} ${amount}`);
    
    // Reset terminal untuk peserta berikutnya
    setIsProcessing(false);
    setScannedId('');
    setAmount('');
  };

  const handleLogout = () => {
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 font-sans">
      {/* Header Terminal */}
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
        {/* FASE 1: SCANNER AKTIF (Jika belum ada ID yang terpindai) */}
        {!scannedId ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 justify-center text-cyan-500">
              <QrCode size={24} />
              <h2 className="text-sm font-bold tracking-widest uppercase">Scan Participant QR</h2>
            </div>
            
            <div className="rounded-2xl overflow-hidden border-2 border-cyan-500/30 relative">
              {/* Garis scanning animasi (CSS murni) */}
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4] z-10 animate-[scan_2s_ease-in-out_infinite]" />
              
              <Scanner 
                onResult={handleScan}
                onError={(error) => console.log(error?.message)}
                options={{ delayBetweenScanAttempts: 500 }}
                styles={{ container: { width: '100%', borderRadius: '1rem' } }}
              />
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-4 tracking-widest uppercase">Align QR Code within the frame</p>
          </div>
        ) : (
          /* FASE 2: PANEL TRANSAKSI (Setelah QR terpindai) */
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl mb-6 border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Target ID</p>
                <p className="font-mono text-cyan-500 font-bold">{scannedId}</p>
              </div>
              <button 
                onClick={() => setScannedId('')}
                className="text-slate-500 hover:text-rose-500 transition-colors"
                title="Cancel & Rescan"
              >
                <XCircle size={24} />
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
                className="w-full bg-black/60 border border-slate-800 p-5 rounded-2xl text-center text-lg font-mono outline-none focus:border-cyan-500/50 transition-all text-white tracking-widest"
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

      {/* Tambahkan keyframes untuk animasi garis scanner di globals.css lu nanti jika perlu */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}