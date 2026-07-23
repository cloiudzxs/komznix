'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, Loader2, AlertTriangle } from 'lucide-react';

const statusBarColor = {
    Pending: 'bg-gray-500',
    Diproses: 'bg-blue-500',
    Selesai: 'bg-[#FFB800]',
    Gagal: 'bg-red-500',
};

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatRupiah(value) {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

// Baris breakdown pakai bar horizontal -- label kiri, bar tengah (lebar
// proporsional ke nilai max), angka kanan.
function BreakdownRow({ label, count, total, barColor, extra }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-gray-400">
                    {count} pesanan{extra ? ` · ${extra}` : ''} <span className="text-gray-600">({pct}%)</span>
                </span>
            </div>
            <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// Kelompokkan orders & deposits ke tren per hari, dari tanggal start s/d end
// (inklusif). Dibatasi maksimal 400 titik biar gak infinite-loop kalau
// rentang tanggalnya kebablasan (mis. bug di custom date picker).
function buildDailyTrendRange(orders, deposits, komisiLog, start, end) {
    const points = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    let guard = 0;
    while (cursor.getTime() <= endDay.getTime() && guard < 400) {
        const dayStart = new Date(cursor);
        const dayEnd = new Date(cursor);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // Pesanan Gagal sengaja DIKELUARIN dari garis Revenue & Order -- gak
        // representatif sebagai pendapatan/aktivitas beneran (biasanya
        // direfund). Breakdown & Top Layanan di bawah tetep hitung SEMUA
        // (termasuk Gagal), cuma garis tren ini aja yang disaring.
        const ordersInDay = orders.filter((o) => {
            const t = new Date(o.created_at).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime() && o.status !== 'Gagal';
        });
        const depositsInDay = deposits.filter((d) => {
            const t = new Date(d.created_at).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime() && d.status === 'Berhasil';
        });

        const komisiInDay = komisiLog.filter((k) => {
            const t = new Date(k.created_at).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime() && k.tipe === 'earned';
        });

        points.push({
            label: `${dayStart.getDate()} ${BULAN_SINGKAT[dayStart.getMonth()]}`,
            revenue: ordersInDay.reduce((sum, o) => sum + Number(o.harga || 0), 0),
            order: ordersInDay.length,
            deposit: depositsInDay.reduce((sum, d) => sum + Number(d.nominal || 0), 0),
            komisi: komisiInDay.reduce((sum, k) => sum + Number(k.jumlah || 0), 0),
        });

        cursor.setDate(cursor.getDate() + 1);
        guard++;
    }
    return points;
}

const RANGE_PRESETS = [
    { key: '7d', label: '7 Hari' },
    { key: '30d', label: '30 Hari' },
    { key: 'bulan_ini', label: 'Bulan Ini' },
    { key: 'bulan_lalu', label: 'Bulan Lalu' },
    { key: 'all_time', label: 'Sepanjang Waktu' },
    { key: 'custom', label: 'Custom' },
];

// Hitung tanggal start/end berdasarkan preset yang dipilih. all_time dimulai
// dari data PALING LAMA yang ada (order atau deposit), biar gak nampilin
// bertahun-tahun titik kosong kalau datanya baru sedikit.
function getRangeDates(preset, customStart, customEnd, orders, deposits) {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    if (preset === '7d') {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end: todayEnd };
    }
    if (preset === '30d') {
        const start = new Date(now);
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        return { start, end: todayEnd };
    }
    if (preset === 'bulan_ini') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start, end: todayEnd };
    }
    if (preset === 'bulan_lalu') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }
    if (preset === 'all_time') {
        const allTimes = [...orders, ...deposits].map((r) => new Date(r.created_at).getTime()).filter((t) => !isNaN(t));
        const start = allTimes.length ? new Date(Math.min(...allTimes)) : new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return { start, end: todayEnd };
    }
    if (preset === 'custom') {
        const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = customEnd ? new Date(`${customEnd}T23:59:59`) : todayEnd;
        return { start, end };
    }
    return { start: todayEnd, end: todayEnd };
}

// Biar sumbu-X gak penuh sesak, cuma sebagian label yang ditampilkan
// tergantung berapa banyak titik datanya.
function pickLabelIndexes(length) {
    if (length <= 8) return new Set(Array.from({ length }, (_, i) => i));
    const step = Math.ceil(length / 7);
    const indexes = new Set();
    for (let i = 0; i < length; i += step) indexes.add(i);
    indexes.add(length - 1);
    return indexes;
}

