'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingCart, CheckCircle2, Loader2, Tag, Info, AlertTriangle, RefreshCw, Search, X, Clock, Star, ChevronDown } from 'lucide-react';
import { formatRupiah } from '../data/services';
import { fetchLiveCatalog } from '../data/liveCatalog';
import { loadDisabledServiceIds, filterDisabledFromCatalog } from '../data/serviceOverrides';
import { loadFavoriteServiceIds, toggleFavoriteServiceId } from '../data/serviceFavorites';
import { loadMarkupPersen, loadKursUsdIdr } from '../data/pricingSettings';

const LANGKAH = [
    'Pilih platform, lalu pilih salah satu Kategori.',
    'Pilih salah satu Layanan yang ingin dipesan.',
    'Masukkan Target pesanan sesuai ketentuan yang diberikan layanan tersebut.',
    'Masukkan Jumlah pesanan yang diinginkan.',
    'Klik Pesan untuk membuat pesanan baru.',
];

const KETENTUAN = [
    'Buat pesanan sesuai langkah-langkah di atas.',
    'Kalau ingin memesan dengan Target yang sama dengan pesanan sebelumnya, mohon tunggu sampai pesanan itu selesai diproses.',
    'Tidak ada garansi isi ulang/refund untuk layanan yang tidak berlabel Garansi, meski jumlahnya berkurang segera setelah status selesai.',
    'Tidak ada garansi isi ulang/refund untuk pesanan dengan status partial (selesai sebagian).',
    'Layanan berlabel Garansi akan diisi ulang otomatis kalau jumlahnya berkurang dalam periode garansi yang ditentukan.',
    'Kalau ada kendala atau pesanan gagal dengan keterangan yang kurang jelas, silakan hubungi dukungan untuk informasi lebih lanjut.',
    'Dengan membuat pesanan, kamu dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan yang berlaku.',
];

function calculatePrice(service, jumlah) {
    if (!service || !jumlah) return 0;
    return Math.ceil((jumlah / 1000) * service.pricePer1000);
}

function formatServiceLabel(s, isFavorite) {
    return `${isFavorite ? '★ ' : ''}${s.id} - ${s.name} | ${formatRupiah(s.pricePer1000)}/K`;
}

// Estimasi kasar waktu selesai = jumlah dipesan dibagi kapasitas kirim per
// hari layanan itu sendiri (diambil dari nama layanan, lihat
// parseDailyCapacity di data/liveCatalog.js). Ini estimasi, bukan janji
// pasti — kecepatan aktual provider bisa beda-beda.
function formatEstimasiWaktu(jumlah, dailyCapacity) {
    if (!dailyCapacity || !jumlah) return null;
    const totalJam = (jumlah / dailyCapacity) * 24;
    if (totalJam < 1) {
        const menit = Math.max(Math.round(totalJam * 60), 1);
        return `~${menit} menit`;
    }
    if (totalJam < 24) {
        return `~${Math.ceil(totalJam)} jam`;
    }
    const hari = Math.floor(totalJam / 24);
    const sisaJam = Math.ceil(totalJam % 24);
    return sisaJam > 0 ? `~${hari} hari ${sisaJam} jam` : `~${hari} hari`;
}

