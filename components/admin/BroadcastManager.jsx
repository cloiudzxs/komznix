'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Send, Info, Tag, AlertTriangle, Trash2 } from 'lucide-react';

const BROADCAST_STORAGE_KEY = 'suntik_broadcasts';

const TIPE_OPTIONS = [
    { value: 'Info', icon: Info, style: 'bg-blue-500/10 text-blue-400' },
    { value: 'Promo', icon: Tag, style: 'bg-[#FFB800]/10 text-[#FFB800]' },
    { value: 'Peringatan', icon: AlertTriangle, style: 'bg-red-500/10 text-red-400' },
];

function loadBroadcasts() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(BROADCAST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveBroadcasts(list) {
    try {
        window.localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(list));
    } catch {
        // localStorage penuh/diblokir — broadcast tetap kepakai untuk sesi ini saja
    }
}

function formatTanggal(timestamp) {
    const date = new Date(timestamp);
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
    const [broadcasts, setBroadcasts] = useState([]);

    useEffect(() => {
        setBroadcasts(loadBroadcasts());
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!judul.trim() || !isi.trim()) {
            setError('Judul dan isi pengumuman wajib diisi.');
            return;
        }

        const broadcast = {
            id: `BC-${Math.floor(1000 + Math.random() * 8999)}`,
            judul: judul.trim(),
            isi: isi.trim(),
            tipe,
            timestamp: Date.now(),
        };

        const updated = [broadcast, ...broadcasts];
        setBroadcasts(updated);
        saveBroadcasts(updated);
        setJudul('');
        setIsi('');
        setTipe('Info');
        setSent(true);
        setTimeout(() => setSent(false), 2000);
    }

    function handleDelete(id) {
        const updated = broadcasts.filter((b) => b.id !== id);
        setBroadcasts(updated);
        saveBroadcasts(updated);
    }

    return (
        <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#FFB800]" />
                <h2 className="text-lg font-bold">Broadcast Pengumuman</h2>
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Kirim pengumuman yang bakal muncul di lonceng notifikasi semua pelanggan. Untuk sekarang tersimpan di
                localStorage browser ini — begitu backend ada, ganti jadi tabel <code className="text-gray-300">notifications</code>{' '}
                di database supaya benar-benar terkirim ke semua pengguna, bukan cuma browser yang sama.
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
                    className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#e6a600] transition-colors"
                >
                    <Send className="w-4 h-4" />
                    {sent ? 'Terkirim' : 'Kirim ke Semua Pengguna'}
                </button>
            </form>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-sm font-bold">Riwayat Broadcast</h3>
                </div>
                {broadcasts.length === 0 ? (
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
                                            <p className="text-gray-600 text-xs mt-1">{formatTanggal(b.timestamp)}</p>
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