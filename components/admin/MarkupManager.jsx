'use client';

import { useEffect, useMemo, useState } from 'react';
import { Percent, Save, Search, DollarSign, Calculator, Loader2, CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../../data/services';
import { fetchLiveCatalog } from '../../data/liveCatalog';

const ITEMS_PER_PAGE = 25;

export default function MarkupManager() {
    const [loading, setLoading] = useState(true);
    const [markupPersen, setMarkupPersen] = useState(20);
    const [kursUsdIdr, setKursUsdIdr] = useState(15800);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [kursSaved, setKursSaved] = useState(false);
    const [kursSaveError, setKursSaveError] = useState('');
    const [query, setQuery] = useState('');
    const [usdInput, setUsdInput] = useState('');
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');

    // Ambil katalog LIVE dari provider, tapi minta harga TANPA markup
    // (markupPersen dikirim 0) — biar r.pricePer1000 di sini murni Harga
    // Dasar. Harga Jual dihitung ulang di JSX pakai markupPersen state saat
    // ini, biar preview-nya ikut berubah live pas admin ngetik di form atas,
    // tanpa perlu fetch ulang tiap keystroke.
    async function loadCatalog(kurs) {
        setCatalogLoading(true);
        setCatalogError('');
        try {
            const grouped = await fetchLiveCatalog(kurs, 0);
            const flat = [];
            grouped.forEach((platform) => {
                platform.categories.forEach((category) => {
                    category.services.forEach((service) => {
                        flat.push({ ...service, platform: platform.label });
                    });
                });
            });
            setRows(flat);
        } catch (err) {
            setCatalogError(err.message);
        } finally {
            setCatalogLoading(false);
        }
    }

    // Markup & kurs sekarang tersimpan di tabel `settings` (database), dibaca
    // lewat /api/admin/settings (pakai Secret key) — bukan localStorage lagi,
    // jadi begitu diubah di sini, SEMUA pelanggan langsung kepakai nilai baru.
    async function load() {
        setLoading(true);
        let kurs = kursUsdIdr;
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok && data.settings) {
                if (data.settings.markup_persen !== undefined) setMarkupPersen(Number(data.settings.markup_persen));
                if (data.settings.kurs_usd_idr !== undefined) {
                    kurs = Number(data.settings.kurs_usd_idr);
                    setKursUsdIdr(kurs);
                }
            }
        } catch {
            // Biarin default kalau gagal.
        } finally {
            setLoading(false);
        }
        loadCatalog(kurs);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function saveSetting(key, value) {
        const res = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
        });
        if (res.ok) return { ok: true };
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error || 'Gagal menyimpan.' };
    }

    async function handleSaveMarkup(e) {
        e.preventDefault();
        setSaveError('');
        const result = await saveSetting('markup_persen', markupPersen);
        if (result.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } else {
            setSaveError(result.error);
            setTimeout(() => setSaveError(''), 4000);
        }
    }

    async function handleSaveKurs(e) {
        e.preventDefault();
        setKursSaveError('');
        const result = await saveSetting('kurs_usd_idr', kursUsdIdr);
        if (result.ok) {
            setKursSaved(true);
            setTimeout(() => setKursSaved(false), 2500);
        } else {
            setKursSaveError(result.error);
            setTimeout(() => setKursSaveError(''), 4000);
        }
    }

    const usdNum = Number(usdInput) || 0;
    const hargaDasarIdr = usdNum * kursUsdIdr;
    const hargaJualIdr = hargaDasarIdr * (1 + markupPersen / 100);

    const filtered = rows.filter(
        (r) => !query.trim() || r.name.toLowerCase().includes(query.toLowerCase()) || String(r.id).includes(query)
    );

    useEffect(() => {
        setPage(1);
    }, [query]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    if (loading) {
        return (
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
                <p className="text-sm text-gray-400">Memuat pengaturan...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Kelola Markup</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Markup ini persentase tambahan di atas harga dasar dari provider (mis. SMMSOC), yang jadi harga jual ke
                pelanggan. Sekarang tersimpan di database — begitu disimpan, langsung kepakai buat SEMUA pelanggan,
                bukan cuma browser ini.
            </p>

            <form onSubmit={handleSaveMarkup} className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold">Markup Global</h3>
                <div className="flex items-center gap-3">
                    <div className="relative w-32">
                        <input
                            type="number"
                            min="0"
                            max="500"
                            value={markupPersen}
                            onChange={(e) => setMarkupPersen(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <button
                        type="submit"
                        className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors ${saved ? 'bg-[#B9FF66] text-black' : 'bg-[#FFB800] text-black hover:bg-[#e6a600]'
                            }`}
                    >
                        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Tersimpan!' : 'Simpan'}
                    </button>
                    {saveError && (
                        <span className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {saveError}
                        </span>
                    )}
                </div>
            </form>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#FFB800]" />
                    <h3 className="text-sm font-bold">Kurs USD → IDR</h3>
                </div>
                <p className="text-sm text-gray-400 -mt-2">
                    Dipakai buat konversi harga dari API provider SMM yang satuannya USD, sebelum kena markup di atas jadi
                    harga jual dalam Rupiah.
                </p>

                <form onSubmit={handleSaveKurs} className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-40">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={kursUsdIdr}
                            onChange={(e) => setKursUsdIdr(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                        />
                    </div>
                    <span className="text-sm text-gray-500">per $1</span>
                    <button
                        type="submit"
                        className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors ${kursSaved ? 'bg-[#B9FF66] text-black' : 'bg-[#FFB800] text-black hover:bg-[#e6a600]'
                            }`}
                    >
                        {kursSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {kursSaved ? 'Tersimpan!' : 'Simpan'}
                    </button>
                    {kursSaveError && (
                        <span className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {kursSaveError}
                        </span>
                    )}
                </form>

                <div className="border-t border-white/10 pt-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-[#FFB800]" />
                        <h4 className="text-sm font-bold">Kalkulator Konversi Cepat</h4>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Harga dari provider (USD per 1000)</label>
                        <div className="relative w-48">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={usdInput}
                                onChange={(e) => setUsdInput(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                placeholder="0.00"
                                className="w-full bg-[#111111] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-[#111111] border border-white/10 rounded-xl p-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Harga Dasar (IDR)</p>
                            <p className="font-medium">{formatRupiah(hargaDasarIdr)}/K</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Harga Jual (+{markupPersen}%)</p>
                            <p className="font-bold text-[#FFB800]">{formatRupiah(hargaJualIdr)}/K</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
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
                    onClick={() => loadCatalog(kursUsdIdr)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
                >
                    <RefreshCw className="w-4 h-4" />
                    Muat Ulang
                </button>
            </div>

            {catalogLoading && (
                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
                    <p className="text-sm text-gray-400">Mengambil katalog dari provider...</p>
                </div>
            )}

            {!catalogLoading && catalogError && (
                <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-400">{catalogError}</p>
                </div>
            )}

            {!catalogLoading && !catalogError && (
                <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-left border-b border-white/10">
                                    <th className="px-6 py-3 font-medium">Layanan</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Platform</th>
                                    <th className="px-6 py-3 font-medium">Harga Dasar</th>
                                    <th className="px-6 py-3 font-medium">Harga Jual (+{markupPersen}%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedRows.map((r) => (
                                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{r.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5 font-mono">{r.id}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{r.platform}</td>
                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{formatRupiah(r.pricePer1000)}/K</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[#FFB800] font-bold">
                                                {formatRupiah(r.pricePer1000 * (1 + markupPersen / 100))}
                                            </span>
                                            <span className="text-gray-500">/K</span>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
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