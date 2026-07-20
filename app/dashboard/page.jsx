'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
    Asterisk,
    LayoutDashboard,
    ShoppingCart,
    Wallet,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    Copy,
    TrendingUp,
    Users,
    User,
    Lock,
    Save,
    Bell,
    Info,
    Tag,
    AlertTriangle,
    Gift,
    Code2,
    RefreshCw,
    Eye,
    EyeOff,
    Check,
    CheckCircle2,
    Ticket,
    List,
    Newspaper,
    ArrowDownToLine,
    Loader2,
} from 'lucide-react';
import OrderForm from '../../components/OrderForm';
import { createClient } from '../../lib/supabase/client';
import { loadReferralKomisiPersen } from '../../data/pricingSettings';
import RiwayatPesananSection from '../../components/RiwayatPesananSection';
import SaldoSection from '../../components/SaldoSection';
import TiketSection from '../../components/TiketSection';
import DaftarLayananSection from '../../components/DaftarLayananSection';
import BeritaSection from '../../components/BeritaSection';

const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Pesan Layanan', icon: ShoppingCart },
    { label: 'Riwayat Pesanan', icon: History },
    { label: 'Saldo & Deposit', icon: Wallet },
    { label: 'Tiket', icon: Ticket },
    { label: 'Daftar Layanan', icon: List },
    { label: 'Berita', icon: Newspaper },
    { label: 'Referral', icon: Gift },
    { label: 'API', icon: Code2 },
    { label: 'Pengaturan', icon: Settings },
];

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Kelompokkan pesanan ke 7 hari kalender terakhir (dari yang terlama), buat
// grafik "Aktivitas 7 Hari Terakhir" di tab Pesanan.
function getDailyOrderCounts(orders, now, days = 7) {
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const value = orders.filter(
            (o) => o.timestamp >= dayStart.getTime() && o.timestamp < dayEnd.getTime()
        ).length;
        buckets.push({ label: WEEKDAY_LABELS[dayStart.getDay()], value });
    }
    return buckets;
}

function countInRange(orders, startMs, endMs) {
    return orders.filter((o) => o.timestamp >= startMs && o.timestamp < endMs).length;
}

function formatRupiah(value) {
    return `Rp ${value.toLocaleString('id-ID')}`;
}


// --- API Key ---
// Sementara di-generate & disimpan di client (localStorage) buat kebutuhan
// tampilan UI. Validasi & scoping key yang sesungguhnya WAJIB ditangani di
// server begitu backend-nya ada — key yang cuma tersimpan di localStorage
// seperti ini TIDAK aman dipakai sebagai credential produksi.
const API_KEY_STORAGE_KEY = 'suntik_api_key';

function generateApiKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'suntik_live_';
    for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
}

function loadOrCreateApiKey() {
    if (typeof window === 'undefined') return '';
    try {
        const existing = window.localStorage.getItem(API_KEY_STORAGE_KEY);
        if (existing) return existing;
        const fresh = generateApiKey();
        window.localStorage.setItem(API_KEY_STORAGE_KEY, fresh);
        return fresh;
    } catch {
        return generateApiKey();
    }
}

function maskApiKey(key) {
    if (!key) return '';
    const prefix = key.slice(0, 12); // "suntik_live_"
    return `${prefix}${'•'.repeat(Math.max(key.length - prefix.length, 0))}`;
}

// --- Broadcast dari admin ---
// Dibaca dari localStorage yang sama dipakai BroadcastManager di panel admin.
// Ini cuma jalan kalau admin & pelanggan buka di browser yang sama (buat demo) —
// begitu backend ada, ganti jadi tabel `notifications` yang di-fetch dari server.
const BROADCAST_STORAGE_KEY = 'suntik_broadcasts';
const BROADCAST_SEEN_KEY = 'suntik_broadcasts_seen_at';

