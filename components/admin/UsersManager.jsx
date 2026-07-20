'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Ban, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

function formatRupiah(value) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatTanggal(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
  return `${dd} ${month} ${date.getFullYear()}`;
}

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat pengguna.');
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'Aktif' ? 'Suspend' : 'Aktif';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('Gagal update status user:', data.error);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
  }

  const filtered = users.filter(
    (u) =>
      !query.trim() ||
      (u.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-bold">Kelola Pengguna</h2>
      </div>

      <p className="text-sm text-gray-400 -mt-2">
        Daftar pengguna asli dari database, bukan data contoh lagi.
      </p>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
          />
        </div>
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
          <p className="text-sm text-gray-400">Memuat pengguna...</p>
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
                  <th className="px-6 py-3 font-medium">Pengguna</th>
                  <th className="px-6 py-3 font-medium">Saldo</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Bergabung</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-medium">{u.full_name || '(Belum diisi)'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatRupiah(u.balance)}</td>
                    <td className="px-6 py-4 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                      {formatTanggal(u.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.status === 'Aktif' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-red-500/10 text-red-400'
                          }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.status === 'Aktif'
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-[#FFB800]/10 text-[#FFB800] hover:bg-[#FFB800]/20'
                          }`}
                      >
                        {u.status === 'Aktif' ? (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      {users.length === 0 ? 'Belum ada pengguna terdaftar.' : 'Tidak ada pengguna yang cocok.'}
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