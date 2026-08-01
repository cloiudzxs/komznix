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

// Label tampilan (nama layanan versi Indonesia + nama platform) cuma ada di
// sisi client, provider gak nyediain. Nilai ini murni kosmetik buat kolom
// `layanan`/`platform` di riwayat -- gak dipakai buat hitung harga apa pun --
// tapi tetep dibersihin dan dipotong panjangnya biar gak ada yang nyuntik
// teks raksasa ke tabel.
function sanitizeLabel(value, fallback, maxLength) {
    const raw = typeof value === 'string' ? value.trim() : '';
    const chosen = raw || String(fallback || '-');
    return chosen.replace(/\s+/g, ' ').slice(0, maxLength);
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

    const { serviceId, link, quantity, comments, layananLabel, platformLabel } = body || {};
    const quantityNum = Number(quantity);

    if (!serviceId || !link || !quantityNum) {
        return NextResponse.json({ error: 'serviceId, link, dan quantity wajib diisi.' }, { status: 400 });
    }

    const targetLink = String(link).trim();
    if (!targetLink || targetLink.length > 500) {
        return NextResponse.json({ error: 'Target pesanan tidak valid.' }, { status: 400 });
    }

    // Untuk layanan Custom Comments, jumlah pesanan HARUS sama persis dengan
    // banyaknya baris komentar. Client udah ngunci ini di form, tapi form bisa
    // dilewati (curl) -- jadi divalidasi ulang di sini biar jumlah yang dibayar
    // gak beda dari jumlah komentar yang beneran dikirim ke provider.
    if (typeof comments === 'string' && comments.trim()) {
        const lineCount = comments.split('\n').filter((line) => line.trim() !== '').length;
        if (lineCount !== quantityNum) {
            return NextResponse.json(
                { error: 'Jumlah pesanan harus sama dengan banyaknya baris komentar.' },
                { status: 400 }
            );
        }
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

    let providerOrderId;
    try {
        const result = await placeOrder({ serviceId, link: targetLink, quantity: quantityNum, comments });
        providerOrderId = result?.order;
    } catch (err) {
        // Order ke provider gagal PADAHAL saldo udah kepotong -> refund balik
        // biar pelanggan gak rugi. Pakai supabaseAdmin (BUKAN supabase biasa),
        // soalnya add_balance udah di-revoke dari role authenticated -- kalau
        // masih pakai session user di sini, refund ini bakal ikut gagal.
        await supabaseAdmin.rpc('add_balance', { amount: price });
        console.error('placeOrder ke provider gagal:', err.message);
        return NextResponse.json(
            { error: 'Pesanan gagal diproses. Saldo kamu sudah dikembalikan — silakan coba lagi atau hubungi dukungan kalau masalah berlanjut.' },
            { status: 400 }
        );
    }

    // Baris `orders` ditulis DI SINI, bukan dari browser.
    //
    // Sebelumnya dashboard yang nge-insert sendiri lewat supabase client, yang
    // artinya siapa pun bisa buka console dan ngarang pesanan palsu: harga
    // bebas, status 'Selesai', bahkan refunded=true. Itu langsung ngerusak
    // menu Refund, riwayat pemakaian saldo, dan seluruh statistik admin.
    // Sekarang cuma service role yang boleh nulis ke tabel ini, dan `harga`
    // yang masuk adalah harga hasil hitungan server di atas.
    let orderRow = null;
    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
            user_id: user.id,
            provider_order_id: providerOrderId ? String(providerOrderId) : null,
            layanan: sanitizeLabel(layananLabel, service.name, 150),
            platform: sanitizeLabel(platformLabel, service.category, 50),
            target: targetLink,
            jumlah: quantityNum,
            harga: price,
            status: 'Pending',
        })
        .select()
        .single();

    if (insertError) {
        // Order UDAH masuk ke provider dan saldo UDAH kepotong, jadi jangan
        // refund di sini — pesanannya beneran jalan. Yang hilang cuma
        // pencatatannya, dan itu harus keliatan jelas di log biar bisa
        // dimasukin manual lewat admin.
        console.error(
            `GAGAL menyimpan pesanan ke database. user_id=${user.id} provider_order_id=${providerOrderId} harga=${price}:`,
            insertError.message
        );
    } else {
        orderRow = inserted;
    }

    return NextResponse.json({
        order: providerOrderId, // ID dari provider, dipakai buat layar sukses di OrderForm
        orderRow, // baris database yang baru dibuat (null kalau insert gagal)
        price,
        newBalance: Number(newBalance),
    });
}