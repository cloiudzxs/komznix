'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Asterisk, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [supabase] = useState(() => createClient());
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }

        setLoading(true);
        // Supabase otomatis bikin sesi sementara pas orang buka link dari
        // email reset (lewat token di URL) — jadi updateUser di sini bakal
        // kena ke akun yang bener tanpa perlu login manual dulu.
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(
                /session|token/i.test(updateError.message)
                    ? 'Link reset ini sudah tidak berlaku. Minta link baru lewat halaman Lupa Password.'
                    : updateError.message
            );
            return;
        }

        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
    }

    if (success) {
        return (
            <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-[#B9FF66]/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-[#B9FF66]" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Password berhasil diganti</h1>
                    <p className="text-gray-400 text-sm mb-8">Mengalihkan ke halaman masuk...</p>
                    <Link href="/login" className="text-[#B9FF66] hover:underline text-sm font-medium">
                        Masuk sekarang
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <Link href="/" className="flex items-center gap-2 mb-10 w-fit mx-auto justify-center">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">
                        SuntikSosmed<span className="text-[#B9FF66]">.</span>
                    </span>
                </Link>

                <h1 className="text-3xl font-bold mb-2 text-center">Bikin password baru</h1>
                <p className="text-gray-400 mb-10 text-center">Masukkan password baru buat akun kamu.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Password Baru</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
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

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Konfirmasi Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Ulangi password"
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
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </button>
                </form>
            </div>
        </div>
    );
}