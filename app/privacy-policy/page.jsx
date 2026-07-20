'use client';

import Link from 'next/link';
import { Asterisk, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="flex flex-col gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-[#B9FF66]">{title}</h2>
        <div className="text-gray-300 leading-relaxed flex flex-col gap-3">{children}</div>
    </div>
);

export default function PrivacyPolicy() {
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
                <h1 className="text-4xl md:text-5xl font-bold mb-3">Kebijakan Privasi</h1>
                <p className="text-gray-500 mb-12">Terakhir diperbarui: 10 Juli 2026</p>

                <div className="flex flex-col gap-10">
                    <Section title="1. Informasi yang Kami Kumpulkan">
                        <p>
                            Saat kamu membuat akun SuntikSosmed, kami mengumpulkan informasi seperti nama, alamat email, dan detail pembayaran. Kami juga secara otomatis mengumpulkan data pemakaian, termasuk alamat IP, jenis perangkat, dan cara kamu berinteraksi dengan layanan kami, untuk membantu meningkatkan kualitas platform.
                        </p>
                    </Section>

                    <Section title="2. Cara Kami Menggunakan Informasi Kamu">
                        <p>
                            Kami menggunakan informasi kamu untuk menyediakan dan menjaga layanan SMM, memproses transaksi, mengirim notifikasi status pesanan, mencegah penipuan dan penyalahgunaan, serta menanggapi permintaan dukungan kamu. Kami tidak menggunakan data pribadi kamu untuk tujuan di luar layanan tanpa persetujuan kamu.
                        </p>
                    </Section>

                    <Section title="3. Berbagi Data">
                        <p>
                            Kami membagikan data dengan mitra provider layanan tepercaya semata-mata untuk memproses pesanan followers, likes, views, dan layanan lainnya. Kami juga dapat mengungkapkan informasi ketika diwajibkan oleh hukum atau untuk melindungi hak, keamanan, dan properti SuntikSosmed serta penggunanya. Kami tidak pernah menjual data pribadi kamu ke pihak ketiga untuk tujuan pemasaran.
                        </p>
                    </Section>

                    <Section title="4. Keamanan Data">
                        <p>
                            Seluruh transaksi dan data sensitif dienkripsi baik saat dikirim maupun disimpan. Kami menerapkan praktik keamanan standar industri, termasuk kontrol akses dan pemantauan berkala, untuk melindungi informasi kamu dari akses, perubahan, atau pengungkapan yang tidak sah.
                        </p>
                    </Section>

                    <Section title="5. Hak Kamu">
                        <p>
                            Kamu dapat mengakses, memperbarui, atau meminta penghapusan data pribadi kamu kapan saja lewat pengaturan akun atau dengan menghubungi tim dukungan kami. Kamu juga dapat memilih keluar dari komunikasi yang bersifat tidak wajib.
                        </p>
                    </Section>

                    <Section title="6. Cookie">
                        <p>
                            Kami menggunakan cookie dan teknologi serupa untuk menjaga sesi login kamu, mengingat preferensi kamu, dan memahami cara kamu menggunakan SuntikSosmed. Kamu dapat mengatur preferensi cookie lewat pengaturan browser kamu.
                        </p>
                    </Section>

                    <Section title="7. Perubahan Kebijakan Ini">
                        <p>
                            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan lewat email atau pemberitahuan di situs kami sebelum berlaku.
                        </p>
                    </Section>

                    <Section title="8. Hubungi Kami">
                        <p>
                            Kalau kamu punya pertanyaan seputar Kebijakan Privasi ini, hubungi kami di{' '}
                            <a href="mailto:support@suntiksosmed.store" className="text-[#B9FF66] hover:underline">support@suntiksosmed.store</a>.
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