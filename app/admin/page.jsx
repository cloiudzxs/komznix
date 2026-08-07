'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Asterisk,
    LayoutDashboard,
    ClipboardList,
    Users,
    Settings2,
    Wallet,
    MessageSquare,
    LogOut,
    Menu,
    X,
    TrendingUp,
    ShoppingCart,
    Gift,
    Percent,
    History,
    Megaphone,
    Newspaper,
    UserX,
    Clock,
    CheckCircle2,
    Server,
    Package,
    MessageCircle,
    BarChart3,
    BookOpen,
    BadgePlus,
    RefreshCw,
    AlertTriangle,
} from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Lazy load semua manager.
 * Sebelumnya 13 komponen admin di-import statis -> semuanya ikut masuk
 * bundle halaman /admin walaupun admin cuma buka tab Overview.
 * next/dynamic bikin tiap tab ke-fetch pas dibuka aja.
 * ------------------------------------------------------------------ */
const PanelSkeleton = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-10 w-52 rounded-xl bg-white/5" />
        <div className="h-64 rounded-2xl bg-white/5" />
    </div>
);

const lazyPanel = (loader) => dynamic(loader, { ssr: false, loading: PanelSkeleton });

const OrdersManager = lazyPanel(() => import('../../components/admin/OrdersManager'));
const UsersManager = lazyPanel(() => import('../../components/admin/UsersManager'));
const ServicesManager = lazyPanel(() => import('../../components/admin/ServicesManager'));
const DepositsManager = lazyPanel(() => import('../../components/admin/DepositsManager'));
const TicketsManager = lazyPanel(() => import('../../components/admin/TicketsManager'));
const ReferralManager = lazyPanel(() => import('../../components/admin/ReferralManager'));
const MarkupManager = lazyPanel(() => import('../../components/admin/MarkupManager'));
const ActivityLogManager = lazyPanel(() => import('../../components/admin/ActivityLogManager'));
const BroadcastManager = lazyPanel(() => import('../../components/admin/BroadcastManager'));
const BeritaManager = lazyPanel(() => import('../../components/admin/BeritaManager'));
const BlogManager = lazyPanel(() => import('../../components/admin/BlogManager'));
const StatistikManager = lazyPanel(() => import('../../components/admin/StatistikManager'));
const DepositManualManager = lazyPanel(() => import('../../components/admin/DepositManualManager'));

/* ------------------------------------------------------------------ *
 * Nav
 * Tiap menu punya `id` stabil yang dipakai sebagai state + URL hash,
 * jadi refresh / share link gak balik ke Overview terus.
 * ------------------------------------------------------------------ */
const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, Panel: null },
    { id: 'statistik', label: 'Statistik', icon: BarChart3, Panel: StatistikManager },
    { id: 'pesanan', label: 'Kelola Pesanan', icon: ClipboardList, Panel: OrdersManager },
    { id: 'pengguna', label: 'Kelola Pengguna', icon: Users, Panel: UsersManager },
    { id: 'layanan', label: 'Kelola Layanan', icon: Settings2, Panel: ServicesManager },
    { id: 'deposit', label: 'Deposit Masuk', icon: Wallet, Panel: DepositsManager },
    { id: 'deposit-manual', label: 'Deposit Manual', icon: BadgePlus, Panel: DepositManualManager },
    { id: 'tiket', label: 'Tiket Support', icon: MessageSquare, Panel: TicketsManager },
    { id: 'broadcast', label: 'Broadcast', icon: Megaphone, Panel: BroadcastManager },
    { id: 'berita', label: 'Kelola Berita', icon: Newspaper, Panel: BeritaManager },
    { id: 'blog', label: 'Blog', icon: BookOpen, Panel: BlogManager },
    { id: 'referral', label: 'Referral', icon: Gift, Panel: ReferralManager },
    { id: 'markup', label: 'Markup', icon: Percent, Panel: MarkupManager },
    { id: 'log', label: 'Log Aktivitas', icon: History, Panel: ActivityLogManager },
];

const NAV_BY_ID = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item]));

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/* ------------------------------ format ---------------------------- */

