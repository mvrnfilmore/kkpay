const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setIsProcessing(true);
      setUiMessage({ type: 'loading', text: 'MENGHUBUNGI DATABASE...' });
      const targetId = manualInput.trim().toUpperCase(); // Pastikan di DB hurufnya besar semua (KK1)
      
      try {
        const { data, error } = await supabase
          .from('rangers')
          .select('qr_code')
          .eq('qr_code', targetId)
          .single();

        if (error) {
          // INI AKAN MEMBONGKAR ALASAN ASLI SUPABASE MENOLAK
          setUiMessage({ type: 'error', text: `DB ERROR: ${error.message} (Code: ${error.code})` });
        } else if (!data) {
          setUiMessage({ type: 'error', text: `DATA KOSONG: Supabase mengembalikan hasil 0 baris untuk ${targetId}` });
        } else {
          setScannedId(targetId);
          setUiMessage({ type: '', text: '' });
        }
      } catch (err) {
        // INI AKAN MUNCUL JIKA KUNCI NETLIFY KOSONG / KONEKSI PUTUS
        setUiMessage({ type: 'error', text: `KONEKSI GAGAL: ${err.message}` });
      }

      setIsProcessing(false);
      setTimeout(() => setUiMessage({ type: '', text: '' }), 5000); // Tahan error 5 detik biar lu bisa baca
      setManualInput('');
    }
  };