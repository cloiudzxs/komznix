'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Megaphone } from 'lucide-react';
import { renderBeritaContent } from '../data/beritaFormat';

// Sumber datanya terpisah dari broadcast/notifikasi — ditulis lewat panel
// admin "Kelola Berita". Ini masih lewat localStorage (cuma nyambung di
// browser yang sama); begitu backend ada, ganti jadi fetch dari tabel
// `berita` di database.
const BERITA_STORAGE_KEY = 'suntik_berita';

function loadBerita() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(BERITA_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function formatTanggal(timestamp) {
    const date = new Date(timestamp);
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

    useEffect(() => {
        setBerita(loadBerita());
    }, []);

    return (
        <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#B9FF66]" />
                <h2 className="text-lg font-bold">Berita & Update</h2>
            </div>

            {berita.length === 0 ? (
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
                                <span className="text-xs text-gray-500">{formatTanggal(b.timestamp)}</span>
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