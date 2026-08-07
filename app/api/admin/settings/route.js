import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/verifyAdmin';
import { logActivity } from '@/lib/supabase/logActivity';
import { invalidateServicesCache } from '@/lib/servicesCache';

// Key yang boleh ditulis. Tanpa daftar ini, `key` dari body request masuk
// mentah ke upsert — satu typo di sisi client langsung bikin baris sampah
// baru di tabel settings, dan gak bakal ketahuan sampai ada yang nyari
// kenapa nilainya gak kepakai.
const ALLOWED_KEYS = ['markup_persen', 'kurs_usd_idr', 'referral_komisi_persen'];

// Batas wajar per key. Kurs 0 bikin semua harga jadi Rp 0, markup -100 bikin
// pembagian di perhitungan harga meledak. Dua-duanya kerugian langsung, jadi
// lebih baik ditolak di sini daripada ketahuan dari omset yang anjlok.
const NUMERIC_RANGE = {
    markup_persen: { min: 0, max: 1000 },
    kurs_usd_idr: { min: 1000, max: 100000 },
    referral_komisi_persen: { min: 0, max: 100 },
};

// Ubah salah satu dari ini dan harga jual ikut berubah -> katalog publik
// yang udah ke-cache harus dibuang.
const AFFECTS_PRICING = ['markup_persen', 'kurs_usd_idr'];

export async function GET(request) {
    const { error, status, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: status || 401 });

    const { data, error: queryError } = await supabaseAdmin.from('settings').select('key, value');

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const settings = {};
    (data || []).forEach((row) => {
        settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
}

export async function PATCH(request) {
    const { error, status, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: status || 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { key, value } = body || {};
    if (!key || value === undefined || value === null) {
        return NextResponse.json({ error: 'key dan value wajib diisi.' }, { status: 400 });
    }

    if (!ALLOWED_KEYS.includes(key)) {
        return NextResponse.json({ error: `Pengaturan "${key}" tidak dikenal.` }, { status: 400 });
    }

    const range = NUMERIC_RANGE[key];
    if (range) {
        const num = Number(value);
        if (!Number.isFinite(num) || num < range.min || num > range.max) {
            return NextResponse.json(
                { error: `Nilai harus angka antara ${range.min} dan ${range.max}.` },
                { status: 400 }
            );
        }
    }

    const { error: upsertError } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() });

    if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    // Buang cache katalog begitu markup/kurs berubah, biar harga baru
    // langsung kepakai. Tanpa ini admin harus nunggu TTL habis (5 menit)
    // atau buka /api/services?refresh=1 manual — gampang kelupaan, dan
    // sementara itu pelanggan masih liat harga lama.
    if (AFFECTS_PRICING.includes(key)) {
        invalidateServicesCache();
    }

    const labelMap = {
        markup_persen: 'markup global',
        kurs_usd_idr: 'kurs USD → IDR',
        referral_komisi_persen: 'komisi referral',
    };

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Pengaturan',
        detail: `Mengubah ${labelMap[key] || key} jadi ${value}`,
    }).catch((err) => console.error('logActivity gagal:', err.message));

    return NextResponse.json({ success: true });
}