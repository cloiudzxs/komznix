'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Search,
  Eye,
  X,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'Diproses', 'Selesai', 'Gagal'];
const PAGE_SIZE = 50;

const statusStyle = {
  Pending: 'bg-gray-500/10 text-gray-400',
  Diproses: 'bg-blue-500/10 text-blue-400',
  Selesai: 'bg-[#FFB800]/10 text-[#FFB800]',
  Gagal: 'bg-red-500/10 text-red-400',
};

// Status di luar 4 opsi (mis. hasil mapping provider yang belum dikenal)
// dulu bikin className jadi "undefined" dan chip-nya rusak.
const chipClass = (status) => statusStyle[status] || 'bg-white/5 text-gray-400';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatRupiah(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Rp 0';
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function formatAngka(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('id-ID') : '-';
}

function formatTanggal(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')} ${BULAN[date.getMonth()]}`;
}

function formatTanggalLengkap(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dd} ${BULAN[date.getMonth()]} ${date.getFullYear()}, ${hh}:${mm}`;
}

// Tabel `orders` disimpan flat, jadi embed "profiles" dari Supabase
// di-flatten di sini. providerOrderId sekarang disimpan sebagai field
// sendiri — dulu harus dikorek balik dari string displayId lewat
// .replace('ORD-', ''), yang rapuh kalau format displayId berubah.
function mapOrderRow(row) {
  const providerOrderId = row.provider_order_id || null;
  return {
    id: row.id,
    providerOrderId,
    displayId: providerOrderId ? `ORD-${providerOrderId}` : row.id,
    user: row.profiles?.email || row.profiles?.full_name || '-',
    layanan: row.layanan || '-',
    platform: row.platform,
    target: row.target,
    jumlah: row.jumlah,
    harga: Number(row.harga) || 0,
    status: row.status,
    refunded: row.refunded === true,
    createdAt: row.created_at,
    // dipakai buat filter — dihitung sekali di sini, bukan tiap keystroke
    haystack: `${providerOrderId ? `ORD-${providerOrderId}` : row.id} ${row.profiles?.email || ''} ${row.profiles?.full_name || ''
      } ${row.layanan || ''}`.toLowerCase(),
  };
}

function OrderDetailModal({ order, onClose, onRefund, refunding }) {
  // Modal dulu gak bisa ditutup pakai Esc dan halaman di belakangnya masih
  // bisa di-scroll.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold text-lg">{order.layanan}</p>
            <p className="font-mono text-sm text-gray-400 mt-1 truncate">{order.displayId}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${chipClass(order.status)}`}>{order.status}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white" aria-label="Tutup detail">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 text-sm bg-[#111111] border border-white/10 rounded-xl p-4">
            <div>
              <p className="text-gray-500 text-xs mb-1">User</p>
              <p className="truncate">{order.user}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Target</p>
              <p className="truncate">{order.target || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Jumlah</p>
              <p>{formatAngka(order.jumlah)}</p>
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

          {order.status === 'Gagal' &&
            (order.refunded ? (
              <div className="flex items-center gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-sm rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Saldo sudah dikembalikan ke {order.user}.
              </div>
            ) : (
              <div className="flex flex-col gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  Pesanan ini gagal dan saldonya <span className="font-medium text-white">belum</span> dikembalikan ke
                  pengguna.
                </p>
                <button
                  onClick={() => onRefund(order.id)}
                  disabled={refunding}
                  className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#e6a600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-fit"
                >
                  {refunding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  {refunding ? 'Memproses refund...' : `Refund ${formatRupiah(order.harga)} ke Saldo User`}
                </button>
              </div>
            ))}
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
  const [page, setPage] = useState(1);

  // Satu state buat semua aksi yang lagi jalan per order, biar tombolnya
  // bisa dikunci. Dulu tombol refund gak pernah di-disable — dobel klik
  // bisa ngirim dua PATCH sekaligus.
  const [busy, setBusy] = useState({}); // { [orderId]: 'refund' | 'refill' | 'status' }
  const [toast, setToast] = useState(null); // { ok, message }

  const abortRef = useRef(null);
  const toastTimer = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
      clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((ok, message) => {
    clearTimeout(toastTimer.current);
    setToast({ ok, message });
    toastTimer.current = setTimeout(() => {
      if (aliveRef.current) setToast(null);
    }, 4000);
  }, []);

  const setBusyFor = useCallback((id, value) => {
    setBusy((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: value };
    });
  }, []);

  // ?sync=1 bikin server ngecek ulang status order Pending/Diproses ke
  // provider. Sengaja cuma dari sini — kartu Overview manggil endpoint
  // yang sama tanpa sync biar gak ikut nunggu.
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders?sync=1', { signal: ac.signal, cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat pesanan.');
      if (!aliveRef.current) return;
      setOrders((data.orders || []).map(mapOrderRow));
    } catch (err) {
      if (err.name === 'AbortError' || !aliveRef.current) return;
      setError(err.message);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchOrder(id, patch, action) {
    if (busy[id]) return null;
    setBusyFor(id, action);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memperbarui pesanan.');

      // Pakai baris hasil server, bukan cuma nempelin patch ke state lokal —
      // server bisa ngubah field lain (mis. refunded ikut berubah). Embed
      // `profiles` gak ikut di response PATCH, jadi `user` yang lama
      // dipertahankan.
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          if (!data.order) return { ...o, ...patch };
          return { ...mapOrderRow(data.order), user: o.user, haystack: o.haystack };
        })
      );
      return data.order || { id, ...patch };
    } catch (err) {
      // Dulu error cuma masuk console.error — admin gak dikasih tau
      // apa-apa dan dropdown status keliatan balik sendiri tanpa alasan.
      showToast(false, err.message);
      return null;
    } finally {
      if (aliveRef.current) setBusyFor(id, null);
    }
  }

  async function handleStatusChange(id, newStatus) {
    const ok = await patchOrder(id, { status: newStatus }, 'status');
    if (ok) showToast(true, `Status pesanan diubah jadi ${newStatus}.`);
  }

  async function handleRefund(id) {
    if (busy[id]) return;
    const ok = await patchOrder(id, { refunded: true }, 'refund');
    if (ok) showToast(true, 'Saldo berhasil dikembalikan ke pengguna.');
  }

  // Minta provider ngirim ulang pesanan yang drop. Butuh ID versi provider,
  // yang sekarang udah disimpan langsung di objeknya.
  async function handleRefill(order) {
    if (!order.providerOrderId) {
      showToast(false, 'Pesanan ini gak punya ID di provider.');
      return;
    }
    if (busy[order.id]) return;

    setBusyFor(order.id, 'refill');
    try {
      const res = await fetch('/api/smm/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerOrderId: order.providerOrderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal minta refill.');
      showToast(true, 'Refill berhasil diminta ke provider.');
    } catch (err) {
      showToast(false, err.message);
    } finally {
      if (aliveRef.current) setBusyFor(order.id, null);
    }
  }

  /* --- filter: query di-lowercase sekali, bukan 3x per baris per render;
         dengan ribuan order versi lama bikin ngetik di search nge-lag --- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) => (!q || o.haystack.includes(q)) && (statusFilter === 'semua' || o.status === statusFilter)
    );
  }, [orders, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-bold">Kelola Pesanan</h2>
      </div>

      <p className="text-sm text-gray-400 -mt-2">
        Pesanan asli dari semua pelanggan. Muat ulang juga nyinkronin status ke provider.
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
          disabled={loading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </button>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${toast.ok
            ? 'bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {loading && (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
          <p className="text-sm text-gray-400">Memuat pesanan &amp; sinkron status provider...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={load} className="text-sm px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            Coba lagi
          </button>
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
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => {
                  const action = busy[o.id];
                  return (
                    <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="font-medium">{o.layanan}</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-mono">{o.displayId}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{o.user}</td>
                      <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatAngka(o.jumlah)}</td>
                      <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{formatRupiah(o.harga)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={STATUS_OPTIONS.includes(o.status) ? o.status : ''}
                          disabled={!!action}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-[#FFB800] disabled:opacity-50 ${chipClass(
                            o.status
                          )}`}
                        >
                          {!STATUS_OPTIONS.includes(o.status) && (
                            <option value="" className="bg-[#191A19] text-white">
                              {o.status || '-'}
                            </option>
                          )}
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
                          <button
                            onClick={() => setSelectedOrderId(o.id)}
                            title="Lihat detail"
                            aria-label="Lihat detail"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRefill(o)}
                            disabled={!!action || !o.providerOrderId}
                            title={o.providerOrderId ? 'Minta refill ke provider' : 'Pesanan ini gak punya ID provider'}
                            aria-label="Minta refill ke provider"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {action === 'refill' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCw className="w-4 h-4" />
                            )}
                          </button>
                          {o.status === 'Gagal' && !o.refunded && (
                            <button
                              onClick={() => handleRefund(o.id)}
                              disabled={!!action}
                              title="Refund saldo ke user"
                              aria-label="Refund saldo ke user"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#FFB800] hover:bg-[#FFB800]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {action === 'refund' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {o.status === 'Gagal' && o.refunded && (
                            <span
                              title="Sudah direfund"
                              className="w-8 h-8 flex items-center justify-center text-gray-500"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {orders.length === 0 ? 'Belum ada pesanan dari pelanggan.' : 'Tidak ada pesanan yang cocok.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tanpa paginasi, ribuan baris dirender sekaligus dan tabelnya
              nge-freeze pas di-scroll atau difilter. */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 text-sm">
              <p className="text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari{' '}
                {formatAngka(filtered.length)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onRefund={handleRefund}
          refunding={busy[selectedOrder.id] === 'refund'}
        />
      )}
    </div>
  );
}