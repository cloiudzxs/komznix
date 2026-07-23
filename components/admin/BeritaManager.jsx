'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Send, Megaphone, Trash2, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { renderBeritaContent } from '../../data/beritaFormat';

const TIPE_STYLE = 'bg-[#FFB800]/10 text-[#FFB800]';

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month}, ${hh}:${mm}`;
}

export default function BeritaManager() {
    const [judul, setJudul] = useState('');
    const [isi, setIsi] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [berita, setBerita] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    async function load() {
        setLoading(true);
        setLoadError('');
        try {
            const res = await fetch('/api/admin/berita');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat berita.');
            setBerita(data.berita || []);
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
            setError('Judul dan isi berita wajib diisi.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/berita', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ judul: judul.trim(), isi: isi.trim(), tipe: 'Pengumuman' }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal menerbitkan berita.');

            setBerita((prev) => [data.berita, ...prev]);
            setJudul('');
            setIsi('');
            setSent(true);
            setTimeout(() => setSent(false), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const prev = berita;
        setBerita((b) => b.filter((x) => x.id !== id));
        try {
            const res = await fetch(`/api/admin/berita?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal menghapus berita.');
        } catch (err) {
            setBerita(prev);
            setError(err.message);
        }
    }

    return (
        <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Kelola Berita</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Berita ini tampil di halaman "Berita" pada dashboard pelanggan — terpisah dari Broadcast (yang muncul di
                lonceng notifikasi). Cocok buat update/pengumuman yang sifatnya lebih tahan lama, bukan notifikasi
                sekilas.
            </p>

            <form onSubmit={handleSubmit} className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-medium bg-[#FFB800]/10 text-[#FFB800] px-3 py-1.5 rounded-full w-fit">
                    <Megaphone className="w-3.5 h-3.5" />
                    Pengumuman
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Judul</label>
                    <input
                        type="text"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        placeholder="Contoh: Layanan baru: Views YouTube Shorts"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Isi Berita</label>
                    <textarea
                        value={isi}
                        onChange={(e) => setIsi(e.target.value)}
                        rows={12}
                        placeholder="Tulis isi berita di sini... (boleh panjang)"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] resize-y leading-relaxed"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Pisahin paragraf pakai baris kosong (Enter 2x). Buat link pakai format{' '}
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">[teks](https://url)</code> — contoh:{' '}
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                            [Hubungi kami di sini](https://wa.me/6281234567890)
                        </code>
                    </p>
                </div>

                {isi.trim() && (
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                            <Eye className="w-3.5 h-3.5" />
                            Pratinjau (tampilan asli ke pelanggan)
                        </div>
                        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                            {renderBeritaContent(isi)}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#e6a600] transition-colors disabled:opacity-60"
                >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Menerbitkan...' : sent ? 'Terbit' : 'Terbitkan Berita'}
                </button>
            </form>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-sm font-bold">Berita Terbit</h3>
                </div>
                {loading ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                        <p className="text-sm text-gray-500">Memuat berita...</p>
                    </div>
                ) : loadError ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <p className="text-sm text-red-400">{loadError}</p>
                    </div>
                ) : berita.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada berita yang diterbitkan.</div>
                ) : (
                    <div className="flex flex-col">
                        {berita.map((b) => (
                            <div key={b.id} className="flex items-start justify-between gap-4 px-6 py-4 border-b border-white/5 last:border-0">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${TIPE_STYLE}`}>
                                        {b.tipe}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{b.judul}</p>
                                        <p className="text-gray-400 text-xs mt-0.5 whitespace-pre-line line-clamp-3">{b.isi}</p>
                                        <p className="text-gray-600 text-xs mt-1">{formatTanggal(b.created_at)}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(b.id)} className="text-gray-500 hover:text-red-400 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}