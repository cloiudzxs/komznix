'use client';

import { useState } from 'react';
import { Copy, Check, ArrowLeft, Circle, CheckCircle2, Loader2, XCircle } from 'lucide-react';

const statusStyle = {
    Selesai: 'bg-[#B9FF66]/10 text-[#B9FF66]',
    Diproses: 'bg-blue-500/10 text-blue-400',
    Pending: 'bg-gray-500/10 text-gray-400',
};

// "2 menit lalu" / "1 jam lalu" / "Kemarin, 20:14" / "10 Jul, 09:47"
function formatRelativeTime(timestamp, now) {
    const diffMs = now - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const date = new Date(timestamp);
    const nowDate = new Date(now);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24 && date.getDate() === nowDate.getDate()) return `${diffHour} jam lalu`;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    if (isYesterday) return `Kemarin, ${hh}:${mm}`;
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
        date.getMonth()
    ];
    return `${dd} ${month}, ${hh}:${mm}`;
}

// Seed sederhana dari ID pesanan biar progress "sedang diproses" konsisten
// tiap kali dilihat (bukan acak ulang tiap render), tanpa perlu data asli.
function seededProgress(orderId, jumlah) {
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0;
    const pct = 0.15 + (hash % 70) / 100; // antara 15% - 85%
    return Math.round(jumlah * pct);
}

const TIMELINE_STEPS = ['Pesanan Dibuat', 'Diproses', 'Selesai'];

function OrderTimeline({ status }) {
    const currentStepIndex = status === 'Pending' ? 0 : status === 'Diproses' ? 1 : status === 'Gagal' ? -1 : 2;

    if (status === 'Gagal') {
        return (
            <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-5 h-5" />
                Pesanan gagal diproses. Saldo otomatis dikembalikan.
            </div>
        );
    }

    return (
        <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => {
                const done = i < currentStepIndex || (i === currentStepIndex && status === 'Selesai');
                const active = i === currentStepIndex && status !== 'Selesai';
                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-2">
                            {done ? (
                                <CheckCircle2 className="w-6 h-6 text-[#B9FF66]" />
                            ) : active ? (
                                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                            ) : (
                                <Circle className="w-6 h-6 text-gray-600" />
                            )}
                            <span className={`text-xs text-center ${done || active ? 'text-white' : 'text-gray-600'}`}>{step}</span>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStepIndex ? 'bg-[#B9FF66]' : 'bg-gray-700'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function OrderDetail({ order, now, onBack, onCopy, copied }) {
    const delivered =
        order.status === 'Selesai' ? order.jumlah : order.status === 'Diproses' ? seededProgress(order.id, order.jumlah) : 0;
    const percent = Math.round((delivered / order.jumlah) * 100);

    return (
        <div className="max-w-2xl flex flex-col gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#B9FF66] transition-colors w-fit">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke daftar pesanan
            </button>

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
                    <div>
                        <p className="font-bold text-lg">{order.layanan}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="font-mono text-sm text-gray-400">{order.id}</p>
                            <button onClick={() => onCopy(order)} className={copied ? 'text-[#B9FF66]' : 'text-gray-500 hover:text-[#B9FF66]'}>
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyle[order.status] || 'bg-red-500/10 text-red-400'}`}>
                        {order.status}
                    </span>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <OrderTimeline status={order.status} />

                    {(order.status === 'Diproses' || order.status === 'Selesai') && (
                        <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress pengiriman</span>
                                <span className="font-medium">
                                    {delivered.toLocaleString('id-ID')} / {order.jumlah.toLocaleString('id-ID')}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#B9FF66] rounded-full transition-all"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-[#111111] border border-white/10 rounded-xl p-4">
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Target</p>
                            <p className="truncate">{order.target}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Jumlah Dipesan</p>
                            <p>{order.jumlah.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Dibuat</p>
                            <p>{formatRelativeTime(order.timestamp, now)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs mb-1">Status</p>
                            <p>{order.status}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RiwayatPesananSection({ orders, historyNow }) {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [copiedOrderId, setCopiedOrderId] = useState(null);

    function handleCopyOrderId(order) {
        navigator.clipboard.writeText(order.id);
        setCopiedOrderId(order.id);
        setTimeout(() => setCopiedOrderId((id) => (id === order.id ? null : id)), 1500);
    }

    if (selectedOrder) {
        return (
            <OrderDetail
                order={selectedOrder}
                now={historyNow}
                onBack={() => setSelectedOrder(null)}
                onCopy={handleCopyOrderId}
                copied={copiedOrderId === selectedOrder.id}
            />
        );
    }

    return (
        <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-lg font-bold">Semua Riwayat Pesanan</h2>
                <span className="text-gray-400 text-sm">{orders.length} pesanan</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 text-left border-b border-white/10">
                            <th className="px-6 py-3 font-medium">Layanan</th>
                            <th className="px-6 py-3 font-medium hidden md:table-cell">Target</th>
                            <th className="px-6 py-3 font-medium">Jumlah</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium hidden sm:table-cell">Waktu</th>
                            <th className="px-6 py-3 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer"
                            >
                                <td className="px-6 py-4 font-medium whitespace-nowrap">
                                    <p>{order.layanan}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">
                                        {order.id}
                                        <span className="sm:hidden"> · {formatRelativeTime(order.timestamp, historyNow)}</span>
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate hidden md:table-cell">{order.target}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{order.jumlah.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[order.status] || 'bg-red-500/10 text-red-400'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 whitespace-nowrap hidden sm:table-cell">
                                    {formatRelativeTime(order.timestamp, historyNow)}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyOrderId(order);
                                        }}
                                        className={`p-2 -m-2 ${copiedOrderId === order.id ? 'text-[#B9FF66]' : 'text-gray-400 hover:text-[#B9FF66]'}`}
                                    >
                                        {copiedOrderId === order.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}