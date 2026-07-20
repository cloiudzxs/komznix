'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { List, Search, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { formatRupiah } from '../data/services';
import { fetchLiveCatalog } from '../data/liveCatalog';
import { loadDisabledServiceIds, filterDisabledFromCatalog } from '../data/serviceOverrides';
import { loadMarkupPersen, loadKursUsdIdr } from '../data/pricingSettings';

const ITEMS_PER_PAGE = 25;

export default function DaftarLayananSection({ initialQuery = '' }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [platforms, setPlatforms] = useState([]);
    const [platformKey, setPlatformKey] = useState('semua');
    const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
    const platformDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (platformDropdownRef.current && !platformDropdownRef.current.contains(e.target)) {
                setIsPlatformDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const [query, setQuery] = useState(initialQuery);
    const [page, setPage] = useState(1);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const kursUsdIdr = await loadKursUsdIdr();
            const markupPersen = await loadMarkupPersen();
            const rawGrouped = await fetchLiveCatalog(kursUsdIdr, markupPersen);
            const grouped = filterDisabledFromCatalog(rawGrouped, loadDisabledServiceIds());
            setPlatforms(grouped);
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
        const selected = platformKey === 'semua' ? platforms : platforms.filter((p) => p.key === platformKey);
        const list = [];
        selected.forEach((platform) => {
            platform.categories.forEach((category) => {
                category.services.forEach((service) => {
                    list.push({ platform: platform.label, category: category.label, ...service });
                });
            });
        });
        if (!query.trim()) return list;
        const q = query.trim().toLowerCase();
        return list.filter((s) => s.name.toLowerCase().includes(q) || String(s.id).includes(q));
    }, [platforms, platformKey, query]);

    // Reset ke halaman 1 tiap kali filter/pencarian berubah, biar gak
    // nyangkut di halaman yang udah kosong.
    useEffect(() => {
        setPage(1);
    }, [platformKey, query]);

    const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return rows.slice(start, start + ITEMS_PER_PAGE);
    }, [rows, currentPage]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-[#B9FF66]" />
                <h2 className="text-lg font-bold">Daftar Layanan</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari layanan atau ID..."
                        className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                    />
                </div>
                <div ref={platformDropdownRef} className="relative w-full sm:w-56 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsPlatformDropdownOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 bg-[#191A19] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#B9FF66]"
                    >
                        <span className="truncate">
                            {platformKey === 'semua' ? 'Semua Platform' : platforms.find((p) => p.key === platformKey)?.label || 'Semua Platform'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPlatformDropdownOpen && (
                        <div className="absolute right-0 z-20 mt-1 w-full bg-[#191A19] border border-white/10 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                            <button
                                type="button"
                                onClick={() => {
                                    setPlatformKey('semua');
                                    setIsPlatformDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm truncate transition-colors ${platformKey === 'semua' ? 'bg-[#B9FF66]/10 text-[#B9FF66]' : 'text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                Semua Platform
                            </button>
                            {platforms.map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => {
                                        setPlatformKey(p.key);
                                        setIsPlatformDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm truncate transition-colors ${p.key === platformKey ? 'bg-[#B9FF66]/10 text-[#B9FF66]' : 'text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-3 border-b border-white/10">
                        <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="divide-y divide-white/5">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="px-6 py-4 flex items-center gap-4 sm:gap-6">
                                <div className="h-3 w-10 bg-white/10 rounded animate-pulse shrink-0" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-3.5 w-2/3 max-w-xs bg-white/10 rounded animate-pulse" />
                                    <div className="h-2.5 w-16 bg-white/10 rounded animate-pulse" />
                                </div>
                                <div className="h-3 w-20 bg-white/10 rounded animate-pulse hidden md:block shrink-0" />
                                <div className="h-3 w-24 bg-white/10 rounded animate-pulse hidden sm:block shrink-0" />
                                <div className="h-3 w-16 bg-white/10 rounded animate-pulse shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-gray-400">{error}</p>
                    <button
                        onClick={load}
                        className="flex items-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#a0e655] transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Coba Lagi
                    </button>
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
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Kategori</th>
                                    <th className="px-6 py-3 font-medium">Min/Maks</th>
                                    <th className="px-6 py-3 font-medium">Harga</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedRows.map((s) => (
                                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 font-mono text-gray-400 whitespace-nowrap">{s.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{s.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{s.platform}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{s.category}</td>
                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                            {s.min.toLocaleString('id-ID')} / {s.max.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[#B9FF66] font-bold">{formatRupiah(s.pricePer1000)}</span>
                                            <span className="text-gray-500">/K</span>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                            Tidak ada layanan yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {rows.length > 0 && (
                        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 flex-wrap">
                            <p className="text-xs text-gray-500">
                                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                                {Math.min(currentPage * ITEMS_PER_PAGE, rows.length)} dari {rows.length} layanan
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:border-[#B9FF66] hover:enabled:text-[#B9FF66] transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-gray-400 px-2">
                                    Hal {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:border-[#B9FF66] hover:enabled:text-[#B9FF66] transition-colors"
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