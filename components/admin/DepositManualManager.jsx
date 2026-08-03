// components/admin/DepositManualManager.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgePlus } from 'lucide-react';

const AMBER = '#FFB800';
const NOMINAL_CEPAT = [10000, 25000, 50000, 100000, 250000, 500000];
const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

function normalizeUser(u) {
    return {
        id: u.id ?? u.user_id,
        nama: u.full_name ?? u.nama ?? u.name ?? '-',
        email: u.email ?? '-',
        saldo: Number(u.balance ?? u.saldo ?? 0),
        status: u.status ?? 'Aktif',
    };
}

export default function DepositManualManager() {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [q, setQ] = useState('');
    const [selected, setSelected] = useState(null);

    const [tipe, setTipe] = useState('tambah');
    const [jumlah, setJumlah] = useState('');
    const [catatan, setCatatan] = useState('');
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    const [riwayat, setRiwayat] = useState([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(true);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/admin/users', { cache: 'no-store' });
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.users || data.data || [];
            setUsers(list.map(normalizeUser));
        } catch {
            setMsg({ type: 'error', text: 'Gagal memuat daftar pengguna.' });
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadRiwayat = async () => {
        setLoadingRiwayat(true);
        try {
            const res = await fetch('/api/admin/deposit-manual', { cache: 'no-store' });
            const data = await res.json();
            setRiwayat(data.riwayat || []);
        } catch {
            setRiwayat([]);
        } finally {
            setLoadingRiwayat(false);
        }
    };

    useEffect(() => {
        loadUsers();
        loadRiwayat();
    }, []);

    const hasil = useMemo(() => {
        const key = q.trim().toLowerCase();
        if (!key) return users.slice(0, 8);
        return users
            .filter(
                (u) =>
                    u.nama.toLowerCase().includes(key) ||
                    u.email.toLowerCase().includes(key) ||
                    String(u.id).toLowerCase().includes(key)
            )
            .slice(0, 8);
    }, [q, users]);

    const jumlahNum = Math.floor(Number(jumlah)) || 0;
    const saldoSetelah =
        selected == null
            ? 0
            : tipe === 'tambah'
                ? selected.saldo + jumlahNum
                : selected.saldo - jumlahNum;

    const bisaSubmit =
        !!selected && jumlahNum > 0 && !submitting && (tipe === 'tambah' || saldoSetelah >= 0);

    const submit = async () => {
        if (!bisaSubmit) return;
        setSubmitting(true);
        setMsg(null);
        try {
            const res = await fetch('/api/admin/deposit-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selected.id, tipe, jumlah: jumlahNum, catatan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal memproses saldo.');

            setMsg({
                type: 'success',
                text: `Saldo ${selected.nama}: ${rp(data.saldo_lama)} → ${rp(data.saldo_baru)}`,
            });
            setUsers((prev) =>
                prev.map((u) => (u.id === selected.id ? { ...u, saldo: data.saldo_baru } : u))
            );
            setSelected((s) => (s ? { ...s, saldo: data.saldo_baru } : s));
            setJumlah('');
            setCatatan('');
            setKonfirmasi(false);
            loadRiwayat();
        } catch (e) {
            setMsg({ type: 'error', text: e.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BadgePlus className="w-5 h-5" style={{ color: AMBER }} />
                    Deposit Manual
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                    Isi atau kurangi saldo pengguna langsung, tanpa menunggu request deposit dari pengguna.
                </p>
            </div>

            {msg && (
                <div
                    className={`rounded-xl px-4 py-3 text-sm border ${msg.type === 'success'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                >
                    {msg.text}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Pilih pengguna */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">1. Pilih pengguna</h3>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari nama, email, atau ID..."
                        className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
                    />

                    <div className="mt-3 space-y-1.5 max-h-72 overflow-y-auto">
                        {loadingUsers && <p className="text-sm text-neutral-500">Memuat pengguna...</p>}
                        {!loadingUsers && hasil.length === 0 && (
                            <p className="text-sm text-neutral-500">Tidak ada pengguna yang cocok.</p>
                        )}
                        {hasil.map((u) => {
                            const aktif = selected?.id === u.id;
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        setSelected(u);
                                        setKonfirmasi(false);
                                        setMsg(null);
                                    }}
                                    className={`w-full text-left rounded-xl border px-4 py-2.5 transition ${aktif
                                            ? 'border-amber-500/60 bg-amber-500/10'
                                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{u.nama}</p>
                                            <p className="text-xs text-neutral-500 truncate">{u.email}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold" style={{ color: AMBER }}>
                                                {rp(u.saldo)}
                                            </p>
                                            {u.status !== 'Aktif' && (
                                                <span className="text-[10px] text-red-400">{u.status}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Jumlah */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">2. Atur saldo</h3>

                    {!selected ? (
                        <p className="text-sm text-neutral-500">Pilih pengguna dulu di sebelah kiri.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-3">
                                <p className="text-xs text-neutral-500">Pengguna terpilih</p>
                                <p className="text-sm font-semibold text-white">{selected.nama}</p>
                                <p className="text-xs text-neutral-500">{selected.email}</p>
                                <p className="text-xs text-neutral-400 mt-1">
                                    Saldo sekarang: <span style={{ color: AMBER }}>{rp(selected.saldo)}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-950 border border-neutral-800 p-1">
                                {[
                                    ['tambah', 'Tambah saldo'],
                                    ['kurang', 'Kurangi saldo'],
                                ].map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => {
                                            setTipe(val);
                                            setKonfirmasi(false);
                                        }}
                                        className={`rounded-lg py-2 text-sm font-medium transition ${tipe === val
                                                ? val === 'tambah'
                                                    ? 'bg-amber-500 text-black'
                                                    : 'bg-red-500 text-white'
                                                : 'text-neutral-400 hover:text-white'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <input
                                    type="number"
                                    min="0"
                                    value={jumlah}
                                    onChange={(e) => {
                                        setJumlah(e.target.value);
                                        setKonfirmasi(false);
                                    }}
                                    placeholder="Nominal (Rp)"
                                    className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
                                />
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {NOMINAL_CEPAT.map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => {
                                                setJumlah(String(n));
                                                setKonfirmasi(false);
                                            }}
                                            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-600"
                                        >
                                            {rp(n)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                maxLength={200}
                                placeholder="Catatan (opsional) — mis. bonus promo, koreksi"
                                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm text-white outline-none focus:border-neutral-600"
                            />

                            {jumlahNum > 0 && (
                                <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm">
                                    <div className="flex justify-between text-neutral-400">
                                        <span>Saldo setelah</span>
                                        <span
                                            className="font-semibold"
                                            style={{ color: saldoSetelah < 0 ? '#f87171' : AMBER }}
                                        >
                                            {rp(saldoSetelah)}
                                        </span>
                                    </div>
                                    {saldoSetelah < 0 && (
                                        <p className="text-xs text-red-400 mt-1">
                                            Saldo pengguna tidak cukup untuk dikurangi sebanyak itu.
                                        </p>
                                    )}
                                </div>
                            )}

                            {!konfirmasi ? (
                                <button
                                    disabled={!bisaSubmit}
                                    onClick={() => setKonfirmasi(true)}
                                    className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: AMBER, color: '#000' }}
                                >
                                    Lanjut
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-neutral-300">
                                        {tipe === 'tambah' ? 'Tambah' : 'Kurangi'}{' '}
                                        <span className="font-semibold" style={{ color: AMBER }}>
                                            {rp(jumlahNum)}
                                        </span>{' '}
                                        ke saldo <span className="font-semibold text-white">{selected.nama}</span>?
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setKonfirmasi(false)}
                                            className="rounded-xl border border-neutral-800 py-3 text-sm text-neutral-300 hover:border-neutral-600"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            disabled={submitting}
                                            onClick={submit}
                                            className="rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
                                            style={{ background: AMBER, color: '#000' }}
                                        >
                                            {submitting ? 'Memproses...' : 'Proses'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Riwayat */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">Riwayat deposit manual</h3>
                    <button
                        onClick={loadRiwayat}
                        className="text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded-lg px-3 py-1.5"
                    >
                        Muat ulang
                    </button>
                </div>

                {loadingRiwayat ? (
                    <p className="text-sm text-neutral-500">Memuat...</p>
                ) : riwayat.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                        Belum ada deposit manual. Isi saldo pengguna di form atas untuk memulai.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                                    <th className="py-2 pr-4 font-medium">Pengguna</th>
                                    <th className="py-2 pr-4 font-medium">Jumlah</th>
                                    <th className="py-2 pr-4 font-medium">Saldo kini</th>
                                    <th className="py-2 font-medium">Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riwayat.map((r) => (
                                    <tr key={r.id} className="border-b border-neutral-900">
                                        <td className="py-2.5 pr-4 text-white">{r.nama}</td>
                                        <td className="py-2.5 pr-4 font-semibold" style={{ color: AMBER }}>
                                            + {rp(r.jumlah)}
                                        </td>
                                        <td className="py-2.5 pr-4 text-neutral-400">
                                            {r.saldo_sekarang == null ? '-' : rp(r.saldo_sekarang)}
                                        </td>
                                        <td className="py-2.5 text-neutral-500 text-xs">
                                            {new Date(r.created_at).toLocaleString('id-ID')}
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