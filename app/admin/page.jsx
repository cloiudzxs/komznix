'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import OrdersManager from '../../components/admin/OrdersManager';
import UsersManager from '../../components/admin/UsersManager';
import ServicesManager from '../../components/admin/ServicesManager';
import DepositsManager from '../../components/admin/DepositsManager';
import TicketsManager from '../../components/admin/TicketsManager';
import ReferralManager from '../../components/admin/ReferralManager';
import MarkupManager from '../../components/admin/MarkupManager';
import ActivityLogManager from '../../components/admin/ActivityLogManager';
import BroadcastManager from '../../components/admin/BroadcastManager';
import BeritaManager from '../../components/admin/BeritaManager';
import StatistikManager from '../../components/admin/StatistikManager';

const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Statistik', icon: BarChart3 },
    { label: 'Kelola Pesanan', icon: ClipboardList },
    { label: 'Kelola Pengguna', icon: Users },
    { label: 'Kelola Layanan', icon: Settings2 },
    { label: 'Deposit Masuk', icon: Wallet },
    { label: 'Tiket Support', icon: MessageSquare },
    { label: 'Broadcast', icon: Megaphone },
    { label: 'Kelola Berita', icon: Newspaper },
    { label: 'Referral', icon: Gift },
    { label: 'Markup', icon: Percent },
    { label: 'Log Aktivitas', icon: History },
];

function formatRupiah(value) {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Kelompokkan pesanan asli ke tren per hari: Pendapatan = total harga
// pesanan hari itu, Pesanan = jumlah pesanan hari itu.
function buildTrendDataFromOrders(orders, days) {
    const now = new Date();
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        // Pesanan Gagal sengaja DIKELUARIN -- gak representatif sebagai
        // pendapatan/aktivitas beneran (biasanya direfund).
        const ordersInDay = orders.filter((o) => {
            const t = new Date(o.created_at).getTime();
            return t >= dayStart.getTime() && t < dayEnd.getTime() && o.status !== 'Gagal';
        });

        points.push({
            label: `${dayStart.getDate()} ${BULAN_SINGKAT[dayStart.getMonth()]}`,
            pendapatan: ordersInDay.reduce((sum, o) => sum + Number(o.harga || 0), 0),
            pesanan: ordersInDay.length,
        });
    }
    return points;
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

// Konversi titik ke path SVG melengkung (Catmull-Rom -> Bezier) — buat
// visual doang. Angka PERSISNYA per hari tetap keliatan akurat lewat
// tooltip pas di-hover/klik (lihat handlePointerMove di bawah), jadi
// smooth curve ini aman gak menyesatkan lagi.
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

const TrendChart = ({ data }) => {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 900, height: 260 });
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
    const padding = { top: 16, right: 16, bottom: 28, left: 44 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const bandW = data.length > 1 ? chartW / (data.length - 1) : chartW;
    const xFor = (i) => padding.left + bandW * i;
    const baseY = padding.top + chartH;

    // Tiap seri di-skalakan ke rentang-nya sendiri, jadi dua metrik dengan
    // satuan beda jauh (rupiah vs jumlah pesanan) tetap sama-sama kebaca di
    // grafik yang sama, tanpa perlu dua sumbu-Y.
    const maxPendapatan = Math.max(...data.map((d) => d.pendapatan), 1) * 1.15;
    const maxPesanan = Math.max(...data.map((d) => d.pesanan), 1) * 1.15;
    const yForPendapatan = (v) => padding.top + chartH - (v / maxPendapatan) * chartH;
    const yForPesanan = (v) => padding.top + chartH - (v / maxPesanan) * chartH;

    const pendapatanPoints = data.map((d, i) => [xFor(i), yForPendapatan(d.pendapatan)]);
    const pesananPoints = data.map((d, i) => [xFor(i), yForPesanan(d.pesanan)]);
    const pendapatanPath = buildSmoothPath(pendapatanPoints);
    const pesananPath = buildSmoothPath(pesananPoints);
    const pendapatanAreaPath =
        pendapatanPoints.length > 0
            ? `${pendapatanPath} L ${pendapatanPoints[pendapatanPoints.length - 1][0]},${baseY} L ${pendapatanPoints[0][0]},${baseY} Z`
            : '';

    const gridFractions = [0, 0.5, 1];
    const labelIndexes = pickLabelIndexes(data.length);

    // Cari titik data terdekat dari posisi mouse/jari, buat nampilin
    // tooltip dengan angka PERSIS hari itu (bukan hasil interpolasi kurva).
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
            className="w-full h-64 sm:h-72 lg:h-80 relative"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => setHoverIndex(null)}
            onTouchMove={handlePointerMove}
            onTouchEnd={() => setHoverIndex(null)}
            onClick={handlePointerMove}
        >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block">
                <defs>
                    <linearGradient id="trendPendapatanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FFB800" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {gridFractions.map((f) => {
                    const y = padding.top + chartH * (1 - f);
                    return (
                        <line
                            key={f}
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                            stroke="#ffffff"
                            strokeOpacity="0.06"
                        />
                    );
                })}

                <path d={pendapatanAreaPath} fill="url(#trendPendapatanGrad)" />
                <path d={pendapatanPath} fill="none" stroke="#FFB800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={pesananPath} fill="none" stroke="#4EA8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

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

                {hoverIndex !== null && (
                    <>
                        <circle
                            cx={pendapatanPoints[hoverIndex][0]}
                            cy={pendapatanPoints[hoverIndex][1]}
                            r="5"
                            fill="#FFB800"
                            stroke="#111111"
                            strokeWidth="2"
                            className="transition-[cx,cy] duration-150 ease-out"
                        />
                        <circle
                            cx={pesananPoints[hoverIndex][0]}
                            cy={pesananPoints[hoverIndex][1]}
                            r="5"
                            fill="#4EA8FF"
                            stroke="#111111"
                            strokeWidth="2"
                            className="transition-[cx,cy] duration-150 ease-out"
                        />
                    </>
                )}

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
                    className="absolute top-0 pointer-events-none bg-[#191A19] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl whitespace-nowrap z-10 transition-all duration-150 ease-out"
                    style={{
                        left: `${tooltipLeftPct}%`,
                        transform:
                            tooltipAlign === 'left' ? 'translate(0, 0)' : tooltipAlign === 'right' ? 'translate(-100%, 0)' : 'translate(-50%, 0)',
                    }}
                >
                    <p className="font-medium text-white mb-1.5">{active.label}</p>
                    <p className="flex items-center gap-1.5 text-[#FFB800]">
                        <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> Pendapatan: {formatRupiah(active.pendapatan)}
                    </p>
                    <p className="flex items-center gap-1.5 text-[#4EA8FF] mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-[#4EA8FF]" /> Pesanan: {active.pesanan}
                    </p>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, trend }) => (
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
        </div>
        <div>
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    </div>
);

