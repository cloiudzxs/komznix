'use client';

import { useEffect, useState } from 'react';
import { Wallet, Search, Loader2, AlertTriangle, RefreshCw, CheckCircle2, X } from 'lucide-react';

function formatRupiah(value) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatTanggal(iso) {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd} ${month}, ${hh}:${mm}`;
}

const statusStyle = {
  Berhasil: 'bg-[#FFB800]/10 text-[#FFB800]',
  Kedaluwarsa: 'bg-gray-500/10 text-gray-400',
  'Menunggu Konfirmasi': 'bg-blue-500/10 text-blue-400',
  Ditolak: 'bg-red-500/10 text-red-400',
};

export default function DepositsManager() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [processingId, setProcessingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/deposits');
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat deposit.');
      setDeposits(data.deposits || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    setProcessingId(id);
    const res = await fetch('/api/admin/deposits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    setProcessingId(null);
    if (!res.ok || data.error) {
      console.error('Gagal update deposit:', data.error);
      return;
    }
    setDeposits((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  const filtered = deposits.filter((d) => {
    const email = d.profiles?.email || '';
    const matchQuery = !query.trim() || email.toLowerCase().includes(query.toLowerCase()) || d.id.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'semua' || d.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const totalMasuk = deposits.filter((d) => d.status === 'Berhasil').reduce((sum, d) => sum + Number(d.nominal), 0);
  const pendingCount = deposits.filter((d) => d.status === 'Menunggu Konfirmasi').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-bold">Deposit Masuk</h2>
      </div>

      <p className="text-sm text-gray-400 -mt-2">
        Deposit asli dari semua pelanggan. Yang metode-nya "Manual" butuh dikonfirmasi manual di sini setelah
        kamu cek bukti transfernya di WhatsApp — begitu dikonfirmasi, saldo user otomatis nambah.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total deposit berhasil</span>
          <span className="text-xl font-bold text-[#FFB800]">{loading ? '...' : formatRupiah(totalMasuk)}</span>
        </div>
        <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <span className="text-sm text-gray-400">Menunggu konfirmasi</span>
          <span className="text-xl font-bold text-blue-400">{loading ? '...' : pendingCount}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ID transaksi atau email..."
            className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#191A19] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
        >
          <option value="semua">Semua Status</option>
          <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
          <option value="Berhasil">Berhasil</option>
          <option value="Ditolak">Ditolak</option>
          <option value="Kedaluwarsa">Kedaluwarsa</option>
        </select>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
      </div>

      {loading && (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          <p className="text-sm text-gray-400">Memuat deposit...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-white/10">
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">User</th>
                  <th className="px-6 py-3 font-medium">Nominal</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Metode</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Waktu</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-gray-400 whitespace-nowrap">{d.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-gray-300 hidden md:table-cell">{d.profiles?.email || '-'}</td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap">{formatRupiah(d.nominal)}</td>
                    <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">{d.metode}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      {formatTanggal(d.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {d.status === 'Menunggu Konfirmasi' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateStatus(d.id, 'Berhasil')}
                            disabled={processingId === d.id}
                            title="Konfirmasi — saldo user ditambah otomatis"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors disabled:opacity-50"
                          >
                            {processingId === d.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => updateStatus(d.id, 'Ditolak')}
                            disabled={processingId === d.id}
                            title="Tolak"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {deposits.length === 0 ? 'Belum ada deposit dari pelanggan.' : 'Tidak ada transaksi yang cocok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}