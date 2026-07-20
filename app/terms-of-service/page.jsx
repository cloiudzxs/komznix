'use client';

import Link from 'next/link';
import { Asterisk, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-[#B9FF66]">{title}</h2>
        <div className="text-gray-300 leading-relaxed flex flex-col gap-3">{children}</div>
    </div>
);

export default function TermsOfService() {
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
                <h1 className="text-4xl md:text-5xl font-bold mb-3">Syarat & Ketentuan</h1>
                <p className="text-gray-500 mb-12">Terakhir diperbarui: 10 Juli 2026</p>

                <div className="flex flex-col gap-10">
                    <Section title="1. Penerimaan Syarat">
                        <p>
                            Dengan membuat akun atau menggunakan SuntikSosmed, kamu setuju untuk terikat dengan Syarat & Ketentuan ini. Kalau kamu tidak setuju dengan bagian mana pun dari syarat ini, mohon untuk tidak menggunakan layanan kami.
                        </p>
                    </Section>

                    <Section title="2. Deskripsi Layanan">
                        <p>
                            SuntikSosmed menyediakan layanan SMM (Social Media Marketing) berupa followers, likes, views, subscribers, dan engagement lainnya untuk platform seperti Instagram, TikTok, YouTube, Facebook, dan lainnya. Ketersediaan, harga, dan stok layanan dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.
                        </p>
                    </Section>

                    <Section title="3. Tanggung Jawab Pengguna">
                        <p>
                            Kamu bertanggung jawab menjaga kerahasiaan kredensial akun kamu dan atas seluruh aktivitas yang dilakukan lewat akun kamu. Kamu setuju untuk memberikan informasi yang akurat saat mendaftar, melakukan top up saldo, dan memastikan target pesanan (username/link) yang kamu masukkan benar dan bersifat publik.
                        </p>
                    </Section>

                    <Section title="4. Akun & Pembayaran">
                        <p>
                            Saldo akun kamu digunakan untuk memesan layanan SMM. Pembayaran diproses lewat QRIS dan metode lain yang tercantum di platform. Top up saldo tidak dapat dipindahkan ke akun lain.
                        </p>
                    </Section>

                    <Section title="5. Penggunaan yang Dilarang">
                        <p>
                            Kamu tidak boleh menggunakan layanan SuntikSosmed untuk aktivitas ilegal, spam, pelecehan, penipuan, atau untuk melanggar syarat layanan platform pihak ketiga mana pun (seperti Instagram, TikTok, YouTube, atau platform lainnya). Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan akun secara langsung tanpa pengembalian dana.
                        </p>
                    </Section>

                    <Section title="6. Garansi & Refund">
                        <p>
                            Sebagian besar layanan dilindungi garansi refill sesuai ketentuan masing-masing layanan. Kalau pesanan gagal diproses oleh provider, saldo kamu otomatis dikembalikan sesuai dengan{' '}
                            <Link href="/refund-policy" className="text-[#B9FF66] hover:underline">Kebijakan Refund</Link> kami.
                        </p>
                    </Section>

                    <Section title="7. Batasan Tanggung Jawab">
                        <p>
                            SuntikSosmed tidak bertanggung jawab atas kerugian yang timbul dari perubahan kebijakan atau gangguan platform pihak ketiga, keterlambatan proses yang disebabkan oleh pihak eksternal, atau penyalahgunaan akun akibat kelalaian kamu sendiri.
                        </p>
                    </Section>

                    <Section title="8. Penghentian Layanan">
                        <p>
                            Kami berhak menangguhkan atau menghentikan akun yang melanggar Syarat ini, terlibat aktivitas curang, atau menimbulkan risiko keamanan bagi pengguna lain maupun platform.
                        </p>
                    </Section>

                    <Section title="9. Hukum yang Berlaku">
                        <p>
                            Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia, tanpa memperhatikan prinsip pertentangan hukum.
                        </p>
                    </Section>

                    <Section title="10. Hubungi Kami">
                        <p>
                            Pertanyaan seputar Syarat & Ketentuan ini bisa dikirim ke{' '}
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