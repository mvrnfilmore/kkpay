'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut, Keyboard } from 'lucide-react';

export default function PosTerminal() {
  const [scannedId, setScannedId] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('charge'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // INISIALISASI ENGINE HTML5-QRCODE (Tahan Banting untuk iOS)
  useEffect(() => {
    let html5QrCode;

    if (!scannedId) {
      html5QrCode = new Html5Qrcode("tactical-scanner");
      
      html5QrCode.start(
        { facingMode: "environment" }, // Paksa kamera belakang
        {
          fps: 10,    // Frame per detik, jangan terlalu tinggi biar HP gak panas
          qrbox: { width: 250, height: 250 } // Area fokus scanning
        },
        (decodedText) => {
          // JIKA BERHASIL SCAN
          setScannedId(decodedText.toUpperCase());
          html5QrCode.stop().catch(console.error); // Matikan kamera setelah dapat data
        },
        (errorMessage) => {
          // Abaikan error di sini, karena library ini akan terus melempar error 
          // setiap milidetik selama dia tidak melihat pola QR di depannya.
        }
      ).catch((err) => {
        console.error("Gagal memulai kamera:", err);
      });
    }

    // CLEANUP: Pastikan kamera mati saat komponen dibongkar
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [scannedId]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setScannedId(manualInput.trim().toUpperCase());
      setManualInput('');
    }
  };

  const handleTransaction = async () => {
    if (!amount || isNaN(amount)) return;
    setIsProcessing(true);

    // TODO: Titik injeksi database Supabase lu
    console.log(`Executing ${transactionType} of ${amount} for ID: ${scannedId}`);
    await new Promise(res => setTimeout(res, 1000));
    alert(`TRANSACTION SUCCESS: ${transactionType.toUpperCase()} ${amount}`);
    
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
        {!scannedId ? (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6 justify-center text-cyan-500">
                <QrCode size={24} />
                <h2 className="text-sm font-bold tracking-widest uppercase">Auto-Scan QR</h2>
              </div>
              
              {/* TARGET WADAH VIDEO KAMERA */}
              <div className="rounded-2xl overflow-hidden border-2 border-cyan-500/30 relative bg-black w-full min-h-[300px] flex items-center justify-center">
                {/* Engine akan merender video di dalam ID ini */}
                <div id="tactical-scanner" className="w-full h-full"></div>
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-4 tracking-widest uppercase">Align QR Code within the frame</p>
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
                  disabled={!manualInput}
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