'use client';

import { Fragment, useEffect, useState } from 'react';
import { Gift, Search, Loader2, AlertTriangle, RefreshCw, Users, Percent, Save, CheckCircle2, Wallet } from 'lucide-react';
import { formatRupiah } from '../../data/services';

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    return `${dd} ${month} ${date.getFullYear()}`;
}

export default function ReferralManager() {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [komisiPersen, setKomisiPersen] = useState(5);
    const [komisiLoading, setKomisiLoading] = useState(true);
    const [komisiSaved, setKomisiSaved] = useState(false);
    const [komisiSaveError, setKomisiSaveError] = useState('');

    async function load() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/referrals');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat data referral.');
            setSummary(data.summary || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadKomisi() {
        setKomisiLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok && data.settings?.referral_komisi_persen !== undefined) {
                setKomisiPersen(Number(data.settings.referral_komisi_persen));
            }
        } catch {
            // Biarin default kalau gagal.
        } finally {
            setKomisiLoading(false);
        }
    }

    async function handleSaveKomisi(e) {
        e.preventDefault();
        setKomisiSaveError('');
        const res = await fetch('/api/admin/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'referral_komisi_persen', value: komisiPersen }),
        });
        if (res.ok) {
            setKomisiSaved(true);
            setTimeout(() => setKomisiSaved(false), 2500);
        } else {
            const data = await res.json().catch(() => ({}));
            setKomisiSaveError(data.error || 'Gagal menyimpan.');
            setTimeout(() => setKomisiSaveError(''), 4000);
        }
    }

    useEffect(() => {
        load();
        loadKomisi();
    }, []);

    const filtered = summary.filter(
        (s) =>
            !query.trim() ||
            (s.email || '').toLowerCase().includes(query.toLowerCase()) ||
            (s.referralCode || '').toLowerCase().includes(query.toLowerCase())
    );

    const totalTemanDiajak = summary.reduce((sum, s) => sum + s.temanDiajak, 0);
    const totalKomisi = summary.reduce((sum, s) => sum + s.komisiBalance, 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Referral</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Data asli dari kode referral pengguna. Kode referral otomatis dibuat pas daftar; "teman diajak" kehitung
                kalau orangnya daftar lewat link <span className="font-mono">/register?ref=KODE</span> milik pengguna itu.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center gap-4 w-fit">
                    <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#FFB800]" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Total Teman Diajak (semua pengguna)</p>
                        <p className="text-xl font-bold">{loading ? '...' : totalTemanDiajak}</p>
                    </div>
                </div>

                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center gap-4 w-fit">
                    <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[#FFB800]" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Total Komisi (semua pengguna)</p>
                        <p className="text-xl font-bold text-[#FFB800]">{loading ? '...' : formatRupiah(totalKomisi)}</p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSaveKomisi}
                className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
            >
                <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#FFB800]" />
                    <h3 className="text-sm font-bold">Komisi Referral</h3>
                </div>
                <p className="text-sm text-gray-400 -mt-2">
                    Persentase komisi yang didapat pengguna dari deposit pertama teman yang mereka ajak. Sekarang
                    perhitungannya sudah otomatis (komisi langsung masuk ke saldo komisi pengguna pas teman yang
                    diajak deposit pertama kali) — nilai di sini cuma buat pengaturan persentasenya.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-32">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={komisiLoading}
                            value={komisiPersen}
                            onChange={(e) => setKomisiPersen(Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] disabled:opacity-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <button
                        type="submit"
                        disabled={komisiLoading}
                        className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 ${komisiSaved ? 'bg-[#FFB800]/80 text-black' : 'bg-[#FFB800] text-black hover:bg-[#e6a600]'
                            }`}
                    >
                        {komisiSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {komisiSaved ? 'Tersimpan!' : 'Simpan'}
                    </button>
                    {komisiSaveError && (
                        <span className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {komisiSaveError}
                        </span>
                    )}
                </div>
            </form>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari email atau kode referral..."
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
                    <p className="text-sm text-gray-400">Memuat data referral...</p>
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
                                    <th className="px-6 py-3 font-medium">Pengguna</th>
                                    <th className="px-6 py-3 font-medium">Kode Referral</th>
                                    <th className="px-6 py-3 font-medium">Teman Diajak</th>
                                    <th className="px-6 py-3 font-medium">Komisi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => (
                                    <Fragment key={s.id}>
                                        <tr
                                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                                            className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="font-medium">{s.fullName || '(Belum diisi)'}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">{s.email}</p>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-gray-300">{s.referralCode}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-[#FFB800] font-bold">{s.temanDiajak}</span>
                                                <span className="text-gray-500"> orang</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                {formatRupiah(s.komisiBalance)}
                                            </td>
                                        </tr>
                                        {expandedId === s.id && s.temanDiajak > 0 && (
                                            <tr className="bg-[#111111]">
                                                <td colSpan={4} className="px-6 py-4">
                                                    <p className="text-xs text-gray-500 mb-2">Diajak lewat kode ini:</p>
                                                    <div className="flex flex-col gap-1.5">
                                                        {s.temanList.map((t, i) => (
                                                            <div key={i} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-300">{t.email}</span>
                                                                <span className="text-gray-500 text-xs">{formatTanggal(t.createdAt)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            Tidak ada yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}