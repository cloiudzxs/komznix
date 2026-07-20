'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Search, Eye, X, RotateCcw, RotateCw, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'Diproses', 'Selesai', 'Gagal'];

const statusStyle = {
  Pending: 'bg-gray-500/10 text-gray-400',
  Diproses: 'bg-blue-500/10 text-blue-400',
  Selesai: 'bg-[#FFB800]/10 text-[#FFB800]',
  Gagal: 'bg-red-500/10 text-red-400',
};

function formatRupiah(value) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatTanggal(iso) {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
  return `${dd} ${month}`;
}

function formatTanggalLengkap(iso) {
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd} ${month} ${date.getFullYear()}, ${hh}:${mm}`;
}

// Tabel `orders` disimpan flat (bukan gabung nama/email pelanggan), jadi
// bagian "profiles" hasil embed Supabase (lihat app/api/admin/orders) di-flatten
// di sini biar komponen di bawah gampang makainya.
function mapOrderRow(row) {
  return {
    id: row.id,
    displayId: row.provider_order_id ? `ORD-${row.provider_order_id}` : row.id,
    user: row.profiles?.email || row.profiles?.full_name || '-',
    layanan: row.layanan,
    platform: row.platform,
    target: row.target,
    jumlah: row.jumlah,
    harga: Number(row.harga),
    status: row.status,
    refunded: row.refunded,
    createdAt: row.created_at,
  };
}

function OrderDetailModal({ order, onClose, onRefund }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-lg">{order.layanan}</p>
            <p className="font-mono text-sm text-gray-400 mt-1">{order.displayId}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[order.status]}`}>
              {order.status}
            </span>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 text-sm bg-[#111111] border border-white/10 rounded-xl p-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">User</p>
              <p>{order.user}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Target</p>
              <p className="truncate">{order.target}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Jumlah</p>
              <p>{order.jumlah.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Harga</p>
              <p>{formatRupiah(order.harga)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Dibuat</p>
              <p>{formatTanggalLengkap(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Platform</p>
              <p>{order.platform || '-'}</p>
            </div>
          </div>

          {order.status === 'Gagal' && (
            order.refunded ? (
              <div className="flex items-center gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-sm rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4" />
                Saldo sudah dikembalikan ke {order.user}.
              </div>
            ) : (
              <div className="flex flex-col gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  Pesanan ini gagal dan saldonya <span className="font-medium text-white">belum</span> dikembalikan
                  ke pengguna.
                </p>
                <button
                  onClick={() => onRefund(order.id)}
                  className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#e6a600] transition-colors w-fit"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refund {formatRupiah(order.harga)} ke Saldo User
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refillingId, setRefillingId] = useState(null);
  const [refillFeedback, setRefillFeedback] = useState(null); // { id, ok, message }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders', {
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat pesanan.');
      setOrders((data.orders || []).map(mapOrderRow));
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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  async function patchOrder(id, patch) {
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('Gagal update pesanan:', data.error);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function handleStatusChange(id, newStatus) {
    patchOrder(id, { status: newStatus });
  }

  function handleRefund(id) {
    patchOrder(id, { refunded: true });
  }

  // Minta provider (SMMSOC) ngirim ulang pesanan yang drop. Butuh ID
  // pesanan versi PROVIDER (bukan id database kita), makanya ambil dari
  // displayId (format "ORD-{providerOrderId}").
  async function handleRefill(order) {
    const providerOrderId = order.displayId.startsWith('ORD-') ? order.displayId.replace('ORD-', '') : null;
    if (!providerOrderId) {
      setRefillFeedback({ id: order.id, ok: false, message: 'ID pesanan di provider gak ketemu.' });
      setTimeout(() => setRefillFeedback(null), 4000);
      return;
    }

    setRefillingId(order.id);
    try {
      const res = await fetch('/api/smm/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerOrderId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal minta refill.');
      setRefillFeedback({ id: order.id, ok: true, message: 'Refill berhasil diminta ke provider.' });
    } catch (err) {
      setRefillFeedback({ id: order.id, ok: false, message: err.message });
    } finally {
      setRefillingId(null);
      setTimeout(() => setRefillFeedback(null), 4000);
    }
  }

  const filtered = orders.filter((o) => {
    const matchQuery =
      !query.trim() ||
      o.displayId.toLowerCase().includes(query.toLowerCase()) ||
      o.user.toLowerCase().includes(query.toLowerCase()) ||
      (o.layanan || '').toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'semua' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-bold">Kelola Pesanan</h2>
      </div>

      <p className="text-sm text-gray-400 -mt-2">
        Pesanan asli dari semua pelanggan, langsung dari database — bukan data contoh lagi.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ID pesanan, email, atau layanan..."
            className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#191A19] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
        >
          <option value="semua">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
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
          <p className="text-sm text-gray-400">Memuat pesanan...</p>
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
                  <th className="px-6 py-3 font-medium">Pesanan</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">User</th>
                  <th className="px-6 py-3 font-medium">Jumlah</th>
                  <th className="px-6 py-3 font-medium">Harga</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Tanggal</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-medium">{o.layanan}</p>
                      <p className="text-gray-500 text-xs mt-0.5 font-mono">{o.displayId}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{o.user}</td>
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{o.jumlah.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatRupiah(o.harga)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-[#FFB800] ${statusStyle[o.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="bg-[#191A19] text-white">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      {formatTanggal(o.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {refillFeedback?.id === o.id && (
                          <span
                            className={`text-xs whitespace-nowrap mr-1 ${refillFeedback.ok ? 'text-[#FFB800]' : 'text-red-400'}`}
                          >
                            {refillFeedback.message}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedOrderId(o.id)}
                          title="Lihat Detail"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefill(o)}
                          disabled={refillingId === o.id}
                          title="Minta Refill ke Provider"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                          {refillingId === o.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RotateCw className="w-4 h-4" />
                          )}
                        </button>
                        {o.status === 'Gagal' && !o.refunded && (
                          <button
                            onClick={() => handleRefund(o.id)}
                            title="Refund Saldo ke User"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {o.status === 'Gagal' && o.refunded && (
                          <span title="Sudah Direfund" className="w-8 h-8 flex items-center justify-center text-gray-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {orders.length === 0 ? 'Belum ada pesanan dari pelanggan.' : 'Tidak ada pesanan yang cocok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrderId(null)} onRefund={handleRefund} />
      )}
    </div>
  );
}