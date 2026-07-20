'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Asterisk, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/admin-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error || 'Email atau password salah.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="bg-[#111111] min-h-screen text-white font-sans flex items-center justify-center px-4 py-12 selection:bg-[#FFB800] selection:text-black">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <Asterisk className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold tracking-tight">
              SuntikSosmed<span className="text-[#FFB800]">.</span>
            </span>
          </div>
          <span className="text-[10px] font-bold bg-[#FFB800] text-black px-2 py-0.5 rounded-full">ADMIN</span>
        </div>

        <div className="bg-[#191A19] border border-white/10 rounded-[32px] p-8 md:p-10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#FFB800]" />
            <h1 className="text-2xl font-bold">Login Admin</h1>
          </div>
          <p className="text-gray-400 text-sm mb-8">
            Kredensial admin terpisah dari akun pelanggan, gak kesimpen di database.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@suntiksosmed.store"
                  className="w-full bg-[#111111] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111111] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-[#FFB800] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#FFB800] text-black font-medium rounded-xl py-3.5 mt-2 flex items-center justify-center gap-2 hover:bg-[#e6a600] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Bukan admin? Kembali ke{' '}
          <a href="/login" className="text-[#FFB800] hover:underline">
            login pelanggan
          </a>
          .
        </p>
      </div>
    </div>
  );
}