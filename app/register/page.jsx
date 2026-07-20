'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { containsBadWord, isValidEmail } from '../../lib/contentFilter';
import { Asterisk, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refCode = searchParams.get('ref');
    const [supabase] = useState(() => createClient());
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!fullName || !email || !password) {
            setError('Semua field wajib diisi.');
            return;
        }
        if (containsBadWord(fullName)) {
            setError('Nama mengandung kata yang tidak pantas. Mohon gunakan nama asli.');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Format email tidak valid.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok.');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }
        if (!agree) {
            setError('Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi.');
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, ...(refCode ? { referral_code: refCode } : {}) } },
        });

        setLoading(false);

        if (signUpError) {
            setError(
                signUpError.message === 'User already registered'
                    ? 'Email ini sudah terdaftar.'
                    : signUpError.message
            );
            return;
        }

        if (data.session) {
            // Sign out dulu biar gak "nyangkut" login otomatis — user tetap
            // diminta login manual pakai akun yang baru dibuat.
            await supabase.auth.signOut();
            router.push('/login?registered=1');
            return;
        }

        setSuccess(true);
    }

    if (success) {
        return (
            <div className="bg-[#111111] min-h-screen text-white flex items-center justify-center px-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-[#B9FF66]/10 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-8 h-8 text-[#B9FF66]" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Cek email kamu</h1>
                    <p className="text-gray-400 text-sm mb-8">
                        Kami sudah kirim link verifikasi ke <span className="text-white">{email}</span>. Klik link itu untuk
                        aktifkan akun kamu.
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
            {/* Left panel - visual */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#191A19] items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#B9FF66] rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 max-w-md px-12 flex flex-col gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-[#B9FF66] flex items-center justify-center -rotate-12">
                        <Asterisk className="w-10 h-10 text-black rotate-12" />
                    </div>
                    <h2 className="text-3xl font-bold leading-tight">Gabung bareng ribuan reseller & bisnis lainnya</h2>
                    <ul className="flex flex-col gap-4 text-gray-300">
                        {[
                            'Followers, likes, dan views untuk semua platform',
                            'Proses instan & bergaransi refill',
                            'Pembayaran QRIS otomatis',
                            'Dukungan pelanggan 24/7',
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#B9FF66] flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4 text-black" />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
                <Link href="/" className="flex items-center gap-2 mb-10 w-fit text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Kembali ke beranda</span>
                </Link>

                <Link href="/" className="flex items-center gap-2 mb-8 w-fit lg:hidden">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">SuntikSosmed<span className="text-[#B9FF66]">.</span></span>
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">Buat akun baru</h1>
                <p className="text-gray-400 mb-10">Mulai pesan layanan SMM cuma dalam beberapa menit.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Nama Lengkap</label>
                        <div className="relative">
                            <User className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nama kamu"
                                className="w-full bg-[#191A19] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#B9FF66] transition-colors"
                            />
                        </div>
                    </div>

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

                    <label className="flex items-start gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            className="accent-[#B9FF66] w-4 h-4 mt-0.5"
                        />
                        Saya setuju dengan Syarat & Ketentuan dan Kebijakan Privasi SuntikSosmed.
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#B9FF66] text-black text-center font-medium rounded-xl py-3.5 hover:bg-[#a0e655] transition-colors mt-2 disabled:opacity-60"
                    >
                        {loading ? 'Memproses...' : 'Buat akun'}
                    </button>
                </form>

                <p className="text-gray-400 text-sm mt-8">
                    Sudah punya akun?{' '}
                    <Link href="/login" className="text-[#B9FF66] font-medium hover:underline">
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterForm />
        </Suspense>
    );
}