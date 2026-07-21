import { NextResponse } from 'next/server';
import { getServices, placeOrder } from '../../../../lib/provider';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

// Asumsi: tabel `settings` berbentuk key-value (kolom `key` + `value`),
// ngikutin pola yang sama kayak PATCH di /api/admin/settings
// ({ key: 'markup_persen', value }). Kalau skema aslinya beda, sesuaikan
// bagian ini.
async function loadPricingSettings(supabaseAdmin) {
    const { data } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .in('key', ['markup_persen', 'kurs_usd_idr']);

    const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
    return {
        markupPersen: Number(map.markup_persen) || 20,
        kursUsdIdr: Number(map.kurs_usd_idr) || 15800,
    };
}

export async function POST(request) {
    // Wajib login DULU sebelum bisa manggil endpoint ini.
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    }

    // Akun yang di-suspend admin gak boleh bisa bikin pesanan baru.
    const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle();

    if (profile?.status === 'Suspend') {
        return NextResponse.json({ error: 'Akun kamu ditangguhkan. Hubungi admin kalau ini keliru.' }, { status: 403 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { serviceId, link, quantity, comments } = body || {};
    const quantityNum = Number(quantity);

    if (!serviceId || !link || !quantityNum) {
        return NextResponse.json({ error: 'serviceId, link, dan quantity wajib diisi.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Harga dihitung ULANG di sini dari data provider + settings asli — BUKAN
    // percaya angka harga yang (kalaupun) dikirim dari client, biar gak bisa
    // dimanipulasi lewat DevTools/curl.
    let service;
    try {
        const services = await getServices();
        service = (services || []).find((s) => String(s.service) === String(serviceId));
    } catch (err) {
        console.error('getServices dari provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal mengambil data layanan. Silakan coba lagi beberapa saat.' }, { status: 502 });
    }

    if (!service) {
        return NextResponse.json({ error: 'Layanan tidak ditemukan di provider.' }, { status: 400 });
    }

    const min = Number(service.min) || 1;
    const max = Number(service.max) || 0;
    if (quantityNum < min || (max > 0 && quantityNum > max)) {
        return NextResponse.json({ error: `Jumlah harus antara ${min} - ${max}.` }, { status: 400 });
    }

    const { markupPersen, kursUsdIdr } = await loadPricingSettings(supabaseAdmin);
    const rateUsd = Number(service.rate) || 0;
    const pricePer1000 = rateUsd * kursUsdIdr * (1 + markupPersen / 100);
    const price = Math.round((pricePer1000 * quantityNum) / 1000);

    if (price <= 0) {
        return NextResponse.json({ error: 'Gagal menghitung harga layanan.' }, { status: 500 });
    }

    // Potong saldo DULU, atomic & gagal otomatis kalau saldo kurang — baru
    // kalau ini berhasil, order beneran dikirim ke provider (jadi kalau
    // saldo kurang, provider gak pernah ke-charge sama sekali).
    const { data: newBalance, error: deductError } = await supabase.rpc('deduct_balance', { amount: price });

    if (deductError) {
        const isInsufficientBalance = /insufficient|kurang|saldo/i.test(deductError.message);
        console.error('deduct_balance gagal:', deductError.message);
        const msg = isInsufficientBalance
            ? 'Saldo kamu tidak cukup. Silakan top up dulu.'
            : 'Gagal memproses saldo. Silakan coba lagi atau hubungi dukungan.';
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    try {
        const result = await placeOrder({ serviceId, link, quantity: quantityNum, comments });
        return NextResponse.json({ order: result?.order, price, newBalance: Number(newBalance) });
    } catch (err) {
        // Order ke provider gagal PADAHAL saldo udah kepotong -> refund balik
        // biar pelanggan gak rugi. Pakai supabaseAdmin (BUKAN supabase biasa),
        // soalnya add_balance bakal di-revoke dari role authenticated -- kalau
        // masih pakai session user di sini, refund ini bakal ikut gagal.
        await supabaseAdmin.rpc('add_balance', { amount: price });
        console.error('placeOrder ke provider gagal:', err.message);
        return NextResponse.json(
            { error: 'Pesanan gagal diproses. Saldo kamu sudah dikembalikan — silakan coba lagi atau hubungi dukungan kalau masalah berlanjut.' },
            { status: 400 }
        );
    }
}