// Konversi titik ke path SVG melengkung (Catmull-Rom -> Bezier).
function buildSmoothPath(points) {
    if (points.length < 2) return points.length === 1 ? `M ${points[0][0]},${points[0][1]}` : '';
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
}

// Definisi 4 seri chart -- Deposit, Revenue, Order, Komisi. Tiap seri
// diskalakan ke rentang-nya SENDIRI (bukan satu sumbu-Y bareng), biar
// rupiah vs jumlah pesanan tetap sama-sama kebaca di grafik yang sama.
const SERIES_CONFIG = [
    { key: 'deposit', label: 'Deposit', color: '#4EA8FF', format: formatRupiah, fill: false },
    { key: 'revenue', label: 'Revenue', color: '#FFB800', format: formatRupiah, fill: true },
    { key: 'order', label: 'Order', color: '#34D399', format: (v) => `${v} pesanan`, fill: false },
    { key: 'komisi', label: 'Komisi', color: '#C084FC', format: formatRupiah, fill: false },
];

function MultiTrendChart({ data }) {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 900, height: 300 });
    const [hoverIndex, setHoverIndex] = useState(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { width, height } = size;
    const padding = { top: 20, right: 20, bottom: 32, left: 16 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const bandW = data.length > 1 ? chartW / (data.length - 1) : chartW;
    const xFor = (i) => padding.left + bandW * i;
    const baseY = padding.top + chartH;

    const seriesScaled = SERIES_CONFIG.map((s) => {
        const values = data.map((d) => d[s.key]);
        const max = Math.max(...values, 1) * 1.15;
        // Seri yang nilainya sama persis di semua titik (mis. Komisi -- cuma
        // snapshot saldo sekarang, bukan tren harian beneran) gak masuk akal
        // diskalakan relatif ke max-nya sendiri: value/max selalu ~0.87 berapa
        // pun angkanya, jadi garisnya selalu "nangkring" deket atas. Taruh aja
        // sebagai garis referensi tipis deket dasar chart.
        const isFlat = values.every((v) => v === values[0]);
        const points = data.map((d, i) => {
            const y = isFlat ? baseY - 6 : padding.top + chartH - (d[s.key] / max) * chartH;
            return [xFor(i), y];
        });
        const path = buildSmoothPath(points);
        const areaPath = s.fill && points.length > 0 ? `${path} L ${points[points.length - 1][0]},${baseY} L ${points[0][0]},${baseY} Z` : '';
        return { ...s, points, path, areaPath };
    });

    const gridFractions = [0, 0.5, 1];
    const labelIndexes = pickLabelIndexes(data.length);

    function handlePointerMove(e) {
        if (!containerRef.current || data.length === 0 || bandW === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const relX = clientX - rect.left;
        const svgX = (relX / rect.width) * width;
        const idx = Math.round((svgX - padding.left) / bandW);
        setHoverIndex(Math.min(Math.max(idx, 0), data.length - 1));
    }

    const active = hoverIndex !== null ? data[hoverIndex] : null;
    const activeX = hoverIndex !== null ? xFor(hoverIndex) : null;
    const tooltipLeftPct = width > 0 && activeX !== null ? (activeX / width) * 100 : 0;
    const tooltipAlign = tooltipLeftPct < 15 ? 'left' : tooltipLeftPct > 85 ? 'right' : 'center';

    return (
        <div
            ref={containerRef}
            className="w-full h-80 sm:h-96 lg:h-[28rem] relative"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => setHoverIndex(null)}
            onTouchMove={handlePointerMove}
            onTouchEnd={() => setHoverIndex(null)}
            onClick={handlePointerMove}
        >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block">
                <defs>
                    <linearGradient id="statistikRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#FFB800" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {gridFractions.map((f) => {
                    const y = padding.top + chartH * (1 - f);
                    return <line key={f} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" />;
                })}

                {seriesScaled.map((s) => s.fill && <path key={`${s.key}-area`} d={s.areaPath} fill="url(#statistikRevenueGrad)" />)}

                {seriesScaled.map((s) => (
                    <path key={s.key} d={s.path} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                ))}

                {activeX !== null && (
                    <line
                        x1={activeX}
                        x2={activeX}
                        y1={padding.top}
                        y2={baseY}
                        stroke="#ffffff"
                        strokeOpacity="0.15"
                        strokeDasharray="4 4"
                        className="transition-[x1,x2] duration-150 ease-out"
                    />
                )}

                {hoverIndex !== null &&
                    seriesScaled.map((s) => (
                        <circle
                            key={`${s.key}-dot`}
                            cx={s.points[hoverIndex][0]}
                            cy={s.points[hoverIndex][1]}
                            r="4.5"
                            fill={s.color}
                            stroke="#111111"
                            strokeWidth="2"
                            className="transition-[cx,cy] duration-150 ease-out"
                        />
                    ))}

                {data.map((d, i) =>
                    labelIndexes.has(i) ? (
                        <text key={d.label + i} x={xFor(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#8a8a8a">
                            {d.label}
                        </text>
                    ) : null
                )}
            </svg>

            {active && activeX !== null && (
                <div
                    className="absolute top-2 bg-[#0d0d0d] border border-white/10 rounded-xl px-3 py-2 text-xs pointer-events-none shadow-xl transition-all duration-150 ease-out"
                    style={{
                        left: tooltipAlign === 'center' ? `${tooltipLeftPct}%` : tooltipAlign === 'left' ? '0%' : undefined,
                        right: tooltipAlign === 'right' ? '0%' : undefined,
                        transform: tooltipAlign === 'center' ? 'translateX(-50%)' : undefined,
                    }}
                >
                    <p className="text-gray-400 mb-1.5">{active.label}</p>
                    <div className="flex flex-col gap-1">
                        {SERIES_CONFIG.map((s) => (
                            <div key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-gray-300">{s.label}:</span>
                                <span className="font-medium">{s.format(active[s.key])}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function StatistikManager() {
    const [orders, setOrders] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [komisiLog, setKomisiLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rangePreset, setRangePreset] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/orders').then((res) => res.json()),
            fetch('/api/admin/deposits').then((res) => res.json()),
            fetch('/api/admin/referrals').then((res) => res.json()),
            fetch('/api/admin/komisi-log').then((res) => res.json()),
        ])
            .then(([ordersData, depositsData, referralsData, komisiLogData]) => {
                if (ordersData.error) throw new Error(ordersData.error);
                if (depositsData.error) throw new Error(depositsData.error);
                if (referralsData.error) throw new Error(referralsData.error);
                setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
                setDeposits(Array.isArray(depositsData.deposits) ? depositsData.deposits : []);
                setReferrals(Array.isArray(referralsData.summary) ? referralsData.summary : []);
                // komisi-log tabel baru -- kalau belum di-migrate, gagal diem-diem
                // aja (garis Komisi jatoh balik ke mode flat/snapshot lama).
                setKomisiLog(Array.isArray(komisiLogData.log) ? komisiLogData.log : []);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
                <p className="text-sm text-gray-400">Memuat statistik...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    const totalPesanan = orders.length;

    // Breakdown per status.
    const statusCounts = {};
    orders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusOrder = ['Selesai', 'Diproses', 'Pending', 'Gagal'];

    // Pesanan Gagal DIKELUARIN dari sini & seterusnya (Platform, Top Layanan)
    // -- gak representatif sebagai omset/performa layanan beneran, biasanya
    // direfund. Breakdown Status Pesanan di atas beda sendiri, itu memang
    // tujuannya nunjukkin proporsi Gagal, jadi TETEP hitung semua status.
    const totalPesananNonGagal = orders.filter((o) => o.status !== 'Gagal').length;

    // Breakdown per platform.
    const platformMap = new Map();
    orders.forEach((o) => {
        if (o.status === 'Gagal') return;
        const key = o.platform || 'Lainnya';
        if (!platformMap.has(key)) platformMap.set(key, { count: 0, omset: 0 });
        const entry = platformMap.get(key);
        entry.count += 1;
        entry.omset += Number(o.harga || 0);
    });
    const platformRows = Array.from(platformMap.entries())
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.count - a.count);

    // Top 5 layanan terlaris (by jumlah pesanan).
    const layananMap = new Map();
    orders.forEach((o) => {
        if (o.status === 'Gagal') return;
        const key = o.layanan || '(tanpa nama)';
        if (!layananMap.has(key)) layananMap.set(key, { count: 0, omset: 0 });
        const entry = layananMap.get(key);
        entry.count += 1;
        entry.omset += Number(o.harga || 0);
    });
    const topLayanan = Array.from(layananMap.entries())
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const totalKomisi = referrals.reduce((sum, r) => sum + Number(r.komisiBalance || 0), 0);
    const hasKomisiLog = komisiLog.length > 0;

    const { start: rangeStart, end: rangeEnd } = getRangeDates(rangePreset, customStart, customEnd, orders, deposits);
    const trendData = buildDailyTrendRange(orders, deposits, komisiLog, rangeStart, rangeEnd);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Statistik</h2>
            </div>

            {/* Judul + legend + range selector -- SEMUA di luar box chart, bukan
          nempel jadi satu sama box-nya. */}
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className="text-lg font-bold">Tren Deposit, Revenue, Order & Komisi</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Saldo komisi belum diklaim (semua pengguna) saat ini: <span className="text-[#C084FC] font-medium">{formatRupiah(totalKomisi)}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {SERIES_CONFIG.map((s) => (
                            <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 bg-[#111111] border border-white/10 rounded-xl p-1 flex-wrap w-fit">
                        {RANGE_PRESETS.map((r) => (
                            <button
                                key={r.key}
                                onClick={() => setRangePreset(r.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${rangePreset === r.key ? 'bg-[#FFB800] text-black' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {rangePreset === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-[#111111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#FFB800]"
                            />
                            <span className="text-gray-500 text-sm">s/d</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-[#111111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-[#FFB800]"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Box chart-nya sendiri -- 1 chart gabungan, 4 garis: Deposit, Revenue,
          Order, Komisi. Komisi sekarang beneran tren harian dari tabel
          komisi_log (diisi trigger handle_deposit_success() & RPC
          claim_komisi_balance() -- lihat migration komisi-log/01_komisi_log.sql).
          Batasnya: cuma nyatet kejadian SEJAK tabel log ini dipasang, komisi
          lama sebelum itu gak ke-backfill (gak ada tanggal aslinya). */}
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 sm:p-8">
                {!hasKomisiLog && (
                    <p className="text-xs text-gray-600 mb-2">
                        Garis Komisi masih di 0 -- kalau tabel <span className="font-mono">komisi_log</span> baru aja dipasang,
                        ini normal, cuma bakal keisi buat komisi yang kejadian MULAI SEKARANG (komisi lama sebelum tabel ini
                        dibikin gak ke-backfill).
                    </p>
                )}

                <MultiTrendChart data={trendData} />
            </div>

            {/* Breakdown status & platform */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Breakdown Status Pesanan</h3>
                    {statusOrder
                        .filter((s) => statusCounts[s])
                        .map((s) => (
                            <BreakdownRow key={s} label={s} count={statusCounts[s]} total={totalPesanan} barColor={statusBarColor[s]} />
                        ))}
                    {totalPesanan === 0 && <p className="text-sm text-gray-500">Belum ada data pesanan.</p>}
                </div>

                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Breakdown per Platform</h3>
                    {platformRows.map((p) => (
                        <BreakdownRow key={p.label} label={p.label} count={p.count} total={totalPesananNonGagal} barColor="bg-[#FFB800]" extra={formatRupiah(p.omset)} />
                    ))}
                    {platformRows.length === 0 && <p className="text-sm text-gray-500">Belum ada data pesanan.</p>}
                </div>
            </div>

            {/* Top layanan */}
            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold">Top 5 Layanan Terlaris</h3>
                </div>
                {topLayanan.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada data pesanan.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-left border-b border-white/10">
                                    <th className="px-6 py-3 font-medium">#</th>
                                    <th className="px-6 py-3 font-medium">Layanan</th>
                                    <th className="px-6 py-3 font-medium">Jumlah Pesanan</th>
                                    <th className="px-6 py-3 font-medium">Total Omset</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topLayanan.map((l, i) => (
                                    <tr key={l.label} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4 font-medium">{l.label}</td>
                                        <td className="px-6 py-4">{l.count}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[#FFB800] font-bold">{formatRupiah(l.omset)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}