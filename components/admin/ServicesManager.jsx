'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings2, Search, Loader2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../../data/services';
import { fetchLiveCatalog } from '../../data/liveCatalog';
import { loadDisabledServiceIds, toggleDisabledServiceId } from '../../data/serviceOverrides';

const ITEMS_PER_PAGE = 25;

export default function ServicesManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [disabledIds, setDisabledIds] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const settingsRes = await fetch('/api/admin/settings');
      const settingsData = await settingsRes.json();
      const kursUsdIdr = Number(settingsData?.settings?.kurs_usd_idr) || 15800;
      const markupPersen = Number(settingsData?.settings?.markup_persen) || 20;
      const grouped = await fetchLiveCatalog(kursUsdIdr, markupPersen);
      setPlatforms(grouped);
      setDisabledIds(loadDisabledServiceIds());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const list = [];
    platforms.forEach((platform) => {
      platform.categories.forEach((category) => {
        category.services.forEach((service) => {
          list.push({ ...service, platform: platform.label, category: category.label });
        });
      });
    });
    return list;
  }, [platforms]);

  function handleToggleAktif(id) {
    setDisabledIds((prev) => toggleDisabledServiceId(id, prev));
  }

  const filtered = rows.filter(
    (r) => !query.trim() || r.name.toLowerCase().includes(query.toLowerCase()) || String(r.id).includes(query)
  );

  // Reset ke halaman 1 tiap kali pencarian berubah, biar gak nyangkut di
  // halaman yang udah kosong.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-[#FFB800]" />
        <h2 className="text-lg font-bold">Kelola Layanan</h2>
      </div>

      <p className="text-sm text-gray-400 -mt-2">
        Katalog ini live dari SMMSOC. Nonaktifkan layanan di sini kalau providernya sedang bermasalah, biar
        gak muncul di halaman Pesan Layanan & Daftar Layanan pelanggan. Status nonaktif ini masih lewat
        localStorage (baru nyambung kalau admin & pelanggan buka di browser yang sama) — begitu backend ada,
        ganti jadi kolom di database.
      </p>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari layanan atau ID..."
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
          <p className="text-sm text-gray-400">Mengambil katalog dari provider...</p>
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
                  <th className="px-6 py-3 font-medium">Layanan</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Platform</th>
                  <th className="px-6 py-3 font-medium">Harga</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => {
                  const isDisabled = disabledIds.includes(String(r.id));
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono text-gray-400 whitespace-nowrap">{r.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{r.category}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{r.platform}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#FFB800] font-bold">{formatRupiah(r.pricePer1000)}</span>
                        <span className="text-gray-500">/K</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAktif(r.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${!isDisabled
                            ? 'bg-[#FFB800]/10 text-[#FFB800] hover:bg-[#FFB800]/20'
                            : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                            }`}
                        >
                          {!isDisabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      Tidak ada layanan yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 flex-wrap">
              <p className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} layanan
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:border-[#FFB800] hover:enabled:text-[#FFB800] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 px-2">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:border-[#FFB800] hover:enabled:text-[#FFB800] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}