import { NextResponse } from 'next/server';
import { getServices } from '@/lib/provider';
import { createAdminClient } from '@/lib/supabase/admin';
import { groupServices } from '@/data/liveCatalog';
import { filterDisabledFromCatalog } from '@/data/serviceOverrides';
import { DEFAULT_MARKUP_PERSEN, DEFAULT_KURS_USD_IDR } from '@/data/pricingSettings';
import {
    buildCacheKey,
    readGroupedServices,
    readRawServices,
    readStaleRawServices,
    writeGroupedServices,
    writeRawServices,
} from '@/lib/servicesCache';

/* -------------------------------------------------------------------- *
 * Katalog layanan versi PUBLIK.
 *
 * Sebelumnya halaman pelanggan narik /api/smm/services (katalog mentah,
 * ada field `rate` = modal per 1000 dalam USD), terus ngaliin kurs +
 * markup DI BROWSER. Akibatnya rate modal, kurs, dan markup semuanya
 * kebaca siapa pun yang buka DevTools — margin per layanan bisa dihitung
 * persis.
 *
 * Di sini semua perhitungan jalan di server. Yang kekirim ke browser cuma
 * `pricePer1000` dalam rupiah; `rate`, kurs, dan markup gak pernah ikut.
 *
 * /api/smm/services tetap ada dan tetap admin-only — itu yang dipakai
 * panel admin buat ngitung margin.
 * -------------------------------------------------------------------- */

// Tabel `settings` bentuknya key-value (satu baris per pengaturan), sama
// persis kayak yang dibaca /api/settings/pricing. Bukan satu baris dengan
// kolom markup_persen & kurs_usd_idr.
async function loadPricing(supabase) {
    const fallback = { markupPersen: DEFAULT_MARKUP_PERSEN, kursUsdIdr: DEFAULT_KURS_USD_IDR };

    try {
        const { data, error } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['markup_persen', 'kurs_usd_idr']);

        if (error) {
            console.error('Gagal baca settings harga:', error.message);
            return fallback;
        }

        const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
        const markup = Number(map.markup_persen);
        const kurs = Number(map.kurs_usd_idr);

        // Fallback dipakai per-nilai, bukan sekaligus — kalau salah satu
        // kosong, yang satunya tetap pakai angka asli dari database.
        // Diam-diam jatuh ke default itu bahaya: markup default (20%) jauh
        // di bawah markup asli, jadi harga jual bisa anjlok tanpa ketahuan.
        if (!Number.isFinite(markup) || !Number.isFinite(kurs)) {
            console.error('settings markup_persen / kurs_usd_idr tidak terbaca, pakai default.');
        }

        return {
            markupPersen: Number.isFinite(markup) ? markup : DEFAULT_MARKUP_PERSEN,
            kursUsdIdr: Number.isFinite(kurs) ? kurs : DEFAULT_KURS_USD_IDR,
        };
    } catch (err) {
        console.error('Gagal baca settings harga:', err.message);
        return fallback;
    }
}

async function loadDisabledIds(supabase) {
    try {
        const { data, error } = await supabase.from('disabled_services').select('*');
        if (error) {
            console.error('Gagal baca disabled_services:', error.message);
            return [];
        }
        // Nama kolomnya diambil fleksibel biar gak nebak-nebak skema.
        return (data || [])
            .map((row) => String(row.service_id ?? row.serviceId ?? row.id ?? ''))
            .filter(Boolean);
    } catch (err) {
        console.error('Gagal baca disabled_services:', err.message);
        return [];
    }
}

export async function GET(request) {
    const force = new URL(request.url).searchParams.get('refresh') === '1';
    const supabase = createAdminClient();

    // Pengaturan harga dibaca SETIAP request — ini cuma satu query kecil ke
    // Supabase, dan bikin perubahan markup/kurs langsung kepakai tanpa perlu
    // nunggu TTL atau ngandelin invalidate lintas route.
    const [pricing, disabledIds] = await Promise.all([loadPricing(supabase), loadDisabledIds(supabase)]);
    const cacheKey = buildCacheKey({ ...pricing, disabledIds });

    if (!force) {
        const cached = readGroupedServices(cacheKey);
        if (cached) return NextResponse.json(cached);
    }

    try {
        // Yang di-cache pakai TTL cuma daftar mentah dari provider — bagian
        // yang mahal. Sisanya (markup, grouping) dihitung ulang.
        let rawServices = force ? null : readRawServices();
        if (!rawServices) {
            rawServices = await getServices();
            writeRawServices(Array.isArray(rawServices) ? rawServices : []);
        }

        const grouped = groupServices(
            Array.isArray(rawServices) ? rawServices : [],
            pricing.kursUsdIdr,
            pricing.markupPersen
        );

        const platforms = filterDisabledFromCatalog(grouped, disabledIds);
        const payload = { platforms, cachedAt: Date.now() };

        writeGroupedServices(cacheKey, payload);
        return NextResponse.json(payload);
    } catch (err) {
        console.error('Gagal menyusun katalog publik:', err.message);

        // Provider lagi ngambek tapi masih punya salinan mentah? Pakai itu —
        // tetap dihitung ulang pakai markup/kurs yang berlaku sekarang, jadi
        // harganya gak pernah basi walau katalognya iya.
        const stale = readStaleRawServices();
        if (stale) {
            const grouped = groupServices(stale, pricing.kursUsdIdr, pricing.markupPersen);
            return NextResponse.json({
                platforms: filterDisabledFromCatalog(grouped, disabledIds),
                cachedAt: Date.now(),
                stale: true,
            });
        }

        return NextResponse.json({ error: 'Gagal memuat layanan.' }, { status: 500 });
    }
}