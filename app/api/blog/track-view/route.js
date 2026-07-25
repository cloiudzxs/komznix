// Simpan sebagai: app/api/blog/track-view/route.js
//
// Route publik (gak perlu login) -- dipanggil dari komponen client
// BlogViewTracker.jsx tiap kali artikel blog beneran dibuka di browser.
//
// PENTING kenapa ini gak ditaruh langsung di Server Component
// app/blog/[slug]/page.jsx: halaman itu pakai `revalidate = 300` (ISR,
// cache 5 menit). Kalau increment-nya ditaruh di body Server Component,
// dia cuma jalan sekali tiap kali Next.js REGENERATE halaman itu (~tiap 5
// menit), bukan tiap kali ada orang beneran buka halamannya -- jumlah view
// bakal jauh lebih kecil dari kenyataan. Route terpisah yang dipanggil dari
// client (browser) ini jalan di SETIAP kunjungan beneran, lepas dari cache.
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { slug } = body || {};
    if (!slug) return NextResponse.json({ error: 'slug wajib diisi.' }, { status: 400 });

    const supabaseAdmin = createAdminClient();

    // UPDATE ... SET views = views + 1 itu atomic di level row Postgres --
    // gak butuh RPC/row-lock kayak komisi_balance, karena increment-nya
    // dilakuin langsung dalam satu statement SQL, bukan baca-lalu-tulis di
    // kode aplikasi.
    const { error } = await supabaseAdmin.rpc('increment_blog_view', { post_slug: slug });

    if (error) {
        // Gagal nyatet view BUKAN error yang perlu ganggu pengalaman baca
        // artikel -- diem-diem aja, jangan sampe bikin sesuatu di UI rusak
        // gara-gara ini.
        console.error('[track-view] gagal increment:', error.message);
        return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
}