export default function AdminPage() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Overview');
    const [authChecked, setAuthChecked] = useState(false);
    const [rangeDays, setRangeDays] = useState(7);
    const [allOrders, setAllOrders] = useState([]);
    const trendData = buildTrendDataFromOrders(allOrders, rangeDays);
    const [userStats, setUserStats] = useState({ total: null, suspended: null });
    const [revenueStats, setRevenueStats] = useState({ kotor: null, bersih: null });
    const [markupPersen, setMarkupPersen] = useState(null);
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [providerBalance, setProviderBalance] = useState(null);
    const [providerBalanceError, setProviderBalanceError] = useState('');
    const [totalServiceCount, setTotalServiceCount] = useState(null);
    const [openTicketCount, setOpenTicketCount] = useState(null);
    const [depositPendingCount, setDepositPendingCount] = useState(null);

    // Auth guard admin sekarang TERPISAH total dari Supabase Auth pelanggan —
    // sesinya cookie httpOnly yang dicek lewat /api/admin-auth/session (lihat
    // lib/adminAuth.js). Cookie ini otomatis kekirim tiap fetch ke endpoint
    // /api/admin/* di domain yang sama, jadi gak perlu passing token manual
    // lagi ke komponen anak.
    useEffect(() => {
        async function init() {
            const res = await fetch('/api/admin-auth/session');
            if (!res.ok) {
                router.push('/admin/login');
                return;
            }
            setAuthChecked(true);
        }

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ambil ringkasan Total Pengguna & Pengguna Diblokir buat kartu Overview,
    // dari endpoint yang sama dipakai tab Kelola Pengguna.
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/admin/users')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error('Gagal ambil userStats:', data.error);
                    return;
                }
                if (Array.isArray(data.users)) {
                    setUserStats({
                        total: data.users.length,
                        suspended: data.users.filter((u) => u.status === 'Suspend').length,
                    });
                }
            })
            .catch((err) => console.error('Gagal ambil userStats:', err.message));
    }, [authChecked]);

    // Saldo yang tersisa di akun provider (SMMSOC) — biar admin tau kapan
    // perlu top up ke provider sebelum kehabisan pas ada pesanan masuk.
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/smm/balance')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setProviderBalanceError(data.error);
                } else {
                    setProviderBalance(data);
                }
            })
            .catch((err) => setProviderBalanceError(err.message));
    }, [authChecked]);

    // Total layanan langsung dari katalog live provider.
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/smm/services')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.services)) setTotalServiceCount(data.services.length);
            })
            .catch((err) => console.error('Gagal ambil total layanan:', err.message));
    }, [authChecked]);

    // Jumlah tiket yang masih berstatus "Terbuka" (belum dibalas admin).
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/admin/tickets')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error('Gagal ambil tiket:', data.error);
                    return;
                }
                if (Array.isArray(data.tickets)) {
                    setOpenTicketCount(data.tickets.filter((t) => t.status === 'Terbuka').length);
                }
            })
            .catch((err) => console.error('Gagal ambil tiket:', err.message));
    }, [authChecked]);

    // Jumlah deposit manual yang masih nunggu dikonfirmasi admin.
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/admin/deposits')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error('Gagal ambil deposit:', data.error);
                    return;
                }
                if (Array.isArray(data.deposits)) {
                    setDepositPendingCount(data.deposits.filter((d) => d.status === 'Menunggu Konfirmasi').length);
                }
            })
            .catch((err) => console.error('Gagal ambil deposit:', err.message));
    }, [authChecked]);

    // Markup % yang lagi berlaku SEKARANG — dipakai buat estimasi harga modal
    // per pesanan (harga / (1 + markup%)), soalnya tabel orders cuma nyimpen
    // harga jual final, bukan harga modalnya. Ini estimasi, bukan modal exact
    // pas pesanan itu dibuat (bisa geser kalau markup % pernah diubah).
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/admin/settings')
            .then((res) => res.json())
            .then((data) => {
                if (data.settings?.markup_persen !== undefined) {
                    setMarkupPersen(Number(data.settings.markup_persen));
                }
            })
            .catch((err) => console.error('Gagal ambil markup:', err.message));
    }, [authChecked]);

    // Pesanan asli (tabel orders) diambil sekali di sini, dipakai bareng buat
    // Omset Kotor/Bersih, Transaksi Berhasil, DAN grafik Tren Transaksi &
    // Pendapatan di bawah — biar gak fetch dua kali buat data yang sama.
    useEffect(() => {
        if (!authChecked) return;
        fetch('/api/admin/orders')
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error('Gagal ambil data pesanan:', data.error);
                    return;
                }
                if (Array.isArray(data.orders)) {
                    setAllOrders(data.orders);
                    setOrdersLoaded(true);
                }
            })
            .catch((err) => console.error('Gagal ambil data pesanan:', err.message));
    }, [authChecked]);

    // Omset Kotor = total harga SEMUA pesanan KECUALI yang Gagal (biasanya
    // direfund, jadi gak representatif sebagai omset beneran).
    // Omset Bersih = total PROFIT (harga jual − estimasi harga modal) tapi
    // cuma dari pesanan yang statusnya "Selesai" — pesanan yang gagal/masih
    // proses gak kehitung sebagai profit real.
    useEffect(() => {
        if (markupPersen == null) return;
        const kotor = allOrders
            .filter((o) => o.status !== 'Gagal')
            .reduce((sum, o) => sum + Number(o.harga || 0), 0);
        const bersih = allOrders
            .filter((o) => o.status === 'Selesai')
            .reduce((sum, o) => {
                const harga = Number(o.harga || 0);
                const modal = harga / (1 + markupPersen / 100);
                return sum + (harga - modal);
            }, 0);
        setRevenueStats({ kotor, bersih });
    }, [allOrders, markupPersen]);

    async function handleLogout() {
        await fetch('/api/admin-auth/logout', { method: 'POST' });
        router.push('/admin/login');
    }

    if (!authChecked) {
        return <div className="bg-[#111111] min-h-screen" />;
    }

    return (
        <div className="bg-[#111111] min-h-screen text-white flex">
            {/* Sidebar - desktop */}
            <aside className="hidden lg:flex lg:w-72 flex-col border-r border-white/10 p-6 shrink-0">
                <div className="flex items-center gap-2 mb-1">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">
                        SuntikSosmed<span className="text-[#FFB800]">.</span>
                    </span>
                </div>
                <span className="text-[10px] font-bold bg-[#FFB800] text-black px-2 py-0.5 rounded-full w-fit mb-9">
                    ADMIN
                </span>

                <nav className="flex flex-col gap-1">
                    {navItems.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            onClick={() => setActiveMenu(label)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeMenu === label ? 'bg-[#FFB800] text-black' : 'text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto flex flex-col gap-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Ke Dashboard Pelanggan
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Sidebar - mobile drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#111111] border-r border-white/10 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Asterisk className="w-8 h-8 text-white" />
                                <span className="text-2xl font-bold tracking-tight">
                                    SuntikSosmed<span className="text-[#FFB800]">.</span>
                                </span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <span className="text-[10px] font-bold bg-[#FFB800] text-black px-2 py-0.5 rounded-full w-fit mb-9">
                            ADMIN
                        </span>
                        <nav className="flex flex-col gap-1">
                            {navItems.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => {
                                        setActiveMenu(label);
                                        setSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeMenu === label ? 'bg-[#FFB800] text-black' : 'text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                        <div className="mt-auto flex flex-col gap-1">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                Ke Dashboard Pelanggan
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Keluar
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between px-6 lg:px-10 py-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">{activeMenu}</h1>
                            <p className="text-gray-400 text-sm hidden md:block">Panel kelola SuntikSosmed — bukan untuk pelanggan.</p>
                        </div>
                    </div>
                </header>

                <main className="p-6 lg:p-10 flex flex-col gap-8">
                    {activeMenu === 'Statistik' ? (
                        <StatistikManager />
                    ) : activeMenu === 'Kelola Pesanan' ? (
                        <OrdersManager />
                    ) : activeMenu === 'Kelola Pengguna' ? (
                        <UsersManager />
                    ) : activeMenu === 'Kelola Layanan' ? (
                        <ServicesManager />
                    ) : activeMenu === 'Deposit Masuk' ? (
                        <DepositsManager />
                    ) : activeMenu === 'Tiket Support' ? (
                        <TicketsManager />
                    ) : activeMenu === 'Broadcast' ? (
                        <BroadcastManager />
                    ) : activeMenu === 'Kelola Berita' ? (
                        <BeritaManager />
                    ) : activeMenu === 'Referral' ? (
                        <ReferralManager />
                    ) : activeMenu === 'Markup' ? (
                        <MarkupManager />
                    ) : activeMenu === 'Log Aktivitas' ? (
                        <ActivityLogManager />
                    ) : (
                        <>
                            {/* Overview — semua kartu di bawah ini sekarang data asli dari database/provider */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                <StatCard icon={Users} label="Total Pengguna" value={userStats.total ?? '...'} />
                                <StatCard icon={UserX} label="Pengguna Diblokir" value={userStats.suspended ?? '...'} />
                                <StatCard icon={Wallet} label="Omset Kotor" value={revenueStats.kotor != null ? formatRupiah(revenueStats.kotor) : '...'} />
                                <StatCard icon={Clock} label="Deposit Pending" value={depositPendingCount ?? '...'} />
                                <StatCard icon={ShoppingCart} label="Omset Bersih" value={revenueStats.bersih != null ? formatRupiah(revenueStats.bersih) : '...'} />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Transaksi Berhasil"
                                    value={ordersLoaded ? allOrders.filter((o) => o.status === 'Selesai').length : '...'}
                                />
                                <StatCard
                                    icon={Server}
                                    label="Saldo Provider (SMMSOC)"
                                    value={
                                        providerBalanceError
                                            ? 'Gagal dimuat'
                                            : providerBalance
                                                ? `${providerBalance.currency || '$'} ${Number(providerBalance.balance).toLocaleString('id-ID')}`
                                                : '...'
                                    }
                                />
                                <StatCard icon={Package} label="Total Service" value={totalServiceCount ?? '...'} />
                                <StatCard icon={MessageCircle} label="Tiket Terbuka" value={openTicketCount ?? '...'} />
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold">Tren Transaksi & Pendapatan</h2>
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

                                <TrendChart data={trendData} />
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