export default function OrderForm({ balance, onBalanceUpdated, onOrderSuccess }) {
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [platforms, setPlatforms] = useState([]);

    const [platformKey, setPlatformKey] = useState('');
    const [showPlatformPicker, setShowPlatformPicker] = useState(false);
    const [categoryId, setCategoryId] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);
    const [serviceId, setServiceId] = useState('');
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceDropdownRef = useRef(null);
    const [favoriteOnly, setFavoriteOnly] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState([]);

    // Tutup dropdown Kategori/Layanan kalau klik di luar area masing-masing.
    useEffect(() => {
        function handleClickOutside(e) {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
                setIsCategoryDropdownOpen(false);
            }
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
                setIsServiceDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setFavoriteIds(loadFavoriteServiceIds());
    }, []);
    const [target, setTarget] = useState('');
    const [jumlah, setJumlah] = useState('');
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    // Ambil daftar layanan live dari provider (SMMSOC) lewat API route kita
    // sendiri (bukan langsung dari browser, biar API key gak kebuka). Logic
    // fetch + kelompokkan + terjemahkan ada di data/liveCatalog.js, dipakai
    // bareng sama halaman Daftar Layanan.
    async function fetchServices() {
        setLoadingServices(true);
        setLoadError('');
        try {
            const kursUsdIdr = await loadKursUsdIdr();
            const markupPersen = await loadMarkupPersen();
            const rawGrouped = await fetchLiveCatalog(kursUsdIdr, markupPersen);
            const disabledIds = await loadDisabledServiceIds();
            const grouped = filterDisabledFromCatalog(rawGrouped, disabledIds);
            setPlatforms(grouped);
            if (grouped.length > 0) setPlatformKey(grouped[0].key);
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoadingServices(false);
        }
    }

    useEffect(() => {
        fetchServices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [searchQuery, setSearchQuery] = useState('');

    // Index datar semua layanan lintas platform, buat pencarian cepat pakai
    // ID atau nama layanan tanpa perlu pilih Platform/Kategori dulu.
    const flatServices = useMemo(() => {
        const list = [];
        for (const p of platforms) {
            for (const c of p.categories) {
                for (const s of c.services) {
                    list.push({ ...s, platformKey: p.key, platformLabel: p.label, categoryId: c.id, categoryLabel: c.label });
                }
            }
        }
        return list;
    }, [platforms]);

    const searchResults = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return flatServices
            .filter((s) => String(s.id).includes(q) || s.name.toLowerCase().includes(q))
            .slice(0, 30);
    }, [searchQuery, flatServices]);

    function handleToggleFavorite(id) {
        setFavoriteIds((prev) => toggleFavoriteServiceId(id, prev));
    }

    function handlePickSearchResult(result) {
        setPlatformKey(result.platformKey);
        setCategoryId(result.categoryId);
        setServiceId(String(result.id));
        setSearchQuery('');
        setError('');
    }

    const platform = useMemo(() => platforms.find((p) => p.key === platformKey) || null, [platforms, platformKey]);
    const category = useMemo(
        () => platform?.categories.find((c) => c.id === categoryId) || null,
        [platform, categoryId]
    );
    const visibleServices = useMemo(() => {
        const list = category?.services || [];
        return favoriteOnly ? list.filter((s) => favoriteIds.includes(String(s.id))) : list;
    }, [category, favoriteOnly, favoriteIds]);
    const service = useMemo(
        () => visibleServices.find((s) => String(s.id) === String(serviceId)) || null,
        [visibleServices, serviceId]
    );

    const jumlahNum = Number(jumlah) || 0;
    const price = calculatePrice(service, jumlahNum);
    const estimasiWaktu = service ? formatEstimasiWaktu(jumlahNum, service.dailyCapacity) : null;
    const isInstagramFollowers =
        platform?.label === 'Instagram' && service?.name.toLowerCase().includes('follower');
    // Layanan tipe "Custom Comments" (dan variannya) butuh teks komentar yang
    // beneran mau diposting -- provider gak bisa nebak sendiri kata-katanya.
    const isCustomComments = Boolean(service?.typeLabel?.toLowerCase().includes('comment'));
    const commentLineCount = useMemo(
        () => comments.split('\n').filter((line) => line.trim() !== '').length,
        [comments]
    );

    // Buat Custom Comments, Jumlah HARUS sama persis dengan banyaknya baris
    // komentar yang diisi (bukan angka manual) -- jadi kita samain otomatis
    // tiap kali teks komentarnya berubah, field Jumlah-nya dikunci read-only.
    useEffect(() => {
        if (isCustomComments) {
            setJumlah(commentLineCount > 0 ? String(commentLineCount) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCustomComments, commentLineCount]);

    // Kategori & Layanan di-reset manual di handler masing-masing (bukan lewat
    // useEffect yang ngikutin perubahan platformKey/categoryId), soalnya kalau
    // pakai useEffect, hasil klik dari kotak pencarian (yang set ketiganya
    // sekaligus) bakal langsung ke-reset lagi begitu platformKey berubah.

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!service) {
            setError('Pilih kategori dan layanan dulu.');
            return;
        }
        if (!target.trim()) {
            setError('Target (link/username) wajib diisi.');
            return;
        }
        if (jumlahNum < service.min || (service.max > 0 && jumlahNum > service.max)) {
            setError(
                `Jumlah harus antara ${service.min.toLocaleString('id-ID')} - ${service.max.toLocaleString('id-ID')}.`
            );
            return;
        }
        if (isCustomComments && !comments.trim()) {
            setError('Kata-kata komentar wajib diisi (satu komentar per baris).');
            return;
        }
        if (price > balance) {
            setError('Saldo kamu tidak cukup. Silakan top up dulu.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/smm/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: service.id,
                    link: target.trim(),
                    quantity: jumlahNum,
                    ...(isCustomComments ? { comments: comments.trim() } : {}),
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Pesanan gagal diproses provider.');
            }

            const order = {
                id: `ORD-${data.order}`,
                providerOrderId: data.order,
                layanan: service.name,
                platform: platform?.label || '-',
                target: target.trim(),
                jumlah: jumlahNum,
                harga: data.price ?? price, // harga asli dari server, fallback ke hitungan client
                timestamp: Date.now(),
            };
            onBalanceUpdated?.(data.newBalance);
            onOrderSuccess?.(order);
            setSuccess(order);
            setTarget('');
            setJumlah('');
            setComments('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center gap-4 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#B9FF66] flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-black" />
                </div>
                <h2 className="text-lg font-bold">Pesanan berhasil dibuat</h2>
                <div className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-left text-sm flex flex-col gap-2 mt-2">
                    <div className="flex justify-between text-gray-400">
                        <span>ID Pesanan</span>
                        <span className="text-white font-mono">{success.id}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Layanan</span>
                        <span className="text-white text-right">{success.layanan}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-400 min-w-0">
                        <span className="shrink-0">Target</span>
                        <span className="text-white truncate min-w-0">{success.target}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Jumlah</span>
                        <span className="text-white">{success.jumlah.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 pt-2 border-t border-white/10">
                        <span>Total dibayar</span>
                        <span className="text-[#B9FF66] font-bold">{formatRupiah(success.harga)}</span>
                    </div>
                </div>
                <button
                    onClick={() => setSuccess(null)}
                    className="bg-[#B9FF66] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#a0e655] transition-colors mt-2"
                >
                    Pesan Lagi
                </button>
            </div>
        );
    }

    if (loadingServices) {
        return (
            <div className="flex flex-col gap-6 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                            <div className="h-7 w-24 bg-white/10 rounded-full animate-pulse" />
                        </div>
                        <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                            <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
                            <div className="h-24 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-14 bg-white/10 rounded animate-pulse" />
                            <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                            <div className="h-10 w-full bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                        </div>
                        <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse" />
                    </div>

                    <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 h-fit flex flex-col gap-5">
                        <div className="h-5 w-28 bg-white/10 rounded animate-pulse" />
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-3 w-full bg-white/5 rounded animate-pulse" />
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-4 space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-3 w-full bg-white/5 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-4 text-center max-w-xl mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div>
                    <p className="font-bold mb-1">Gagal memuat layanan dari provider</p>
                    <p className="text-sm text-gray-400">{loadError}</p>
                    <p className="text-xs text-gray-500 mt-3">
                        Terjadi kendala saat mengambil daftar layanan. Silakan coba lagi beberapa saat, atau hubungi dukungan kalau masalah berlanjut.
                    </p>
                </div>
                <button
                    onClick={fetchServices}
                    className="flex items-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#a0e655] transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                </button>
            </div>
        );
    }

    if (!platform) {
        return (
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 text-center text-sm text-gray-500 max-w-xl mx-auto">
                Provider belum mengembalikan layanan apa pun.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl">
            {/* Grid platform — cuma muncul kalau tombol "Kategori" di header card
          diklik. Pakai inline style CSS grid (bukan class Tailwind) biar
          tetap berjajar 3 kolom meskipun ada isu Tailwind belum men-generate
          class grid-cols-* untuk file ini. */}
            {showPlatformPicker && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '0.5rem',
                    }}
                >
                    {platforms.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => {
                                setPlatformKey(p.key);
                                setCategoryId('');
                                setServiceId('');
                                setError('');
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${platformKey === p.key
                                ? 'bg-[#B9FF66] text-black border-[#B9FF66]'
                                : 'bg-[#191A19] text-gray-300 border-white/10 hover:border-white/30'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleSubmit} className="lg:col-span-2 min-w-0 bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-[#B9FF66]" />
                            <h2 className="text-lg font-bold">Buat Pesanan</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPlatformPicker((v) => !v)}
                            className="flex items-center gap-1.5 text-xs font-medium bg-[#B9FF66]/10 text-[#B9FF66] px-3 py-1.5 rounded-full hover:bg-[#B9FF66]/20 transition-colors"
                        >
                            <Tag className="w-3.5 h-3.5" /> {platform.label}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="relative">
                        <label className="text-sm text-gray-400 mb-2 block">Cari ID atau nama layanan</label>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Contoh: 3406, atau &quot;followers real&quot;..."
                                className="w-full bg-[#111111] border border-white/10 rounded-xl pl-11 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {searchQuery && (
                            <div className="absolute z-10 mt-2 w-full max-h-72 overflow-y-auto bg-[#111111] border border-white/10 rounded-xl shadow-xl">
                                {searchResults.length === 0 ? (
                                    <p className="px-4 py-4 text-sm text-gray-500">Gak ada layanan yang cocok.</p>
                                ) : (
                                    searchResults.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => handlePickSearchResult(r)}
                                            className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                        >
                                            <p className="text-sm">
                                                <span className="font-mono text-gray-500">{r.id}</span> — {r.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {r.platformLabel} · {formatRupiah(r.pricePer1000)}/K
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Kategori</label>
                        <div ref={categoryDropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCategoryDropdownOpen((v) => !v)}
                                className="w-full flex items-start justify-between gap-2 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#B9FF66]"
                            >
                                <span className="text-left">{category ? category.label : 'Pilih...'}</span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 mt-0.5 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCategoryDropdownOpen && (
                                <div className="absolute z-20 mt-1 w-full bg-[#191A19] border border-white/10 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                                    {platform.categories.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            title={c.label}
                                            onClick={() => {
                                                setCategoryId(c.id);
                                                setServiceId('');
                                                setIsServiceDropdownOpen(false);
                                                setIsCategoryDropdownOpen(false);
                                                setError('');
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm leading-snug transition-colors ${c.id === categoryId
                                                ? 'bg-[#B9FF66]/10 text-[#B9FF66]'
                                                : 'text-gray-300 hover:bg-white/5'
                                                }`}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Layanan</label>
                        <div className="flex items-center gap-2 min-w-0">
                            <div ref={serviceDropdownRef} className="relative flex-1 min-w-0">
                                <button
                                    type="button"
                                    disabled={!category}
                                    onClick={() => setIsServiceDropdownOpen((v) => !v)}
                                    className="w-full flex items-start justify-between gap-2 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#B9FF66] disabled:opacity-50"
                                >
                                    <span className="text-left">
                                        {service ? formatServiceLabel(service, favoriteIds.includes(String(service.id))) : 'Pilih...'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 mt-0.5 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isServiceDropdownOpen && (
                                    <div className="absolute z-20 mt-1 w-full bg-[#191A19] border border-white/10 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                                        {visibleServices.length === 0 && (
                                            <p className="px-4 py-3 text-sm text-gray-500">Gak ada layanan.</p>
                                        )}
                                        {visibleServices.map((s) => {
                                            const isFav = favoriteIds.includes(String(s.id));
                                            const label = formatServiceLabel(s, isFav);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    title={label}
                                                    onClick={() => {
                                                        setServiceId(String(s.id));
                                                        setError('');
                                                        setIsServiceDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm leading-snug transition-colors ${String(s.id) === String(serviceId)
                                                        ? 'bg-[#B9FF66]/10 text-[#B9FF66]'
                                                        : 'text-gray-300 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {service && (
                                <button
                                    type="button"
                                    onClick={() => handleToggleFavorite(service.id)}
                                    title={favoriteIds.includes(String(service.id)) ? 'Hapus dari favorit' : 'Tandai favorit'}
                                    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${favoriteIds.includes(String(service.id))
                                        ? 'bg-[#B9FF66]/10 border-[#B9FF66]/40 text-[#B9FF66]'
                                        : 'bg-[#111111] border-white/10 text-gray-500 hover:text-white'
                                        }`}
                                >
                                    <Star className="w-4 h-4" fill={favoriteIds.includes(String(service.id)) ? 'currentColor' : 'none'} />
                                </button>
                            )}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={favoriteOnly}
                            onChange={(e) => setFavoriteOnly(e.target.checked)}
                            className="accent-[#B9FF66] w-4 h-4"
                        />
                        Tampilkan layanan favorit saja
                    </label>

                    {service ? (
                        <div className="border border-[#B9FF66]/40 bg-[#B9FF66]/5 rounded-xl p-4 flex flex-col gap-3 text-sm">
                            <div>
                                <p className="font-bold">{service.name}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                        <Tag className="w-3 h-3" /> Maks: {service.max.toLocaleString('id-ID')}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                        <Tag className="w-3 h-3" /> {service.refill ? 'Garansi Refill' : 'Tanpa Refill'}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                        <Tag className="w-3 h-3" /> {service.cancel ? 'Bisa Dibatalkan' : 'Tidak Bisa Dibatalkan'}
                                    </span>
                                    {service.dailyCapacity && (
                                        <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                            <Tag className="w-3 h-3" /> {service.dailyCapacity.toLocaleString('id-ID')}/Hari
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p>
                                <span className="font-bold">Harga: </span>
                                <span className="text-[#B9FF66] font-bold">{formatRupiah(service.pricePer1000)}/K</span>
                            </p>

                            {isInstagramFollowers && (
                                <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-3 flex flex-col gap-2">
                                    <p className="font-bold text-red-400">🚨 PENTING 🚨</p>
                                    <p className="text-gray-300">Harap matikan "Laporkan untuk ditinjau" sebelum memesan!</p>
                                    <div>
                                        <p className="text-gray-400 text-xs mb-1">Caranya:</p>
                                        <ol className="text-gray-400 text-xs list-decimal list-inside flex flex-col gap-0.5">
                                            <li>Masuk ke Pengaturan dan Privasi</li>
                                            <li>Ikuti & Undang Teman</li>
                                            <li>Nonaktifkan "Laporkan untuk ditinjau"</li>
                                        </ol>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-3">
                                <p className="font-bold mb-1.5">Deskripsi</p>
                                <div className="flex flex-col gap-1 text-gray-300">
                                    <p>
                                        <span className="text-gray-500">Target: </span>
                                        {service.targetHint}
                                    </p>
                                    <p>
                                        <span className="text-gray-500">Garansi: </span>
                                        {service.refill ? 'Ada (refill otomatis kalau drop)' : 'Tidak ada'}
                                    </p>
                                    {service.typeLabel && (
                                        <p>
                                            <span className="text-gray-500">Tipe: </span>
                                            {service.typeLabel}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-3">
                                <p className="font-bold mb-1.5">Catatan</p>
                                <ul className="text-gray-400 text-xs flex flex-col gap-1 list-disc list-inside">
                                    <li>Saat server sibuk, kecepatan proses bisa berubah.</li>
                                    <li>Jangan melakukan pemesanan kedua pada target yang sama sebelum pesanan sebelumnya selesai di sistem.</li>
                                    <li>Kalau ada kendala dengan layanan ini, silakan hubungi lewat menu Tiket.</li>
                                </ul>
                            </div>

                            <div className="border-t border-white/10 pt-3 flex items-start gap-2">
                                <Clock className="w-4 h-4 text-[#B9FF66] shrink-0 mt-0.5" />
                                <p>
                                    <span className="font-bold">Waktu Rata-Rata (estimasi): </span>
                                    <span className="text-gray-300">
                                        {estimasiWaktu
                                            ? `${estimasiWaktu} untuk jumlah yang diisi sekarang`
                                            : 'Belum tersedia untuk layanan ini'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 min-h-[52px]">
                            Pilih layanan buat lihat detail & estimasi.
                        </div>
                    )}

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">{service?.targetHint || 'Link/Target'}</label>
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={service?.targetHint || 'Link/Target'}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                        />
                    </div>

                    {isCustomComments && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label className="text-sm text-gray-400">Kata-Kata Komentar</label>
                                <span className="text-[10px] font-medium bg-[#B9FF66]/10 text-[#B9FF66] px-2 py-0.5 rounded-full">
                                    Satu komentar per baris
                                </span>
                            </div>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={'Mantap!\nKeren banget 🔥\nSuka deh sama ini'}
                                rows={4}
                                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66] resize-y"
                            />
                            <p className="text-xs text-gray-500 mt-1.5">
                                Jumlah pesanan di bawah otomatis mengikuti banyaknya baris komentar di sini.
                            </p>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm text-gray-400">Jumlah</label>
                            <span className="text-[10px] font-medium bg-[#B9FF66]/10 text-[#B9FF66] px-2 py-0.5 rounded-full">
                                Min: {(service?.min ?? 0).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] font-medium bg-[#B9FF66]/10 text-[#B9FF66] px-2 py-0.5 rounded-full">
                                Maks: {(service?.max ?? 0).toLocaleString('id-ID')}
                            </span>
                            {isCustomComments && (
                                <span className="text-[10px] font-medium bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                                    Otomatis dari jumlah komentar
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            value={jumlah}
                            onChange={(e) => setJumlah(e.target.value)}
                            placeholder="Contoh: 1000"
                            readOnly={isCustomComments}
                            className={`w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66] ${isCustomComments ? 'text-gray-400 cursor-not-allowed' : ''
                                }`}
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Biaya</label>
                        <div className="flex items-center gap-2 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm">
                            <span className="text-gray-500">Rp</span>
                            <span className="font-bold text-[#B9FF66]">{price.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors disabled:opacity-60"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Memproses...' : 'Pesan'}
                    </button>
                </form>

                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 h-fit flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-[#B9FF66]" />
                        <h3 className="text-sm font-bold">Informasi</h3>
                    </div>

                    <div>
                        <p className="text-sm font-bold mb-2">Langkah-langkah membuat pesanan baru:</p>
                        <ul className="text-xs text-gray-400 flex flex-col gap-1.5 list-disc list-inside">
                            {LANGKAH.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <p className="text-sm font-bold mb-2">Ketentuan membuat pesanan baru:</p>
                        <ul className="text-xs text-gray-400 flex flex-col gap-1.5 list-disc list-inside">
                            {KETENTUAN.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="border-t border-white/10 pt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-400">Saldo kamu</span>
                        <span className="font-bold text-[#B9FF66]">{formatRupiah(balance)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}