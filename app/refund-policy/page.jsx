'use client';

import Link from 'next/link';
import { Asterisk, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-[#B9FF66]">{title}</h2>
        <div className="text-gray-300 leading-relaxed flex flex-col gap-3">{children}</div>
    </div>
);

export default function RefundPolicy() {
    return (
        <div className="bg-[#111111] min-h-screen text-white font-sans selection:bg-[#B9FF66] selection:text-black">
            <nav className="container mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Asterisk className="w-8 h-8 text-white" />
                    <span className="text-2xl font-bold tracking-tight">SuntikSosmed<span className="text-[#B9FF66]">.</span></span>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#B9FF66] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke beranda
                </Link>
            </nav>

            <main className="container mx-auto px-4 md:px-8 py-12 md:py-20 max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">Kebijakan Refund</h1>
                <p className="text-gray-500 mb-12">Terakhir diperbarui: 10 Juli 2026</p>

                <div className="flex flex-col gap-10">
                    <Section title="1. Ringkasan">
                        <p>
                            Kami ingin proses pemesanan layanan SMM di SuntikSosmed terasa aman buat kamu. Kebijakan ini menjelaskan kapan saldo kamu dikembalikan secara otomatis, kapan pesanan dilindungi garansi refill, dan kondisi mana yang tidak memenuhi syarat refund.
                        </p>
                    </Section>

                    <Section title="2. Kapan Kamu Berhak Dapat Refund">
                        <p>
                            Saldo kamu otomatis dikembalikan secara penuh jika pesanan gagal diproses oleh provider, dibatalkan oleh sistem karena stok layanan tidak tersedia, atau tidak selesai sama sekali dalam batas waktu yang ditentukan untuk layanan tersebut. Refund masuk langsung ke saldo akun kamu tanpa perlu pengajuan klaim manual.
                        </p>
                    </Section>

                    <Section title="3. Garansi Refill">
                        <p>
                            Sebagian besar layanan followers, likes, views, dan subscribers dilindungi garansi refill selama periode tertentu yang tercantum pada masing-masing layanan. Kalau jumlah yang kamu terima turun (drop) di bawah target dalam periode garansi, sistem akan mengisi ulang secara gratis. Garansi refill berupa pengisian ulang, bukan pengembalian dana tunai.
                        </p>
                    </Section>

                    <Section title="4. Kondisi yang Tidak Dapat Direfund">
                        <p>
                            Refund tidak berlaku untuk pesanan yang sudah selesai sesuai jumlah yang dipesan, kesalahan target (username/link) yang kamu masukkan sendiri, akun atau konten target yang di-private/dihapus setelah pesanan diproses, maupun pesanan yang dibatalkan karena melanggar{' '}
                            <Link href="/terms-of-service" className="text-[#B9FF66] hover:underline">Syarat & Ketentuan</Link> kami.
                        </p>
                    </Section>

                    <Section title="5. Proses Refund">
                        <p>
                            Refund yang memenuhi syarat diproses otomatis oleh sistem dan langsung menambah saldo akun kamu, biasanya dalam hitungan menit setelah pesanan dinyatakan gagal atau dibatalkan. Kamu bisa memantau status ini lewat halaman Riwayat Pesanan di dashboard.
                        </p>
                    </Section>

                    <Section title="6. Pembatalan oleh Pengguna">
                        <p>
                            Pesanan yang sudah mulai diproses oleh provider umumnya tidak dapat dibatalkan secara sepihak oleh pengguna. Kalau kamu memesan layanan yang salah, segera hubungi tim dukungan kami sebelum pesanan mulai diproses.
                        </p>
                    </Section>

                    <Section title="7. Perubahan Kebijakan Ini">
                        <p>
                            Kami dapat memperbarui Kebijakan Refund ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan lewat email atau pemberitahuan di situs kami sebelum berlaku.
                        </p>
                    </Section>

                    <Section title="8. Hubungi Kami">
                        <p>
                            Kalau ada pesanan yang menurut kamu berhak refund tapi belum diproses otomatis, hubungi kami di{' '}
                            <a href="mailto:suntiksosmed@proton.me" className="text-[#B9FF66] hover:underline">suntiksosmed@proton.me</a>.
                        </p>
                    </Section>
                </div>
            </main>

            <footer className="container mx-auto px-4 md:px-8 py-10 border-t border-white/10 text-center text-gray-500 text-sm">
                &copy; 2026 SuntikSosmed. All rights reserved.
            </footer>
        </div>
    );
}