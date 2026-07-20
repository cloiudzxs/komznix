'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Asterisk, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get('registered') === '1';
    const isSuspended = searchParams.get('suspended') === '1';
    const [supabase] = useState(() => createClient());
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email dan password wajib diisi.');
            return;
        }

        setLoading(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (signInError) {
            setError(
                signInError.message === 'Invalid login credentials'
                    ? 'Email atau password salah.'
                    : signInError.message
            );
            return;
        }

        router.push('/dashboard');
        router.refresh();
    }

    return (
        <div className="bg-[#111111] min-h-screen text-white flex">
            {/* Left panel - form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
                <Link href="/" className="flex items-center gap-2 mb-12 w-fit text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Kembali ke beranda</span>
                </Link>

                <Link href="/" className="flex items-center gap-2 mb-10 w-fit">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">SuntikSosmed<span className="text-[#B9FF66]">.</span></span>
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">Selamat datang kembali</h1>
                <p className="text-gray-400 mb-10">Masuk untuk kelola pesanan SMM kamu.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
                    {isSuspended && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Akun kamu ditangguhkan admin. Hubungi dukungan pelanggan kalau menurut kamu ini keliru.
                        </div>
                    )}

                    {justRegistered && !error && (
                        <div className="flex items-center gap-2 bg-[#B9FF66]/10 border border-[#B9FF66]/30 text-[#B9FF66] text-sm rounded-xl px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Akun berhasil dibuat. Silakan masuk pakai email & password kamu.
                        </div>
                    )}

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

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:border-[#B9FF66] transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="accent-[#B9FF66] w-4 h-4"
                            />
                            Ingat saya
                        </label>
                        <a href="/lupa-password" className="text-[#B9FF66] hover:underline">Lupa password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#B9FF66] text-black text-center font-medium rounded-xl py-3.5 hover:bg-[#a0e655] transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-8">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-[#B9FF66] font-medium hover:underline">
                        Daftar sekarang
                    </Link>
                </p>
            </div>

            {/* Right panel - visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#191A19] items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#B9FF66] rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-md px-12 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#B9FF66] flex items-center justify-center rotate-12">
                        <Asterisk className="w-10 h-10 text-black -rotate-12" />
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">Kelola semua pesanan SMM kamu di satu dashboard</h2>
                    <p className="text-gray-400">
                        Pantau followers, likes, views, dan saldo secara real-time dari mana saja.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}