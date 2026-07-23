'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { createClient } from '../lib/supabase/client';

function formatRupiah(value) {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
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

export default function RefundSection() {
    const [supabase] = useState(() => createClient());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refunds, setRefunds] = useState([]);

    async function load() {
        setLoading(true);
        setError('');
        const { data, error: queryError } = await supabase
            .from('orders')
            .select('id, layanan, harga, status, created_at')
            .eq('refunded', true)
            .order('created_at', { ascending: false });

        if (queryError) {
            setError('Gagal memuat riwayat refund.');
        } else {
            setRefunds(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalRefund = refunds.reduce((sum, r) => sum + Number(r.harga), 0);

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#B9FF66] flex items-center justify-center shrink-0">
                    <RotateCcw className="w-6 h-6 text-black" />
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Total Saldo Dikembalikan</p>
                    <p className="text-3xl font-bold mt-1">{formatRupiah(totalRefund)}</p>
                </div>
            </div>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold">Riwayat Refund</h3>
                </div>

                {loading ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-6 h-6 text-[#B9FF66] animate-spin" />
                        <p className="text-sm text-gray-500">Memuat riwayat...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada refund.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-left border-b border-white/10">
                                    <th className="px-6 py-3 font-medium">Layanan</th>
                                    <th className="px-6 py-3 font-medium">Jumlah Dikembalikan</th>
                                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Status Pesanan</th>
                                    <th className="px-6 py-3 font-medium hidden md:table-cell">Waktu Pesanan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map((r) => (
                                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <p className="font-medium flex items-center gap-1.5">
                                                <RotateCcw className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                                {r.layanan}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-0.5 md:hidden">{formatTanggal(r.created_at)}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[#B9FF66] font-bold">+{formatRupiah(r.harga)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 hidden sm:table-cell whitespace-nowrap">{r.status}</td>
                                        <td className="px-6 py-4 text-gray-400 hidden md:table-cell whitespace-nowrap">
                                            {formatTanggal(r.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}