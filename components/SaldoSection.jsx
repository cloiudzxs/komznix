'use client';

import { useEffect, useState } from 'react';
import { Wallet, QrCode, Loader2, CheckCircle2, X, Clock, MessageCircle, ExternalLink, Plus, XCircle, ShoppingCart } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

function formatRupiah(value) {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

const NOMINAL_OPTIONS = [10000, 25000, 50000, 100000, 250000, 500000];
const QRIS_DURATION_SECONDS = 15 * 60; // 15 menit, sesuai batas waktu pembayaran QRIS pada umumnya

// Nomor WA admin buat deposit manual. Bisa di-override lewat env var
// NEXT_PUBLIC_ADMIN_WHATSAPP kalau nomornya ganti nanti, tapi defaultnya
// udah diisi biar langsung jalan tanpa perlu setting .env.local dulu.
const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6283843306230';

function formatCountdown(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
        date.getMonth()
    ];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month}, ${hh}:${mm}`;
}

const transactionStatusStyle = {
    Berhasil: 'bg-[#B9FF66]/10 text-[#B9FF66]',
    Kedaluwarsa: 'bg-red-500/10 text-red-400',
    'Menunggu Konfirmasi': 'bg-blue-500/10 text-blue-400',
};

const orderStatusStyle = {
    Selesai: 'bg-[#B9FF66]/10 text-[#B9FF66]',
    Diproses: 'bg-blue-500/10 text-blue-400',
    Pending: 'bg-gray-500/10 text-gray-400',
    Gagal: 'bg-red-500/10 text-red-400',
};

export default function SaldoSection({ balance, onAddBalance }) {
    const [supabase] = useState(() => createClient());
    const [showTopUp, setShowTopUp] = useState(false);
    const [metode, setMetode] = useState('manual'); // 'qris' | 'manual' — default manual, QRIS otomatis belum aktif
    const [step, setStep] = useState('nominal'); // 'nominal' | 'metode' | 'qris' | 'memverifikasi'
    const [selectedNominal, setSelectedNominal] = useState(null);
    const [customNominal, setCustomNominal] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(QRIS_DURATION_SECONDS);
    const [error, setError] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [usageHistory, setUsageHistory] = useState([]);
    const [loadingUsage, setLoadingUsage] = useState(true);
    const [activeHistoryTab, setActiveHistoryTab] = useState('topup'); // 'topup' | 'usage'

    const nominal = selectedNominal ?? (Number(customNominal) || 0);

    async function loadHistory() {
        setLoadingHistory(true);
        const { data } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
        setTransactions(data || []);
        setLoadingHistory(false);
    }

    // Riwayat pemakaian saldo (dari pesanan) — TERPISAH dari Riwayat Transaksi
    // (top up) di atas, sengaja gak digabung. Refund juga sengaja gak
    // ditampilkan di sini (bakal jadi fitur/tampilan sendiri nanti).
    async function loadUsageHistory() {
        setLoadingUsage(true);
        const { data } = await supabase
            .from('orders')
            .select('id, layanan, harga, status, created_at')
            .order('created_at', { ascending: false });
        setUsageHistory(data || []);
        setLoadingUsage(false);
    }

    useEffect(() => {
        loadHistory();
        loadUsageHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Hitung mundur waktu bayar QRIS. Kalau habis, batalkan otomatis kembali ke
    // langkah pilih nominal (modal tetap kebuka) dan catat sebagai transaksi
    // kedaluwarsa.
    useEffect(() => {
        if (step !== 'qris') return;
        if (secondsLeft <= 0) {
            recordDeposit({ nominal, metode: 'QRIS', status: 'Kedaluwarsa' });
            resetForm();
            return;
        }
        const tick = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(tick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, secondsLeft, nominal]);

    async function recordDeposit({ nominal: nom, metode: met, status }) {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('deposits')
            .insert({ user_id: user.id, nominal: nom, metode: met, status })
            .select()
            .single();

        if (data) setTransactions((prev) => [data, ...prev]);
        return data;
    }

    // Reset ke langkah pilih nominal — dipakai buat "Batalkan" & QRIS
    // kedaluwarsa, MODAL TETAP KEBUKA biar bisa langsung coba lagi.
    function resetForm() {
        setStep('nominal');
        setSelectedNominal(null);
        setCustomNominal('');
        setSecondsLeft(QRIS_DURATION_SECONDS);
        setError('');
    }

    // Dipanggil setelah alur top up SELESAI (berhasil dikirim ke admin) —
    // reset form DAN tutup modalnya, biar hasilnya langsung keliatan di
    // tabel Riwayat Transaksi.
    function closeModal() {
        resetForm();
        setShowTopUp(false);
    }

    function handlePilihNominal(value) {
        setSelectedNominal(value);
        setCustomNominal('');
        setError('');
    }

    function handleCustomNominalChange(value) {
        setCustomNominal(value);
        setSelectedNominal(null);
        setError('');
    }

    function handleLanjutNominal() {
        if (!nominal || nominal < 10000) {
            setError('Minimal top up Rp 10.000.');
            return;
        }
        setError('');
        setStep('metode');
    }

    function handleBuatQris() {
        if (!nominal || nominal < 10000) {
            setError('Minimal top up Rp 10.000.');
            return;
        }
        setError('');
        setSecondsLeft(QRIS_DURATION_SECONDS);
        setStep('qris');
    }

    // QRIS otomatis (webhook Paymenku/provider QRIS) BELUM diintegrasikan —
    // jadi buat sementara, "Saya Sudah Bayar" cuma nyatet deposit dengan
    // status "Menunggu Konfirmasi" (sama kayak jalur Manual WhatsApp).
    // Saldo baru beneran nambah setelah admin cek & konfirmasi manual lewat
    // panel Deposit Masuk. JANGAN diubah balik jadi auto-approve di client
    // sebelum webhook provider QRIS asli beneran nyambung — kalau langsung
    // approve di sini, siapa aja bisa klik tombol ini tanpa bayar apa pun
    // dan saldonya nambah gratis.
    async function handleSayaSudahBayar() {
        setStep('memverifikasi');
        await recordDeposit({ nominal, metode: 'QRIS', status: 'Menunggu Konfirmasi' });
        setTimeout(() => {
            closeModal();
        }, 1200);
    }

    // Deposit manual: gak ada verifikasi otomatis — pelanggan diarahkan ke WA
    // admin buat nego/kirim bukti transfer. Baris deposits kesimpen dengan
    // status "Menunggu Konfirmasi", muncul di panel admin (Deposit Masuk),
    // dan saldo baru ditambahin manual sama admin setelah dicek beneran masuk.
    async function handleLanjutWhatsapp() {
        if (!nominal || nominal < 10000) {
            setError('Minimal top up Rp 10.000.');
            return;
        }
        setError('');

        await recordDeposit({ nominal, metode: 'Manual', status: 'Menunggu Konfirmasi' });

        const pesan = [
            'Halo Admin SuntikSosmed \u{1F44B}',
            '',
            'Saya ingin melakukan top up saldo dengan rincian berikut:',
            `\u{1F4B0} Nominal: ${formatRupiah(nominal)}`,
            '',
            'Mohon info rekening/metode pembayarannya ya. Terima kasih \u{1F64F}',
        ].join('\n');
        const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(pesan)}`;
        window.open(url, '_blank');

        closeModal();
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Kartu saldo — kompak: ikon + label + jumlah kiri, tombol Top Up kanan */}
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#B9FF66] flex items-center justify-center shrink-0">
                        <Wallet className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Saldo Kamu</p>
                        <p className="text-3xl font-bold mt-1">{formatRupiah(balance)}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowTopUp(true)}
                    className="flex items-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors self-start md:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    Top Up Saldo
                </button>
            </div>

            {/* Riwayat Transaksi (top up) & Riwayat Pemakaian Saldo — 1 card,
                dipisah lewat tab pill. Refund gak masuk sini, itu bakal jadi
                fitur/tampilan sendiri. */}
            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-lg font-bold">Riwayat</h3>
                    <div className="flex items-center gap-1 bg-[#111111] border border-white/10 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => setActiveHistoryTab('topup')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeHistoryTab === 'topup'
                                ? 'bg-[#B9FF66] text-black'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Top Up ({transactions.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveHistoryTab('usage')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeHistoryTab === 'usage'
                                ? 'bg-[#B9FF66] text-black'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Pemakaian ({usageHistory.length})
                        </button>
                    </div>
                </div>

                {activeHistoryTab === 'topup' ? (
                    loadingHistory ? (
                        <div className="p-10 flex flex-col items-center gap-3 text-center">
                            <Loader2 className="w-6 h-6 text-[#B9FF66] animate-spin" />
                            <p className="text-sm text-gray-500">Memuat riwayat...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-10 text-center text-sm text-gray-500">Belum ada riwayat transaksi.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 text-left border-b border-white/10">
                                        <th className="px-6 py-3 font-medium">Tipe</th>
                                        <th className="px-6 py-3 font-medium hidden sm:table-cell">Metode</th>
                                        <th className="px-6 py-3 font-medium">Jumlah</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium hidden md:table-cell">Waktu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((trx) => (
                                        <tr key={trx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                            <td className="px-6 py-4">
                                                <p className="font-medium flex items-center gap-1.5">
                                                    {trx.status === 'Berhasil' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#B9FF66] shrink-0" />
                                                    ) : trx.status === 'Kedaluwarsa' ? (
                                                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                                    ) : (
                                                        <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                    )}
                                                    Top Up
                                                </p>
                                                <p className="text-gray-500 text-xs mt-0.5 sm:hidden">{trx.metode}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">{trx.metode}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-[#B9FF66] font-bold">+{formatRupiah(trx.nominal)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${transactionStatusStyle[trx.status]}`}
                                                >
                                                    {trx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                {formatTanggal(trx.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : loadingUsage ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-6 h-6 text-[#B9FF66] animate-spin" />
                        <p className="text-sm text-gray-500">Memuat riwayat...</p>
                    </div>
                ) : usageHistory.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada riwayat pemakaian saldo.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-left border-b border-white/10">
                                    <th className="px-6 py-3 font-medium">Layanan</th>
                                    <th className="px-6 py-3 font-medium">Jumlah</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usageHistory.map((o) => (
                                    <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <p className="font-medium flex items-center gap-1.5">
                                                <ShoppingCart className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                {o.layanan}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-0.5 md:hidden">{formatTanggal(o.created_at)}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-red-400 font-bold">-{formatRupiah(o.harga)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${orderStatusStyle[o.status] || 'bg-gray-500/10 text-gray-400'}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 hidden md:table-cell whitespace-nowrap">
                                            {formatTanggal(o.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Top Up */}
            {showTopUp && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => {
                            if (step !== 'memverifikasi') closeModal();
                        }}
                    />
                    <div className="relative w-full max-w-md bg-[#191A19] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Top Up Saldo</h3>
                            {step !== 'memverifikasi' && (
                                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {step === 'nominal' && (
                            <div className="flex flex-col gap-5">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm text-gray-400 mb-2 block">Pilih nominal</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {NOMINAL_OPTIONS.map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => handlePilihNominal(value)}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${selectedNominal === value
                                                    ? 'bg-[#B9FF66] text-black border-[#B9FF66]'
                                                    : 'bg-[#111111] text-gray-300 border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                {formatRupiah(value)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <input
                                    type="number"
                                    value={customNominal}
                                    onChange={(e) => handleCustomNominalChange(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Atau masukkan nominal lain (min. Rp 10.000)"
                                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#B9FF66]"
                                />

                                <button
                                    type="button"
                                    onClick={handleLanjutNominal}
                                    className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors"
                                >
                                    Lanjut
                                </button>
                            </div>
                        )}

                        {step === 'metode' && (
                            <div className="flex flex-col gap-5">
                                <button
                                    type="button"
                                    onClick={() => setStep('nominal')}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors w-fit -mt-2"
                                >
                                    ← Ubah nominal ({formatRupiah(nominal)})
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        disabled
                                        title="QRIS otomatis belum tersedia — payment gateway belum diintegrasikan"
                                        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-[#111111] text-gray-500 opacity-50 cursor-not-allowed"
                                    >
                                        <span className="flex items-center gap-2">
                                            <QrCode className="w-4 h-4" />
                                            QRIS Otomatis
                                        </span>
                                        <span className="text-[10px] font-normal">Belum tersedia</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMetode('manual');
                                            setError('');
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${metode === 'manual'
                                            ? 'bg-[#B9FF66] text-black border-[#B9FF66]'
                                            : 'bg-[#111111] text-gray-300 border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Manual (WhatsApp)
                                    </button>
                                </div>

                                {metode === 'qris' ? (
                                    <p className="text-xs text-gray-500 -mt-2">
                                        Scan lalu klik "Saya Sudah Bayar". Saldo ditambahkan manual oleh admin setelah pembayaran
                                        dicek, jadi belum instan (verifikasi otomatis belum aktif).
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 -mt-2">
                                        Kamu bakal diarahkan ke WhatsApp admin buat kirim bukti transfer. Saldo ditambahkan manual
                                        sama admin setelah pembayaran dicek, jadi gak instan.
                                    </p>
                                )}

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                                        {error}
                                    </div>
                                )}

                                {metode === 'qris' ? (
                                    // Tombol ini sengaja dikasih label generik "Lanjut", bukan "Buat
                                    // Kode QRIS" — soalnya nanti kalau payment gateway asli udah
                                    // disambungin, tombol ini bakal redirect (window.location.href)
                                    // ke halaman pembayaran gateway itu (mirip pola V-Num ke OxaPay),
                                    // bukan nampilin QR internal kayak sekarang.
                                    <button
                                        type="button"
                                        onClick={handleBuatQris}
                                        className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors"
                                    >
                                        Lanjut
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleLanjutWhatsapp}
                                        className="flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#a0e655] transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Lanjut via WhatsApp
                                    </button>
                                )}
                            </div>
                        )}

                        {step === 'qris' && (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-full flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Jumlah bayar</span>
                                    <span className="font-bold text-[#B9FF66]">{formatRupiah(nominal)}</span>
                                </div>

                                {/* Placeholder QR — bukan QR asli, ganti dengan gambar QR dari
                response provider QRIS begitu backend/Paymenku disambungkan. */}
                                <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center">
                                    <QrCode className="w-32 h-32 text-black" strokeWidth={1} />
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    Bayar sebelum{' '}
                                    <span className={secondsLeft < 60 ? 'text-red-400 font-medium' : 'text-white font-medium'}>
                                        {formatCountdown(secondsLeft)}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-500">
                                    Scan kode QR di atas pakai aplikasi e-wallet atau m-banking kamu. Klik "Saya Sudah Bayar"
                                    setelah transfer — saldo ditambahkan manual oleh admin setelah pembayaran dicek.
                                </p>

                                <div className="flex items-center gap-3 w-full mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('metode')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        Batalkan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSayaSudahBayar}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#B9FF66] text-black text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#a0e655] transition-colors"
                                    >
                                        Saya Sudah Bayar
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'memverifikasi' && (
                            <div className="flex flex-col items-center gap-3 py-6 text-center">
                                <Loader2 className="w-8 h-8 text-[#B9FF66] animate-spin" />
                                <p className="text-sm text-gray-400">Mengirim konfirmasi ke admin...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}