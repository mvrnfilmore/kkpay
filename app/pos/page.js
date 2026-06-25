'use client';
import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, ArrowDownCircle, ArrowUpCircle, XCircle, LogOut, Keyboard, Loader2, User, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// INISIALISASI KONEKSI DATABASE
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
  const [uiMessage, setUiMessage] = useState({ type: '', text: '' }); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const resetTargetState = () => {
    setScannedId('');
    setScannedName('');
    setScannedUuid('');
    setAmount('');
    setShowDeleteConfirm(false);
    setUiMessage({ type: '', text: '' });
  };

  useEffect(() => {
    let html5QrCode;
    if (!scannedId) {
      html5QrCode = new Html5Qrcode("tactical-scanner");
      
      html5QrCode.start(
        { 
          facingMode: "environment",
          // Paksa browser untuk terus mengunci fokus (jika didukung OS)
          advanced: [{ focusMode: "continuous" }] 
        },
        { 
          fps: 10, // Beri waktu algoritma untuk membaca piksel kecil
          qrbox: { width: 250, height: 250 } // Area pencarian dilebarkan
        },
        (decodedText) => {
          if (html5QrCode.getState() === 2) { 
            html5QrCode.pause(); 
            setUiMessage({ type: 'loading', text: 'VERIFYING ID...' });
            const targetId = decodedText.toUpperCase();
            
            supabase
              .from('rangers')
              .select('id, qr_code, name') 
              .ilike('qr_code', targetId) 
              .limit(1) 
              .then(({ data, error }) => {
                if (error || !data || data.length === 0) {
                  setUiMessage({ type: 'error', text: `ID [${targetId}] TIDAK VALID` });
                  setTimeout(() => { setUiMessage({ type: '', text: '' }); html5QrCode.resume(); }, 2000);
                } else {
                  setScannedUuid(data[0].id);
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
        const { data, error } = await supabase.from('rangers').select('id, qr_code, name').ilike('qr_code', targetId).limit(1);
        if (error || !data || data.length === 0) {
          setUiMessage({ type: 'error', text: `ID [${targetId}] tidak ditemukan.` });
        } else {
          setScannedUuid(data[0].id);
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
      const { data, error: fetchError } = await supabase.from('rangers').select('balance').eq('id', scannedUuid).limit(1); 
      if (fetchError || !data || data.length === 0) throw new Error("Gagal mengambil data saldo.");

      const currentBalance = data[0].balance || 0;
      const nominal = Number(amount);
      const newBalance = transactionType === 'charge' ? currentBalance - nominal : currentBalance + nominal;

      if (newBalance < 0) throw new Error("SALDO TIDAK MENCUKUPI!");

      const { error: updateError } = await supabase.from('rangers').update({ balance: newBalance }).eq('id', scannedUuid);
      if (updateError) throw new Error(`GAGAL UPDATE SALDO: ${updateError.message}`);

      const logAmount = transactionType === 'charge' ? -Math.abs(nominal) : Math.abs(nominal);
      const { error: logError } = await supabase.from('ledger').insert([{ 
          to_id: scannedUuid, 
          from_id: null, 
          amount: logAmount,
          description: 'Transaction Executed'
      }]);

      if (logError) console.error("LOG ERROR:", logError.message);

      setUiMessage({ type: 'success', text: `BERHASIL! SISA SALDO: KKC${newBalance.toLocaleString()}` });
      setTimeout(resetTargetState, 3000);
    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000);
    } finally { setIsProcessing(false); }
  };

  const handleDeleteTarget = async () => {
    setIsProcessing(true);
    setUiMessage({ type: 'loading', text: 'MENGHAPUS TARGET...' });

    try {
      const { error } = await supabase.from('rangers').delete().eq('id', scannedUuid);
      if (error) throw new Error(`GAGAL HAPUS: Pastikan riwayat transaksi di Ledger kosong. (${error.message})`);

      setUiMessage({ type: 'success', text: `TARGET [${scannedId}] BERHASIL DIHAPUS DARI SISTEM.` });
      setTimeout(resetTargetState, 3000);
    } catch (err) {
      setUiMessage({ type: 'error', text: err.message });
      setTimeout(() => setUiMessage({ type: '', text: '' }), 6000);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
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
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-