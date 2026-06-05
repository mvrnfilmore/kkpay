'use client';
import { useState, useEffect } from 'react';
import { 
  Users, Search, ArrowLeft, TrendingDown, 
  TrendingUp, Database, Loader2, ChevronUp, ChevronDown 
} from 'lucide-react';
import Link from 'next/link';

export default function ParticipantLedger() {
  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  // 1. Sinkronisasi Data dengan Proteksi Auth
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch('/api/participants');
        if (res.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setParticipants(data);
        }
      } catch (err) {
        console.error("Sync Failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  // 2. Logic Sorting & Filtering
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    // Filter berdasarkan search term
    let filtered = participants.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id?.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(item => ({
      ...item,
      balance: item.balance ?? 0,
      status: (item.balance ?? 0) < 20000 ? 'CRITICAL' : 'STABLE'
    }));

    // Logic Sorting
    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  };

  const sortedData = getSortedData();

  // Helper untuk render icon sort
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <div className="w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-cyan-500" /> : <ChevronDown size={14} className="text-cyan-500" />;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="text-cyan-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-400 font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#0891b205_0%,transparent_50%)] pointer-events-none"></div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
            <ArrowLeft size={20} className="text-cyan-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase italic text-cyan-500">DASHBOARD</h1>
            <p className="text-[9px] text-slate-500 tracking-[0.4em] font-bold uppercase italic italic">OVERVIEW</p>
          </div>
        </div>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10 font-mono">
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-600 mb-2">Total Assets</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white italic">{participants.length}</span>
            <Users size={24} className="text-cyan-500/50" />
          </div>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-600 mb-2">Total Circulation</p>
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-2xl font-black italic italic">
              KKC {participants.reduce((a,c) => a + (c.balance ?? 0), 0).toLocaleString('id-ID')}
            </span>
            <TrendingUp size={24} className="opacity-50" />
          </div>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-slate-800/50 text-rose-500">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-slate-600 mb-2">Critical Alerts</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black italic animate-pulse">
              {participants.filter(p => (p.balance ?? 0) < 20000).length}
            </span>
            <TrendingDown size={24} className="opacity-50" />
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="relative z-10 bg-slate-900/20 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800/50 bg-slate-900/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
            <input 
              type="text"
              placeholder="SEARCH ASSET IDENTIFIER..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 p-4 pl-12 rounded-2xl text-[10px] text-white tracking-widest outline-none focus:border-cyan-500 font-bold uppercase placeholder:text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-900/10 uppercase italic text-[9px] font-black tracking-widest text-slate-500">
                <th className="p-6 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => requestSort('id')}>
                  <div className="flex items-center gap-2">ID {getSortIcon('id')}</div>
                </th>
                <th className="p-6 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">Personnel {getSortIcon('name')}</div>
                </th>
                <th className="p-6 cursor-pointer hover:text-cyan-400 transition-colors text-right" onClick={() => requestSort('balance')}>
                  <div className="flex items-center justify-end gap-2">Balance {getSortIcon('balance')}</div>
                </th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {sortedData.map((p) => (
                <tr key={p.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                  <td className="p-6 font-mono text-[10px] text-cyan-500/70">{p.id}</td>
                  <td className="p-6 text-[11px] font-black text-white tracking-wider uppercase">{p.name}</td>
                  <td className="p-6 text-right text-[11px] font-black text-white italic italic">
                    <span className="text-[9px] text-slate-700 mr-2 not-italic">KKC</span>
                    {p.balance.toLocaleString('id-ID')}
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-[0.2em] uppercase border ${
                      p.status === 'STABLE' 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                        : 'bg-rose-500/5 border-rose-500/20 text-rose-500 animate-pulse'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="mt-12 flex items-center justify-center gap-3 text-[8px] font-mono tracking-[0.4em] uppercase text-slate-800 italic">
        <Database size={12} />
        <span>Intelligence Node | KKYC 2026</span>
      </footer>
    </div>
  );
}