function formatRupiah(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'Rp 0';
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function formatAngka(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('id-ID');
}

// Label sumbu-Y dipendekin biar muat di 44px kiri chart.
function formatRupiahRingkas(value) {
    const n = Number(value) || 0;
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1)}M`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}jt`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
    return String(Math.round(n));
}

/* ------------------------------ chart data ------------------------ */

/**
 * Kelompokkan pesanan asli ke tren per hari.
 * Versi lama O(hari x pesanan) + bikin object Date baru tiap perbandingan
 * (90 hari x 5000 pesanan = 450rb parsing tanggal, tiap render).
 * Sekarang: batas hari dihitung sekali, tiap pesanan cuma diparse sekali
 * lalu ditaruh ke bucket-nya lewat binary search -> O(pesanan log hari).
 *
 * Pesanan Gagal sengaja DIKELUARIN — biasanya direfund, jadi gak
 * representatif sebagai pendapatan/aktivitas beneran.
 */
function buildTrendDataFromOrders(orders, days) {
    const firstDay = new Date();
    firstDay.setHours(0, 0, 0, 0);
    firstDay.setDate(firstDay.getDate() - (days - 1));

    // Batas hari dihitung lewat aritmatika kalender (bukan +86400000),
    // jadi tetap benar kalau suatu saat dipakai di zona waktu ber-DST.
    const bounds = new Array(days + 1);
    const cursor = new Date(firstDay);
    const labels = new Array(days);
    for (let i = 0; i <= days; i++) {
        bounds[i] = cursor.getTime();
        if (i < days) labels[i] = `${cursor.getDate()} ${BULAN_SINGKAT[cursor.getMonth()]}`;
        cursor.setDate(cursor.getDate() + 1);
    }

    const points = labels.map((label) => ({ label, pendapatan: 0, pesanan: 0 }));

    for (const o of orders) {
        if (o?.status === 'Gagal') continue;
        const t = new Date(o?.created_at).getTime();
        if (!Number.isFinite(t) || t < bounds[0] || t >= bounds[days]) continue;

        let lo = 0;
        let hi = days - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (t >= bounds[mid]) lo = mid;
            else hi = mid - 1;
        }

        points[lo].pendapatan += Number(o?.harga) || 0;
        points[lo].pesanan += 1;
    }

    return points;
}

// Biar sumbu-X gak penuh sesak, cuma sebagian label yang ditampilkan.
function pickLabelIndexes(length) {
    if (length <= 8) return new Set(Array.from({ length }, (_, i) => i));
    const step = Math.ceil(length / 7);
    const indexes = new Set();
    for (let i = 0; i < length; i += step) indexes.add(i);
    indexes.add(length - 1);
    return indexes;
}

// Catmull-Rom -> Bezier. Visual doang; angka persis per hari tetap akurat
// lewat tooltip pas hover/klik.
function buildSmoothPath(points) {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        d += ` C ${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6}`;
        d += ` ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6}`;
        d += ` ${p2[0]},${p2[1]}`;
    }
    return d;
}

function maxOf(data, key) {
    let max = 0;
    for (const d of data) {
        const v = Number(d[key]) || 0;
        if (v > max) max = v;
    }
    return max;
}

/* ------------------------------ chart ----------------------------- */

