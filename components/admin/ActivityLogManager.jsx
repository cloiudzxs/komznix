'use client';

import { useEffect, useState } from 'react';
import { History, Search, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const aksiStyle = {
    'Ubah Status': 'bg-blue-500/10 text-blue-400',
    Refund: 'bg-red-500/10 text-red-400',
    Suspend: 'bg-red-500/10 text-red-400',
    Aktifkan: 'bg-[#FFB800]/10 text-[#FFB800]',
    Balas: 'bg-[#FFB800]/10 text-[#FFB800]',
    Pengaturan: 'bg-purple-500/10 text-purple-400',
};

function formatTanggalLengkap(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month} ${date.getFullYear()}, ${hh}:${mm}`;
}

export default function ActivityLogManager() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [aksiFilter, setAksiFilter] = useState('semua');

    async function load() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/activity-log');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat log.');
            setLogs(data.logs || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const aksiList = Array.from(new Set(logs.map((l) => l.aksi)));

    const filtered = logs.filter((l) => {
        const matchQuery =
            !query.trim() ||
            l.detail.toLowerCase().includes(query.toLowerCase()) ||
            l.admin_email.toLowerCase().includes(query.toLowerCase());
        const matchAksi = aksiFilter === 'semua' || l.aksi === aksiFilter;
        return matchQuery && matchAksi;
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Log Aktivitas</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Jejak audit asli — setiap kali admin ubah status pesanan, refund, suspend/aktifkan pengguna, balas tiket,
                atau ubah pengaturan markup/kurs, otomatis kecatat di sini.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari detail atau email admin..."
                        className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                    />
                </div>
                <select
                    value={aksiFilter}
                    onChange={(e) => setAksiFilter(e.target.value)}
                    className="bg-[#191A19] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                >
                    <option value="semua">Semua Aksi</option>
                    {aksiList.map((a) => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                    ))}
                </select>
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
                    <p className="text-sm text-gray-400">Memuat log...</p>
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
                                    <th className="px-6 py-3 font-medium">Aksi</th>
                                    <th className="px-6 py-3 font-medium">Detail</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Admin</th>
                                    <th className="px-6 py-3 font-medium">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => (
                                    <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${aksiStyle[l.aksi] || 'bg-gray-500/10 text-gray-400'}`}>
                                                {l.aksi}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{l.detail}</td>
                                        <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{l.admin_email}</td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatTanggalLengkap(l.created_at)}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            {logs.length === 0 ? 'Belum ada aktivitas tercatat.' : 'Tidak ada log yang cocok.'}
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