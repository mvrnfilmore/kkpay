'use client';
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScanSuccess }) {
  const [scannerActive, setScannerActive] = useState(true);

  useEffect(() => {
    // Kalau scanner lagi nggak aktif, jangan render kameranya
    if (!scannerActive) return;

    // Konfigurasi presisi scanner: ukuran kotak scan dan frame rate
    const scanner = new Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10 
    });

    scanner.render(
      (decodedText) => {
        // Kalau berhasil scan: matikan kamera, ubah status, dan kirim data ID
        scanner.clear();
        setScannerActive(false);
        onScanSuccess(decodedText);
      },
      (error) => { 
        // Abaikan peringatan frame kosong biar console log nggak spam
      }
    );

    // Fungsi pembersihan (cleanup) kalau staf tiba-tiba pindah halaman
    return () => {
      scanner.clear().catch(e => console.error("Kamera gagal dimatikan:", e));
    };
  }, [scannerActive, onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-800 border border-slate-700 p-2 rounded-xl shadow-lg">
      {scannerActive ? (
        // Area ini yang bakal diganti jadi tampilan kamera oleh library
        <div id="reader" className="rounded-lg overflow-hidden bg-slate-900 min-h-[300px] flex items-center justify-center">
           <span className="text-slate-500 text-sm">Mengakses Kamera...</span>
        </div>
      ) : (
        // Tampilan setelah berhasil scan
        <div className="text-center p-6">
          <p className="text-cyan-400 font-bold tracking-widest mb-4">TARGET TERKUNCI</p>
          <button 
            onClick={() => setScannerActive(true)}
            className="bg-amber-500 text-slate-900 font-bold tracking-wider px-6 py-3 rounded-md shadow-lg hover:bg-amber-400 transition-all"
          >
            SCAN ULANG
          </button>
        </div>
      )}
    </div>
  );
}