const TrendChart = ({ data, loading }) => {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 900, height: 260 });
    const [hoverIndex, setHoverIndex] = useState(null);

    // useLayoutEffect: ukur sebelum browser paint, biar frame pertama gak
    // sempat kelihatan pakai ukuran default.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setSize((prev) =>
                    Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
                        ? prev
                        : { width: rect.width, height: rect.height }
                );
            }
        };
        update();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // BUG lama: hover di titik ke-50 (range 90 hari) lalu pindah ke 7 hari
    // bikin hoverIndex out of range -> pendapatanPoints[50][0] crash.
    useEffect(() => {
        setHoverIndex((prev) => (prev === null || prev < data.length ? prev : null));
    }, [data.length]);

    const { width, height } = size;
    const padding = { top: 16, right: 16, bottom: 28, left: 46 };
    const chartW = Math.max(width - padding.left - padding.right, 1);
    const chartH = Math.max(height - padding.top - padding.bottom, 1);
    const baseY = padding.top + chartH;

    const geom = useMemo(() => {
        const count = data.length;
        const bandW = count > 1 ? chartW / (count - 1) : chartW;
        const xFor = (i) => padding.left + bandW * i;

        // Tiap seri diskalakan ke rentangnya sendiri, jadi rupiah dan jumlah
        // pesanan sama-sama kebaca di satu grafik tanpa dua sumbu-Y.
        const maxPendapatan = Math.max(maxOf(data, 'pendapatan'), 1) * 1.15;
        const maxPesanan = Math.max(maxOf(data, 'pesanan'), 1) * 1.15;

        const pendapatanPoints = data.map((d, i) => [
            xFor(i),
            padding.top + chartH - ((Number(d.pendapatan) || 0) / maxPendapatan) * chartH,
        ]);
        const pesananPoints = data.map((d, i) => [
            xFor(i),
            padding.top + chartH - ((Number(d.pesanan) || 0) / maxPesanan) * chartH,
        ]);

        const pendapatanPath = buildSmoothPath(pendapatanPoints);
        const areaPath =
            pendapatanPoints.length > 1
                ? `${pendapatanPath} L ${pendapatanPoints[count - 1][0]},${baseY} L ${pendapatanPoints[0][0]},${baseY} Z`
                : '';

        return {
            bandW,
            xFor,
            maxPendapatan,
            pendapatanPoints,
            pesananPoints,
            pendapatanPath,
            pesananPath: buildSmoothPath(pesananPoints),
            areaPath,
            labelIndexes: pickLabelIndexes(count),
        };
    }, [data, chartW, chartH, baseY, padding.left, padding.top]);

    const handlePointerMove = useCallback(
        (e) => {
            const el = containerRef.current;
            if (!el || data.length === 0 || geom.bandW === 0) return;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0) return;
            const svgX = ((e.clientX - rect.left) / rect.width) * width;
            const idx = Math.round((svgX - padding.left) / geom.bandW);
            setHoverIndex(Math.min(Math.max(idx, 0), data.length - 1));
        },
        [data.length, geom.bandW, width, padding.left]
    );

    const clearHover = useCallback(() => setHoverIndex(null), []);

    const gridFractions = [0, 0.5, 1];
    const active = hoverIndex !== null ? data[hoverIndex] : null;
    const activeX = active ? geom.xFor(hoverIndex) : null;
    const tooltipLeftPct = width > 0 && activeX !== null ? (activeX / width) * 100 : 0;
    const tooltipAlign = tooltipLeftPct < 15 ? 'left' : tooltipLeftPct > 85 ? 'right' : 'center';

    // Container ber-ref HARUS selalu ke-render, termasuk pas loading.
    // Sebelumnya di sini ada early-return skeleton, jadi pas mount pertama
    // (loading = true) div-nya belum ada -> containerRef.current null ->
    // ResizeObserver gak pernah kepasang, dan karena deps efeknya [] dia gak
    // pernah jalan lagi. Ukuran nyangkut di default 900x260, viewBox jadi
    // lebih kecil dari container, dan SVG-nya di-letterbox (kekecilan +
    // ada ruang kosong kiri-kanan).
    const isEmpty = !loading && data.length === 0;

    return (
        <div
            ref={containerRef}
            className="w-full h-64 sm:h-72 lg:h-80 relative select-none"
            style={{ touchAction: 'pan-y' }}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            onPointerLeave={clearHover}
            onPointerCancel={clearHover}
        >
            {loading && <div className="absolute inset-0 rounded-xl bg-white/5 animate-pulse" />}

            {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                    Belum ada pesanan di rentang ini.
                </div>
            )}

            {!loading && !isEmpty && (
                <>
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block" role="img" aria-label="Grafik tren pendapatan dan pesanan">
                        <defs>
                            <linearGradient id="trendPendapatanGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FFB800" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#FFB800" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {gridFractions.map((f) => {
                            const y = padding.top + chartH * (1 - f);
                            return (
                                <g key={f}>
                                    <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" />
                                    {/* Ruang 46px di kiri sekarang kepakai: skala pendapatan */}
                                    <text x={padding.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#6f6f6f">
                                        {formatRupiahRingkas(geom.maxPendapatan * f)}
                                    </text>
                                </g>
                            );
                        })}

                        <path d={geom.areaPath} fill="url(#trendPendapatanGrad)" />
                        <path d={geom.pendapatanPath} fill="none" stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={geom.pesananPath} fill="none" stroke="#4EA8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                        {activeX !== null && (
                            <>
                                <line
                                    x1={activeX}
                                    x2={activeX}
                                    y1={padding.top}
                                    y2={baseY}
                                    stroke="#ffffff"
                                    strokeOpacity="0.15"
                                    strokeDasharray="4 4"
                                />
                                <circle
                                    cx={geom.pendapatanPoints[hoverIndex][0]}
                                    cy={geom.pendapatanPoints[hoverIndex][1]}
                                    r="5"
                                    fill="#FFB800"
                                    stroke="#111111"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx={geom.pesananPoints[hoverIndex][0]}
                                    cy={geom.pesananPoints[hoverIndex][1]}
                                    r="5"
                                    fill="#4EA8FF"
                                    stroke="#111111"
                                    strokeWidth="2"
                                />
                            </>
                        )}

                        {data.map((d, i) =>
                            geom.labelIndexes.has(i) ? (
                                <text key={`${d.label}-${i}`} x={geom.xFor(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#8a8a8a">
                                    {d.label}
                                </text>
                            ) : null
                        )}
                    </svg>

                    {active && (
                        <div
                            className="absolute top-0 pointer-events-none bg-[#191A19] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl whitespace-nowrap z-10"
                            style={{
                                left: `${tooltipLeftPct}%`,
                                transform:
                                    tooltipAlign === 'left'
                                        ? 'translate(0, 0)'
                                        : tooltipAlign === 'right'
                                            ? 'translate(-100%, 0)'
                                            : 'translate(-50%, 0)',
                            }}
                        >
                            <p className="font-medium text-white mb-1.5">{active.label}</p>
                            <p className="flex items-center gap-1.5 text-[#FFB800]">
                                <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> Pendapatan: {formatRupiah(active.pendapatan)}
                            </p>
                            <p className="flex items-center gap-1.5 text-[#4EA8FF] mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-[#4EA8FF]" /> Pesanan: {formatAngka(active.pesanan)}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/* ------------------------------ kartu ----------------------------- */

const StatCard = ({ icon: Icon, label, value, loading, error, trend }) => (
    <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center">
                <Icon className="w-5 h-5 text-black" />
            </div>
            {trend && (
                <span className="text-xs font-medium text-[#FFB800] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> {trend}
                </span>
            )}
            {error && <AlertTriangle className="w-4 h-4 text-red-400" title={error} />}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{label}</p>
            {loading ? (
                <div className="h-8 w-24 mt-1 rounded-lg bg-white/5 animate-pulse" />
            ) : (
                <p className={`text-2xl font-bold mt-1 ${error ? 'text-red-400 text-base' : ''}`}>{error ? 'Gagal dimuat' : value}</p>
            )}
        </div>
    </div>
);

/* ------------------------------ sidebar --------------------------- */

const SidebarBody = ({ activeId, onSelect, onLogout, onClose }) => (
    <>
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                <Asterisk className="w-8 h-8 text-white" />
                <span className="text-2xl font-bold tracking-tight">
                    SuntikSosmed<span className="text-[#FFB800]">.</span>
                </span>
            </div>
            {onClose && (
                <button onClick={onClose} aria-label="Tutup menu">
                    <X className="w-6 h-6" />
                </button>
            )}
        </div>
        <span className="text-[10px] font-bold bg-[#FFB800] text-black px-2 py-0.5 rounded-full w-fit mb-9">ADMIN</span>

        <nav className="flex flex-col gap-1 overflow-y-auto">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activeId === id;
                return (
                    <button
                        key={id}
                        onClick={() => onSelect(id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${isActive ? 'bg-[#FFB800] text-black' : 'text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {label}
                    </button>
                );
            })}
        </nav>

        <div className="mt-auto pt-4 flex flex-col gap-1">
            <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
            >
                <LayoutDashboard className="w-5 h-5" />
                Ke Dashboard Pelanggan
            </Link>
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Keluar
            </button>
        </div>
    </>
);

/* ------------------------------ helper fetch ---------------------- */

async function getJson(url, signal) {
    const res = await fetch(url, { signal, cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) throw new Error(data?.error || `Gagal memuat (${res.status})`);
    return data;
}

const EMPTY_ERRORS = {};

/* ------------------------------ page ------------------------------ */

export default function AdminPage() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeId, setActiveId] = useState('overview');
    const [authState, setAuthState] = useState('checking'); // checking | ok | error
    const [rangeDays, setRangeDays] = useState(7);
    const [reloadKey, setReloadKey] = useState(0);

    const [allOrders, setAllOrders] = useState([]);
    const [userStats, setUserStats] = useState({ total: null, suspended: null });
    const [markupPersen, setMarkupPersen] = useState(null);
    const [providerBalance, setProviderBalance] = useState(null);
    const [totalServiceCount, setTotalServiceCount] = useState(null);
    const [openTicketCount, setOpenTicketCount] = useState(null);
    const [depositPendingCount, setDepositPendingCount] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [errors, setErrors] = useState(EMPTY_ERRORS);

    const active = NAV_BY_ID[activeId] ?? NAV_BY_ID.overview;

    /* --- tab disimpan di URL hash biar refresh gak balik ke Overview --- */
    useEffect(() => {
        const fromHash = window.location.hash.replace('#', '');
        if (NAV_BY_ID[fromHash]) setActiveId(fromHash);

        const onHashChange = () => {
            const id = window.location.hash.replace('#', '');
            if (NAV_BY_ID[id]) setActiveId(id);
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const selectMenu = useCallback((id) => {
        setActiveId(id);
        setSidebarOpen(false);
        if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`);
    }, []);

    /* --- auth guard: cookie httpOnly via /api/admin-auth/session ---
       Versi lama gak punya try/catch — kalau fetch-nya reject (offline /
       server down), authChecked gak pernah true dan layar item selamanya. */
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                const res = await fetch('/api/admin-auth/session', { signal: ac.signal, cache: 'no-store' });
                if (!res.ok) {
                    router.replace('/admin/login');
                    return;
                }
                setAuthState('ok');
            } catch (err) {
                if (err.name !== 'AbortError') setAuthState('error');
            }
        })();
        return () => ac.abort();
    }, [router]);

    /* --- semua data Overview diambil paralel dalam satu efek ---
       Sebelumnya 6 useEffect terpisah tanpa cleanup: tiap fetch bisa
       setState setelah unmount, dan gak ada cara refresh manual. */
    useEffect(() => {
        if (authState !== 'ok') return;
        const ac = new AbortController();
        let alive = true;

        setLoadingStats(true);

        const tasks = [
            ['users', () => getJson('/api/admin/users', ac.signal)],
            ['orders', () => getJson('/api/admin/orders', ac.signal)],
            ['balance', () => getJson('/api/smm/balance', ac.signal)],
            ['services', () => getJson('/api/smm/services', ac.signal)],
            ['tickets', () => getJson('/api/admin/tickets', ac.signal)],
            ['deposits', () => getJson('/api/admin/deposits', ac.signal)],
            ['settings', () => getJson('/api/admin/settings', ac.signal)],
        ];

        Promise.allSettled(tasks.map(([, run]) => run())).then((results) => {
            if (!alive) return;
            const nextErrors = {};

            results.forEach((result, i) => {
                const key = tasks[i][0];
                if (result.status === 'rejected') {
                    if (result.reason?.name === 'AbortError') return;
                    nextErrors[key] = result.reason?.message || 'Gagal dimuat';
                    return;
                }
                const data = result.value;
                switch (key) {
                    case 'users':
                        if (Array.isArray(data.users)) {
                            setUserStats({
                                total: data.users.length,
                                suspended: data.users.filter((u) => u.status === 'Suspend').length,
                            });
                        }
                        break;
                    case 'orders':
                        if (Array.isArray(data.orders)) setAllOrders(data.orders);
                        break;
                    case 'balance':
                        setProviderBalance(data);
                        break;
                    case 'services':
                        if (Array.isArray(data.services)) setTotalServiceCount(data.services.length);
                        break;
                    case 'tickets':
                        if (Array.isArray(data.tickets)) setOpenTicketCount(data.tickets.filter((t) => t.status === 'Terbuka').length);
                        break;
                    case 'deposits':
                        if (Array.isArray(data.deposits)) {
                            setDepositPendingCount(data.deposits.filter((d) => d.status === 'Menunggu Konfirmasi').length);
                        }
                        break;
                    case 'settings':
                        if (data.settings?.markup_persen !== undefined) setMarkupPersen(Number(data.settings.markup_persen));
                        break;
                    default:
                        break;
                }
            });

            setErrors(nextErrors);
            setLoadingStats(false);
        });

        return () => {
            alive = false;
            ac.abort();
        };
    }, [authState, reloadKey]);

    /* --- turunan, bukan state --- */
    const trendData = useMemo(() => buildTrendDataFromOrders(allOrders, rangeDays), [allOrders, rangeDays]);

    const revenueStats = useMemo(() => {
        // Omset Kotor = total harga semua pesanan KECUALI Gagal (biasanya
        // direfund). Ini gak butuh markup, jadi tetap tampil walau
        // /api/admin/settings gagal — beda dari versi lama yang nge-block
        // dua-duanya kalau markupPersen masih null.
        const kotor = allOrders.filter((o) => o.status !== 'Gagal').reduce((sum, o) => sum + (Number(o.harga) || 0), 0);

        if (markupPersen == null || !Number.isFinite(markupPersen) || markupPersen <= -100) {
            return { kotor, bersih: null };
        }

        // Omset Bersih = profit (harga jual − estimasi modal) dari pesanan
        // "Selesai" doang. Modal diestimasi dari markup % yang berlaku
        // SEKARANG, jadi bisa geser kalau markup pernah diubah.
        const bersih = allOrders
            .filter((o) => o.status === 'Selesai')
            .reduce((sum, o) => {
                const harga = Number(o.harga) || 0;
                return sum + (harga - harga / (1 + markupPersen / 100));
            }, 0);

        return { kotor, bersih };
    }, [allOrders, markupPersen]);

    const successCount = useMemo(() => allOrders.filter((o) => o.status === 'Selesai').length, [allOrders]);

    /* --- drawer mobile: kunci scroll + tutup pakai Esc --- */
    useEffect(() => {
        if (!sidebarOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false);
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [sidebarOpen]);

    const handleLogout = useCallback(async () => {
        try {
            await fetch('/api/admin-auth/logout', { method: 'POST' });
        } finally {
            router.replace('/admin/login');
        }
    }, [router]);

    if (authState === 'checking') {
        return <div className="bg-[#111111] min-h-screen" />;
    }

    if (authState === 'error') {
        return (
            <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <AlertTriangle className="w-10 h-10 text-[#FFB800] mx-auto mb-4" />
                    <h1 className="text-lg font-bold mb-1">Sesi admin tidak bisa diperiksa</h1>
                    <p className="text-gray-400 text-sm mb-5">Koneksi ke server bermasalah. Coba muat ulang halaman.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-xl bg-[#FFB800] text-black font-semibold text-sm"
                    >
                        Muat ulang
                    </button>
                </div>
            </div>
        );
    }

    const isOverview = activeId === 'overview';
    const ActivePanel = active.Panel;

    return (
        <div className="bg-[#111111] min-h-screen text-white flex">
            {/* Sidebar - desktop */}
            <aside className="hidden lg:flex lg:w-72 flex-col border-r border-white/10 p-6 shrink-0 h-screen sticky top-0">
                <SidebarBody activeId={activeId} onSelect={selectMenu} onLogout={handleLogout} />
            </aside>

            {/* Sidebar - mobile drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#111111] border-r border-white/10 p-6 flex flex-col">
                        <SidebarBody
                            activeId={activeId}
                            onSelect={selectMenu}
                            onLogout={handleLogout}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between gap-4 px-6 lg:px-10 py-6 border-b border-white/10">
                    <div className="flex items-center gap-4 min-w-0">
                        <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-bold truncate">{active.label}</h1>
                            <p className="text-gray-400 text-sm hidden md:block">Panel kelola SuntikSosmed — bukan untuk pelanggan.</p>
                        </div>
                    </div>

                    {isOverview && (
                        <button
                            onClick={() => setReloadKey((k) => k + 1)}
                            disabled={loadingStats}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/5 disabled:opacity-50 transition-colors shrink-0"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Perbarui</span>
                        </button>
                    )}
                </header>

                <main className="p-6 lg:p-10 flex flex-col gap-8">
                    {ActivePanel ? (
                        <ActivePanel />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                <StatCard
                                    icon={Users}
                                    label="Total Pengguna"
                                    value={formatAngka(userStats.total)}
                                    loading={loadingStats && userStats.total === null}
                                    error={errors.users}
                                />
                                <StatCard
                                    icon={UserX}
                                    label="Pengguna Diblokir"
                                    value={formatAngka(userStats.suspended)}
                                    loading={loadingStats && userStats.suspended === null}
                                    error={errors.users}
                                />
                                <StatCard
                                    icon={Wallet}
                                    label="Omset Kotor"
                                    value={formatRupiah(revenueStats.kotor)}
                                    loading={loadingStats && allOrders.length === 0}
                                    error={errors.orders}
                                />
                                <StatCard
                                    icon={Clock}
                                    label="Deposit Pending"
                                    value={formatAngka(depositPendingCount)}
                                    loading={loadingStats && depositPendingCount === null}
                                    error={errors.deposits}
                                />
                                <StatCard
                                    icon={ShoppingCart}
                                    label="Omset Bersih"
                                    value={revenueStats.bersih != null ? formatRupiah(revenueStats.bersih) : 'Markup belum diset'}
                                    loading={loadingStats && allOrders.length === 0}
                                    error={errors.orders || errors.settings}
                                />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Transaksi Berhasil"
                                    value={formatAngka(successCount)}
                                    loading={loadingStats && allOrders.length === 0}
                                    error={errors.orders}
                                />
                                <StatCard
                                    icon={Server}
                                    label="Saldo Provider (SMMSOC)"
                                    value={
                                        providerBalance
                                            ? `${providerBalance.currency || '$'} ${formatAngka(providerBalance.balance)}`
                                            : '-'
                                    }
                                    loading={loadingStats && !providerBalance}
                                    error={errors.balance}
                                />
                                <StatCard
                                    icon={Package}
                                    label="Total Service"
                                    value={formatAngka(totalServiceCount)}
                                    loading={loadingStats && totalServiceCount === null}
                                    error={errors.services}
                                />
                                <StatCard
                                    icon={MessageCircle}
                                    label="Tiket Terbuka"
                                    value={formatAngka(openTicketCount)}
                                    loading={loadingStats && openTicketCount === null}
                                    error={errors.tickets}
                                />
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold">Tren Transaksi &amp; Pendapatan</h2>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" /> Pendapatan
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <span className="w-2.5 h-2.5 rounded-full bg-[#4EA8FF]" /> Pesanan
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#111111] border border-white/10 rounded-xl p-1 self-start">
                                        {[7, 30, 90].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setRangeDays(d)}
                                                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${rangeDays === d ? 'bg-[#FFB800] text-black' : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {d} Hari
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <TrendChart data={trendData} loading={loadingStats && allOrders.length === 0} />
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold mb-1">Selamat datang di panel admin</h2>
                                <p className="text-gray-400 text-sm">
                                    Gunakan menu di samping untuk kelola pesanan, pengguna, layanan, deposit, dan tiket support.
                                </p>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}