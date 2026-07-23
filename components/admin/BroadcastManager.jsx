'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Send, Info, Tag, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

const TIPE_OPTIONS = [
    { value: 'Info', icon: Info, style: 'bg-blue-500/10 text-blue-400' },
    { value: 'Promo', icon: Tag, style: 'bg-[#FFB800]/10 text-[#FFB800]' },
    { value: 'Peringatan', icon: AlertTriangle, style: 'bg-red-500/10 text-red-400' },
];

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month}, ${hh}:${mm}`;
}

export default function BroadcastManager() {
    const [judul, setJudul] = useState('');
    const [isi, setIsi] = useState('');
    const [tipe, setTipe] = useState('Info');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    async function load() {
        setLoading(true);
        setLoadError('');
        try {
            const res = await fetch('/api/admin/broadcasts');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat broadcast.');
            setBroadcasts(data.broadcasts || []);
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!judul.trim() || !isi.trim()) {
            setError('Judul dan isi pengumuman wajib diisi.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ judul: judul.trim(), isi: isi.trim(), tipe }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal mengirim broadcast.');

            setBroadcasts((prev) => [data.broadcast, ...prev]);
            setJudul('');
            setIsi('');
            setTipe('Info');
            setSent(true);
            setTimeout(() => setSent(false), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const prev = broadcasts;
        setBroadcasts((b) => b.filter((x) => x.id !== id));
        try {
            const res = await fetch(`/api/admin/broadcasts?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal menghapus broadcast.');
        } catch (err) {
            setBroadcasts(prev);
            setError(err.message);
        }
    }

    return (
        <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Broadcast Pengumuman</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Kirim pengumuman yang bakal muncul di lonceng notifikasi semua pelanggan. Tersimpan di database
                Supabase, langsung tampil ke semua pengguna.
            </p>

            <form onSubmit={handleSubmit} className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Tipe</label>
                    <div className="flex gap-2">
                        {TIPE_OPTIONS.map(({ value, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setTipe(value)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${tipe === value
                                    ? 'bg-[#FFB800] text-black border-[#FFB800]'
                                    : 'bg-[#111111] text-gray-300 border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {value}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Judul</label>
                    <input
                        type="text"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        placeholder="Contoh: Maintenance server malam ini"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Isi Pengumuman</label>
                    <textarea
                        value={isi}
                        onChange={(e) => setIsi(e.target.value)}
                        rows={4}
                        placeholder="Tulis isi pengumuman di sini..."
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#e6a600] transition-colors disabled:opacity-60"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Mengirim...' : sent ? 'Terkirim' : 'Kirim ke Semua Pengguna'}
                </button>
            </form>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-sm font-bold">Riwayat Broadcast</h3>
                </div>
                {loading ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                        <p className="text-sm text-gray-500">Memuat broadcast...</p>
                    </div>
                ) : loadError ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <p className="text-sm text-red-400">{loadError}</p>
                    </div>
                ) : broadcasts.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada pengumuman yang dikirim.</div>
                ) : (
                    <div className="flex flex-col">
                        {broadcasts.map((b) => {
                            const tipeInfo = TIPE_OPTIONS.find((t) => t.value === b.tipe) || TIPE_OPTIONS[0];
                            return (
                                <div key={b.id} className="flex items-start justify-between gap-4 px-6 py-4 border-b border-white/5 last:border-0">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${tipeInfo.style}`}>
                                            {b.tipe}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{b.judul}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{b.isi}</p>
                                            <p className="text-gray-600 text-xs mt-1">{formatTanggal(b.created_at)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(b.id)} className="text-gray-500 hover:text-red-400 shrink-0">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}