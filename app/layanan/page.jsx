'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Asterisk, ArrowLeft } from 'lucide-react';
import DaftarLayananSection from '../../components/DaftarLayananSection';

function LayananContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    return (
        <div className="bg-[#111111] min-h-screen text-white">
            <header className="border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Asterisk className="w-7 h-7 text-white" />
                        <span className="text-xl font-bold tracking-tight">
                            SuntikSosmed<span className="text-[#B9FF66]">.</span>
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                            Masuk
                        </Link>
                        <Link
                            href="/register"
                            className="bg-[#B9FF66] text-black text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#a0e655] transition-colors"
                        >
                            Daftar
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <Link
                    href="/"
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors w-fit mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke beranda
                </Link>

                {/* Katalog live dari provider, publik — bisa dilihat siapa aja
                tanpa perlu login. Buat MEMESAN tetap perlu daftar/masuk dulu
                (link Masuk/Daftar di atas & tombol di dalam DaftarLayananSection
                sendiri gak ada aksi beli, cuma preview harga & katalog). */}
                <DaftarLayananSection initialQuery={initialQuery} />
            </main>
        </div>
    );
}

export default function LayananPublikPage() {
    return (
        <Suspense fallback={null}>
            <LayananContent />
        </Suspense>
    );
}