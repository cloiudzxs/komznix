'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Asterisk, Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react';

export default function LupaPasswordPage() {
    const [supabase] = useState(() => createClient());
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Email wajib diisi.');
            return;
        }

        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);

        if (resetError) {
            setError(resetError.message);
            return;
        }

        // Sengaja gak bedain "email gak ketemu" vs "berhasil dikirim" di
        // pesan sukses ini — biar orang gak bisa nebak-nebak email mana
        // yang beneran terdaftar cuma dari coba-coba di form ini.
        setSent(true);
    }

    if (sent) {
        return (
            <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-[#B9FF66]/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-[#B9FF66]" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Cek email kamu</h1>
                    <p className="text-gray-400 text-sm mb-8">
                        Kalau <span className="text-white">{email}</span> terdaftar, kami udah kirim link buat bikin password
                        baru. Klik link itu buat lanjut.
                    </p>
                    <Link href="/login" className="text-[#B9FF66] hover:underline text-sm font-medium">
                        Kembali ke halaman masuk
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111111] min-h-screen text-white flex">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
                <Link
                    href="/login"
                    className="flex items-center gap-2 mb-12 w-fit text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Kembali ke halaman masuk</span>
                </Link>

                <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">
                        SuntikSosmed<span className="text-[#B9FF66]">.</span>
                    </span>
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">Lupa password?</h1>
                <p className="text-gray-400 mb-10">Masukkan email akun kamu, kami kirim link buat bikin password baru.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#B9FF66] transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#B9FF66] text-black text-center font-medium rounded-xl py-3.5 hover:bg-[#a0e655] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-8">
                    Sudah ingat password?{' '}
                    <Link href="/login" className="text-[#B9FF66] font-medium hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>

            <div className="hidden lg:flex lg:w-1/2 bg-[#191A19] items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-[#B9FF66] rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-md px-12 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#B9FF66] flex items-center justify-center rotate-12">
                        <KeyRound className="w-10 h-10 text-black -rotate-12" />
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">Tenang, ini kejadian yang wajar</h2>
                    <p className="text-gray-400">Kami bantu kamu balik masuk ke akun secepatnya. Cek email setelah kirim form ini.</p>
                </div>
            </div>
        </div>
    );
}