const BROADCAST_TIPE_STYLE = {
    Info: { icon: Info, style: 'bg-blue-500/10 text-blue-400' },
    Promo: { icon: Tag, style: 'bg-[#B9FF66]/10 text-[#B9FF66]' },
    Peringatan: { icon: AlertTriangle, style: 'bg-red-500/10 text-red-400' },
};

function loadBroadcasts() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(BROADCAST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function formatBroadcastTanggal(timestamp) {
    const date = new Date(timestamp);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month}, ${hh}:${mm}`;
}

// Ubah satu baris dari tabel `orders` (Supabase) jadi bentuk yang dipakai
// komponen UI (RiwayatPesananSection, StatCard, grafik, dll) — dipakai pas
// load awal maupun pas nambah pesanan baru.
function mapOrderRow(row) {
    return {
        id: row.provider_order_id ? `ORD-${row.provider_order_id}` : row.id,
        dbId: row.id,
        providerOrderId: row.provider_order_id,
        layanan: row.layanan,
        platform: row.platform,
        target: row.target,
        jumlah: row.jumlah,
        harga: Number(row.harga),
        status: row.status,
        refunded: row.refunded,
        timestamp: new Date(row.created_at).getTime(),
    };
}

const StatCard = ({ icon: Icon, label, value, trend }) => (
    <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#B9FF66] flex items-center justify-center">
                <Icon className="w-5 h-5 text-black" />
            </div>
            {trend && (
                <span className="text-xs font-medium text-[#B9FF66] flex items-center gap-1">
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

const UsageChart = ({ data, type = 'area', color = '#B9FF66', formatValue = (v) => v }) => {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 900, height: 220 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setSize({ width: rect.width, height: rect.height });
            }
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { width, height } = size;
    const padding = { top: 16, right: 12, bottom: 28, left: 48 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const niceMax = maxVal * 1.2;
    const bandW = chartW / data.length;

    const xFor = (i) => padding.left + bandW * (i + 0.5);
    const yFor = (v) => padding.top + chartH - (v / niceMax) * chartH;
    const baseY = padding.top + chartH;

    const points = data.map((d, i) => [xFor(i), yFor(d.value)]);
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1][0]},${baseY} L ${points[0][0]},${baseY} Z`;

    const gridFractions = [0, 0.33, 0.66, 1];
    const gradId = `usageGrad-${color.replace('#', '')}`;
    const last = data[data.length - 1];

    return (
        <div ref={containerRef} className="w-full h-56 sm:h-64 lg:h-72">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block">
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {gridFractions.map((f) => {
                    const y = padding.top + chartH * (1 - f);
                    return (
                        <g key={f}>
                            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.06" />
                            <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#8a8a8a">
                                {formatValue(niceMax * f)}
                            </text>
                        </g>
                    );
                })}

                {type === 'bar'
                    ? data.map((d, i) => {
                        const barW = bandW * 0.44;
                        const y = yFor(d.value);
                        return (
                            <rect
                                key={i}
                                x={xFor(i) - barW / 2}
                                y={y}
                                width={barW}
                                height={Math.max(baseY - y, 2)}
                                rx={5}
                                fill={i === data.length - 1 ? color : `${color}99`}
                            />
                        );
                    })
                    : (
                        <>
                            <path d={areaPath} fill={`url(#${gradId})`} />
                            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                            {points.map((p, i) => (
                                <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4.5 : 0} fill={color} />
                            ))}
                        </>
                    )}

                {data.map((d, i) => (
                    <text key={d.label} x={xFor(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="#8a8a8a">
                        {d.label}
                    </text>
                ))}

                <text x={points[points.length - 1][0]} y={yFor(last.value) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>
                    {formatValue(last.value)}
                </text>
            </svg>
        </div>
    );
};

export default function DashboardPage() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [broadcasts, setBroadcasts] = useState([]);
    const [hasUnseenBroadcast, setHasUnseenBroadcast] = useState(false);
    const profileMenuRef = useRef(null);
    const notifRef = useRef(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Overview');
    const [usageTab, setUsageTab] = useState('pesanan'); // 'saldo' | 'pesanan'
    const [historyNow, setHistoryNow] = useState(Date.now());

    const [referralCode, setReferralCode] = useState('');
    const [referredCount, setReferredCount] = useState(0);
    const [komisiPersen, setKomisiPersen] = useState(null);
    const [komisiBalance, setKomisiBalance] = useState(0);
    const [claimingKomisi, setClaimingKomisi] = useState(false);
    const [claimError, setClaimError] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [referralCopied, setReferralCopied] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [apiKeyCopied, setApiKeyCopied] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [balance, setBalance] = useState(0);
    const [orders, setOrders] = useState([]);

    // --- Pengaturan: profil & password lewat Supabase; notifikasi masih lokal ---
    const [settingsName, setSettingsName] = useState('');
    const [settingsEmail, setSettingsEmail] = useState('');
    const [settingsNewPassword, setSettingsNewPassword] = useState('');
    const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    const [settingsSuccess, setSettingsSuccess] = useState('');

    // Auth guard pakai session Supabase beneran. Kalau belum login, tendang
    // ke /login sebelum dashboard sempat ke-render. Profil, saldo, dan
    // pesanan sekarang dibaca dari database (tabel profiles & orders) — cuma
    // API key (tab "API") yang masih sengaja dibiarkan localStorage/demo.
    const [authChecked, setAuthChecked] = useState(false);
    useEffect(() => {
        let mounted = true;

        async function init() {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email, balance, referral_code, komisi_balance, status')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!mounted) return;

            // Akun yang di-suspend admin gak boleh bisa pakai dashboard sama
            // sekali — sign out paksa & tendang ke /login, bukan cuma
            // ditampilin badge doang kayak sebelumnya.
            if (profile?.status === 'Suspend') {
                await supabase.auth.signOut();
                if (!mounted) return;
                router.push('/login?suspended=1');
                return;
            }

            setSettingsName(profile?.full_name || '');
            setSettingsEmail(profile?.email || session.user.email || '');
            setBalance(Number(profile?.balance) || 0);
            setReferralCode(profile?.referral_code || '');
            setKomisiBalance(Number(profile?.komisi_balance) || 0);
            setApiKey(loadOrCreateApiKey());

            const { count: referredTotal } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('referred_by', session.user.id);
            setReferredCount(referredTotal || 0);
            setKomisiPersen(await loadReferralKomisiPersen());

            const { data: orderRows } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (!mounted) return;
            setOrders((orderRows || []).map(mapOrderRow));

            // Sync status ke provider di background — gak nunggu ini kelar
            // buat nampilin dashboard duluan. Kalau ada yang berubah, ambil
            // ulang biar tabel Riwayat Pesanan langsung kekinian tanpa perlu
            // pelanggan refresh manual.
            fetch('/api/orders/sync', { method: 'POST' })
                .then((res) => res.json())
                .then((data) => {
                    if (!mounted || !data.updated || data.updated.length === 0) return null;
                    return supabase.from('orders').select('*').order('created_at', { ascending: false });
                })
                .then((res) => {
                    if (mounted && res?.data) setOrders(res.data.map(mapOrderRow));
                })
                .catch((err) => console.error('Gagal sync status pesanan:', err.message));

            const loaded = loadBroadcasts();
            setBroadcasts(loaded);
            if (loaded.length > 0) {
                const seenAt = Number(localStorage.getItem(BROADCAST_SEEN_KEY) || 0);
                setHasUnseenBroadcast(loaded[0].timestamp > seenAt);
            }

            setAuthChecked(true);
        }

        init();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tandai semua broadcast sudah dilihat begitu dropdown notifikasi dibuka.
    useEffect(() => {
        if (notifOpen && hasUnseenBroadcast) {
            localStorage.setItem(BROADCAST_SEEN_KEY, String(Date.now()));
            setHasUnseenBroadcast(false);
        }
    }, [notifOpen, hasUnseenBroadcast]);

    useEffect(() => {
        if (referralCode && typeof window !== 'undefined') {
            setReferralLink(`${window.location.origin}/register?ref=${referralCode}`);
        }
    }, [referralCode]);

    // Tutup dropdown notifikasi/profil kalau klik di luar.
    useEffect(() => {
        function handleClickOutside(e) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const tick = setInterval(() => setHistoryNow(Date.now()), 30000);
        return () => clearInterval(tick);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Ubah saldo lewat RPC di database (deduct_balance / add_balance) — dua
    // fungsi itu ngecek & update balance secara atomik di server, jadi gak
    // bisa dicurangi lewat DevTools kayak kalau saldo cuma disimpen di client.
    async function adjustBalance(delta) {
        const rpcName = delta < 0 ? 'deduct_balance' : 'add_balance';
        const { data, error } = await supabase.rpc(rpcName, { amount: Math.abs(delta) });
        if (error) {
            console.error('Gagal update saldo:', error.message);
            return;
        }
        setBalance(Number(data));
    }

    async function handleClaimKomisi() {
        setClaimError('');
        setClaimingKomisi(true);
        const { data, error } = await supabase.rpc('claim_komisi_balance');
        setClaimingKomisi(false);

        if (error) {
            setClaimError(error.message);
            setTimeout(() => setClaimError(''), 4000);
            return;
        }

        setBalance(Number(data));
        setKomisiBalance(0);
    }

    // Dipanggil OrderForm begitu pesanan beneran berhasil dibuat di provider.
    // Status awal "Pending" — bakal ke-update otomatis ke status asli
    // (Diproses/Selesai/Gagal) lewat /api/orders/sync yang jalan tiap
    // dashboard dibuka (lihat useEffect init() di atas).
    async function handleOrderSuccess(order) {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                provider_order_id: order.providerOrderId ? String(order.providerOrderId) : null,
                layanan: order.layanan,
                platform: order.platform,
                target: order.target,
                jumlah: order.jumlah,
                harga: order.harga,
                status: 'Pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Gagal menyimpan pesanan:', error.message);
            return;
        }

        setOrders((prev) => [mapOrderRow(data), ...prev]);
    }

    const handleCopyReferral = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setReferralCopied(true);
        setTimeout(() => setReferralCopied(false), 1500);
    };

    const handleCopyApiKey = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setApiKeyCopied(true);
        setTimeout(() => setApiKeyCopied(false), 1500);
    };

    const handleRegenerateApiKey = () => {
        if (typeof window === 'undefined') return;
        const ok = window.confirm('Buat API key baru? Key lama akan langsung berhenti berfungsi.');
        if (!ok) return;
        setRegenerating(true);
        const fresh = generateApiKey();
        try {
            window.localStorage.setItem(API_KEY_STORAGE_KEY, fresh);
        } catch {
            // localStorage penuh/diblokir — key tetap dipakai untuk sesi ini saja
        }
        setApiKey(fresh);
        setApiKeyVisible(true);
        setTimeout(() => setRegenerating(false), 400);
    };

    const handleSaveSettings = async () => {
        setSettingsError('');
        setSettingsSuccess('');

        if (settingsNewPassword || settingsConfirmPassword) {
            if (settingsNewPassword.length < 6) {
                setSettingsError('Password baru minimal 6 karakter.');
                return;
            }
            if (settingsNewPassword !== settingsConfirmPassword) {
                setSettingsError('Konfirmasi password tidak cocok.');
                return;
            }
        }

        setSettingsSaving(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: settingsName })
            .eq('id', user?.id);

        let authError = null;
        if (settingsNewPassword) {
            const { error } = await supabase.auth.updateUser({ password: settingsNewPassword });
            authError = error;
        }

        setSettingsSaving(false);

        if (profileError || authError) {
            setSettingsError((profileError || authError).message);
            return;
        }

        setSettingsSuccess('Perubahan tersimpan.');
        setSettingsNewPassword('');
        setSettingsConfirmPassword('');
    };

    // --- Statistik dari data dummy ---
    const completedOrders = orders.filter((o) => o.status === 'Selesai');
    const activeOrders = orders.filter((o) => o.status === 'Diproses' || o.status === 'Pending');
    const orderDailyCounts = getDailyOrderCounts(completedOrders, historyNow, 7);
    const orderWeekTotal = orderDailyCounts.reduce((sum, d) => sum + d.value, 0);
    const orderWeekAvg = orderDailyCounts.length ? Math.round(orderWeekTotal / orderDailyCounts.length) : 0;

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const thisWeekCount = countInRange(completedOrders, historyNow - weekMs, historyNow);
    const prevWeekCount = countInRange(completedOrders, historyNow - 2 * weekMs, historyNow - weekMs);
    const orderTrendPct =
        prevWeekCount > 0 ? Math.round(((thisWeekCount - prevWeekCount) / prevWeekCount) * 100) : null;

    const platformsUsedCount = new Set(orders.map((o) => o.platform).filter(Boolean)).size;

    // Jangan render dashboard sama sekali sampai kepastian status login jelas —
    // ini yang mastiin gak ada "flash" isi dashboard sebelum redirect ke /login.
    if (!authChecked) {
        return <div className="bg-[#111111] min-h-screen" />;
    }

    return (
        <div className="bg-[#111111] min-h-screen text-white flex">
            {/* Sidebar - desktop */}
            <aside className="hidden lg:flex lg:w-72 flex-col border-r border-white/10 p-6 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2 mb-10">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">
                        SuntikSosmed<span className="text-[#B9FF66]">.</span>
                    </span>
                </Link>

                <nav className="flex flex-col gap-1">
                    {navItems.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            onClick={() => setActiveMenu(label)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeMenu === label ? 'bg-[#B9FF66] text-black' : 'text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto">
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
                        <div className="flex items-center justify-between mb-10">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <Asterisk className="w-8 h-8 text-white" />
                                <span className="text-2xl font-bold tracking-tight">
                                    SuntikSosmed<span className="text-[#B9FF66]">.</span>
                                </span>
                            </Link>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-1">
                            {navItems.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    onClick={() => {
                                        setActiveMenu(label);
                                        setSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-left ${activeMenu === label ? 'bg-[#B9FF66] text-black' : 'text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                        <div className="mt-auto">
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
                {/* Topbar */}
                <header className="flex items-center justify-between px-6 lg:px-10 py-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">
                                {activeMenu === 'Overview'
                                    ? `Halo, ${settingsName ? settingsName.split(' ')[0] : 'kamu'} 👋`
                                    : activeMenu}
                            </h1>
                            <p className="text-gray-400 text-sm hidden md:block">
                                {activeMenu === 'Overview'
                                    ? 'Ini ringkasan aktivitas akun kamu hari ini.'
                                    : activeMenu === 'Pesan Layanan'
                                        ? 'Pesan followers, likes, views, dan layanan lainnya di sini.'
                                        : activeMenu === 'Riwayat Pesanan'
                                            ? 'Semua pesanan yang pernah kamu buat.'
                                            : activeMenu === 'Saldo & Deposit'
                                                ? 'Kelola saldo dan lihat riwayat transaksi kamu.'
                                                : activeMenu === 'Tiket'
                                                    ? 'Butuh bantuan? Buat tiket dan tim kami akan membalas secepatnya.'
                                                    : activeMenu === 'Daftar Layanan'
                                                        ? 'Lihat semua layanan dan harga yang tersedia.'
                                                        : activeMenu === 'Berita'
                                                            ? 'Update dan pengumuman terbaru dari SuntikSosmed.'
                                                            : activeMenu === 'Referral'
                                                                ? 'Ajak teman pakai SuntikSosmed dan dapatkan komisi.'
                                                                : activeMenu === 'API'
                                                                    ? 'Kelola API key untuk integrasi ke sistem kamu sendiri.'
                                                                    : activeMenu === 'Pengaturan'
                                                                        ? 'Kelola profil, keamanan, dan preferensi akun.'
                                                                        : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => {
                                    setNotifOpen((o) => !o);
                                    setProfileMenuOpen(false);
                                }}
                                className="relative w-10 h-10 rounded-full bg-[#191A19] border border-white/10 flex items-center justify-center hover:border-[#B9FF66] transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                {hasUnseenBroadcast && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
                                )}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-[#191A19] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/10 font-medium text-sm">Notifikasi</div>
                                    {broadcasts.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-500">Belum ada notifikasi.</div>
                                    ) : (
                                        <div className="max-h-80 overflow-y-auto">
                                            {broadcasts.map((b) => {
                                                const tipeInfo = BROADCAST_TIPE_STYLE[b.tipe] || BROADCAST_TIPE_STYLE.Info;
                                                const TipeIcon = tipeInfo.icon;
                                                return (
                                                    <div key={b.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${tipeInfo.style}`}>
                                                            <TipeIcon className="w-3.5 h-3.5" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{b.judul}</p>
                                                            <p className="text-gray-400 text-xs mt-0.5">{b.isi}</p>
                                                            <p className="text-gray-600 text-xs mt-1">{formatBroadcastTanggal(b.timestamp)}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => {
                                    setProfileMenuOpen((o) => !o);
                                    setNotifOpen(false);
                                }}
                                className="w-10 h-10 rounded-full bg-[#B9FF66] flex items-center justify-center text-black font-bold hover:opacity-90 transition-opacity"
                            >
                                {settingsName ? settingsName.trim().charAt(0).toUpperCase() : 'U'}
                            </button>
                            {profileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#191A19] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <p className="text-sm font-medium truncate">{settingsName || 'Akun'}</p>
                                        <p className="text-xs text-gray-500 truncate">{settingsEmail}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveMenu('Pengaturan');
                                            setProfileMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" /> Pengaturan
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Keluar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-6 lg:p-10 flex flex-col gap-8">
                    {activeMenu === 'Pesan Layanan' ? (
                        <OrderForm
                            balance={balance}
                            onBalanceUpdated={(newBalance) => setBalance(Number(newBalance))}
                            onOrderSuccess={handleOrderSuccess}
                        />
                    ) : activeMenu === 'Riwayat Pesanan' ? (
                        <RiwayatPesananSection orders={orders} historyNow={historyNow} />
                    ) : activeMenu === 'Saldo & Deposit' ? (
                        <SaldoSection balance={balance} onAddBalance={(amount) => adjustBalance(amount)} />
                    ) : activeMenu === 'Tiket' ? (
                        <TiketSection />
                    ) : activeMenu === 'Daftar Layanan' ? (
                        <DaftarLayananSection />
                    ) : activeMenu === 'Berita' ? (
                        <BeritaSection />
                    ) : activeMenu === 'Referral' ? (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-[#B9FF66]" />
                                    Ajak Teman, Dapatkan Komisi
                                </h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Bagikan kode atau link referral kamu. Setiap teman yang daftar lewat link kamu otomatis
                                    kehitung di sini. Komisi referral saat ini{' '}
                                    <span className="text-[#B9FF66] font-medium">{komisiPersen ?? '...'}%</span> dari deposit
                                    pertama teman kamu.
                                </p>

                                <label className="text-sm text-gray-400 mb-1.5 block">Kode referral kamu</label>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 font-mono font-bold tracking-widest text-[#B9FF66]">
                                        {referralCode || '...'}
                                    </div>
                                </div>

                                <label className="text-sm text-gray-400 mb-1.5 block">Link referral</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 truncate">
                                        {referralLink || '...'}
                                    </div>
                                    <button
                                        onClick={handleCopyReferral}
                                        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl transition-colors ${referralCopied ? 'bg-[#B9FF66] text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                                            }`}
                                    >
                                        {referralCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {referralCopied ? 'Tersalin' : 'Salin'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 lg:gap-6">
                                <StatCard icon={Users} label="Teman diajak" value={String(referredCount)} />
                                <StatCard icon={Wallet} label="Komisi didapat" value={formatRupiah(komisiBalance)} />
                            </div>

                            {claimError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                                    {claimError}
                                </div>
                            )}

                            {komisiBalance > 0 && (
                                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <p className="text-sm font-medium">Saldo komisi: {formatRupiah(komisiBalance)}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {komisiBalance >= 10000
                                                ? 'Udah bisa ditarik ke saldo utama, langsung bisa dipakai buat pesan layanan.'
                                                : `Minimal Rp 10.000 buat ditarik (kurang ${formatRupiah(10000 - komisiBalance)} lagi).`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClaimKomisi}
                                        disabled={komisiBalance < 10000 || claimingKomisi}
                                        className="flex items-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#a0e655] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {claimingKomisi ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                                        {claimingKomisi ? 'Memproses...' : 'Tarik ke Saldo Utama'}
                                    </button>
                                </div>
                            )}

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-bold mb-3">Cara kerja</h3>
                                <ol className="text-sm text-gray-400 flex flex-col gap-2 list-decimal list-inside">
                                    <li>Bagikan kode atau link referral di atas ke teman kamu.</li>
                                    <li>Teman kamu daftar akun baru pakai link itu — otomatis kehitung di "Teman diajak" di atas.</li>
                                    <li>
                                        Begitu deposit pertama mereka berhasil (QRIS otomatis atau Manual yang udah dikonfirmasi
                                        admin), kamu otomatis dapat komisi {komisiPersen ?? '...'}% dari nominal itu.
                                    </li>
                                    <li>Komisi kekumpul dulu di "Saldo komisi" — begitu udah minimal Rp 10.000, tinggal klik "Tarik ke Saldo Utama".</li>
                                </ol>
                            </div>
                        </div>
                    ) : activeMenu === 'API' ? (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold mb-2 flex items-center gap-2 flex-wrap">
                                    <Code2 className="w-5 h-5 text-[#B9FF66]" />
                                    API Key
                                    <span className="text-[10px] font-medium tracking-wide uppercase bg-[#FFB800]/10 text-[#FFB800] px-2 py-0.5 rounded-full">
                                        Akan Datang
                                    </span>
                                </h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Pakai key ini untuk akses layanan SuntikSosmed langsung dari sistem atau bot kamu sendiri.
                                    Jangan bagikan key ini ke siapa pun.
                                </p>

                                <label className="text-sm text-gray-400 mb-1.5 block">Key kamu</label>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-gray-200 truncate">
                                        {apiKeyVisible ? apiKey : maskApiKey(apiKey)}
                                    </div>
                                    <button
                                        disabled
                                        title="Belum aktif"
                                        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white opacity-40 cursor-not-allowed"
                                    >
                                        {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        disabled
                                        title="Belum aktif"
                                        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white/10 text-white opacity-40 cursor-not-allowed"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Salin
                                    </button>
                                </div>

                                <button
                                    disabled
                                    title="Belum aktif"
                                    className="flex items-center gap-2 text-xs font-medium text-red-300 opacity-40 cursor-not-allowed"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Buat key baru
                                </button>
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                    <Code2 className="w-4 h-4 text-[#B9FF66]" />
                                    Contoh penggunaan
                                </h3>
                                <pre className="bg-[#111111] border border-white/10 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto">
                                    {`curl https://suntiksosmed.store/api/v1/order \\
  -H "Authorization: Bearer ${apiKeyVisible ? apiKey : 'API_KEY_KAMU'}" \\
  -H "Content-Type: application/json" \\
  -d '{"layanan": 123, "target": "https://instagram.com/username", "jumlah": 1000}'`}
                                </pre>
                                <p className="text-xs text-gray-500 mt-3">
                                    Dokumentasi endpoint & response lengkap akan menyusul. Jaga API key kamu — kalau bocor, segera
                                    buat key baru.
                                </p>
                            </div>
                        </div>
                    ) : activeMenu === 'Pengaturan' ? (
                        <div className="flex flex-col gap-6 max-w-2xl">
                            {settingsError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                                    {settingsError}
                                </div>
                            )}
                            {settingsSuccess && (
                                <div className="bg-[#B9FF66]/10 border border-[#B9FF66]/30 text-[#B9FF66] text-sm rounded-xl px-4 py-3">
                                    {settingsSuccess}
                                </div>
                            )}

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#B9FF66]" />
                                    Profil Akun
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1.5 block">Nama</label>
                                        <input
                                            type="text"
                                            value={settingsName}
                                            onChange={(e) => setSettingsName(e.target.value)}
                                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                                        <input
                                            type="email"
                                            value={settingsEmail}
                                            readOnly
                                            disabled
                                            title="Email gak bisa diganti dari sini. Hubungi admin kalau perlu diubah."
                                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            Email gak bisa diganti sendiri. Hubungi admin kalau perlu diubah.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-[#B9FF66]" />
                                    Keamanan
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1.5 block">Password baru</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={settingsNewPassword}
                                            onChange={(e) => setSettingsNewPassword(e.target.value)}
                                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400 mb-1.5 block">Konfirmasi password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={settingsConfirmPassword}
                                            onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={settingsSaving}
                                className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors self-start disabled:opacity-60"
                            >
                                <Save className="w-4 h-4" />
                                {settingsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Kartu statistik — masih dari data dummy di atas, ganti begitu backend ada */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                <StatCard icon={Wallet} label="Saldo aktif" value={formatRupiah(balance)} />
                                <StatCard icon={ShoppingCart} label="Pesanan aktif" value={activeOrders.length} />
                                <StatCard
                                    icon={CheckCircle2}
                                    label="Pesanan selesai"
                                    value={completedOrders.length}
                                    trend={orderTrendPct !== null ? `${orderTrendPct > 0 ? '+' : ''}${orderTrendPct}%` : undefined}
                                />
                                <StatCard icon={Users} label="Platform digunakan" value={platformsUsedCount} />
                            </div>

                            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold">Aktivitas 7 Hari Terakhir</h2>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                            {usageTab === 'saldo'
                                                ? 'Riwayat saldo akan muncul di sini setelah ada transaksi.'
                                                : orderWeekTotal > 0
                                                    ? `${orderWeekTotal} pesanan selesai minggu ini, rata-rata ${orderWeekAvg} per hari`
                                                    : 'Belum ada pesanan selesai minggu ini.'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#111111] border border-white/10 rounded-xl p-1 self-start">
                                        <button
                                            onClick={() => setUsageTab('saldo')}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${usageTab === 'saldo' ? 'bg-[#B9FF66] text-black' : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Saldo
                                        </button>
                                        <button
                                            onClick={() => setUsageTab('pesanan')}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${usageTab === 'pesanan' ? 'bg-[#B9FF66] text-black' : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Pesanan
                                        </button>
                                    </div>
                                </div>

                                {usageTab === 'saldo' ? (
                                    <div className="w-full h-56 sm:h-64 lg:h-72 flex items-center justify-center text-center text-sm text-gray-500 px-6">
                                        Belum ada riwayat saldo — akan terisi seiring top up dan pemakaian.
                                    </div>
                                ) : (
                                    <UsageChart
                                        data={orderDailyCounts}
                                        type="bar"
                                        color="#B9FF66"
                                        formatValue={(v) => Math.round(v).toString()}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}