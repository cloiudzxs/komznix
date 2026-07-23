'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Megaphone, Loader2, AlertTriangle } from 'lucide-react';
import { renderBeritaContent } from '../data/beritaFormat';

// Sumber datanya ditulis lewat panel admin "Kelola Berita" -- sekarang
// beneran nyambung ke Supabase (tabel `berita`) lewat /api/berita, bukan
// localStorage lagi.

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${dd} ${month} ${date.getFullYear()}, ${hh}:${mm}`;
}

// Format penulisan buat admin (lihat juga BeritaManager.jsx & data/beritaFormat.jsx):
// - Paragraf baru = pisahin pakai baris kosong (Enter dua kali)
// - Link = [teks yang ditampilin](https://url-tujuan)

export default function BeritaSection() {
    const [berita, setBerita] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/berita');
                const data = await res.json();
                if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat berita.');
                setBerita(data.berita || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#B9FF66]" />
                <h2 className="text-lg font-bold">Berita & Update</h2>
            </div>

            {loading ? (
                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <Loader2 className="w-6 h-6 text-[#B9FF66] animate-spin" />
                    <p className="text-sm text-gray-500">Memuat berita...</p>
                </div>
            ) : error ? (
                <div className="bg-[#191A19] border border-red-500/30 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            ) : berita.length === 0 ? (
                <div className="bg-[#191A19] border border-white/10 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <Newspaper className="w-8 h-8 text-gray-600" />
                    <p className="text-sm text-gray-500">Belum ada berita atau update terbaru.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {berita.map((b) => (
                        <div key={b.id} className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#B9FF66]/10 text-[#B9FF66]">
                                    <Megaphone className="w-3.5 h-3.5" />
                                    {b.tipe || 'Pengumuman'}
                                </span>
                                <span className="text-xs text-gray-500">{formatTanggal(b.created_at)}</span>
                            </div>
                            <h3 className="font-bold">{b.judul}</h3>
                            <div className="flex flex-col gap-3">{renderBeritaContent(b.isi)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}