import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { getServices } from '../../../../lib/provider';

/* -------------------------------------------------------------------- *
 * PENTING — CEK DULU SEBELUM DEPLOY
 *
 * Endpoint ini sekarang KHUSUS ADMIN. Sebelumnya kebuka tanpa auth sama
 * sekali, jadi siapa pun bisa narik katalog mentah provider — termasuk
 * rate modal, yang artinya margin kita kebaca dari luar.
 *
 * Kalau halaman order PELANGGAN juga manggil /api/smm/services, jangan
 * pakai file ini apa adanya — halaman order bakal 403. Bikin endpoint
 * publik terpisah (mis. /api/services) yang cuma balikin field aman:
 *   { id, nama, kategori, min, max, harga_jual }
 * dengan harga_jual = rate provider + markup, dihitung DI SERVER. Rate
 * mentah provider jangan pernah nyampe browser.
 * -------------------------------------------------------------------- */

const CACHE_TTL_MS = 5 * 60 * 1000;

// Katalog provider jarang berubah dan isinya bisa ribuan baris. Tanpa
// cache, tiap admin buka panel = satu request penuh ke provider.
let cache = { at: 0, data: null };

export async function GET(request) {
    const { error } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const force = params.get('refresh') === '1';
    const isStale = !cache.data || force || Date.now() - cache.at > CACHE_TTL_MS;

    if (isStale) {
        try {
            const services = await getServices();
            cache = { at: Date.now(), data: Array.isArray(services) ? services : [] };
        } catch (err) {
            console.error('getServices dari provider gagal:', err.message);
            // Masih ada cache lama? Pakai itu daripada bikin panel error.
            if (!cache.data) {
                return NextResponse.json({ error: 'Gagal mengambil daftar layanan.' }, { status: 500 });
            }
        }
    }

    // Kartu "Total Service" di Overview cuma butuh angkanya — gak perlu
    // ngirim ribuan baris cuma buat dihitung .length di browser.
    if (params.get('count') === '1') {
        return NextResponse.json({ count: cache.data.length, cachedAt: cache.at });
    }

    return NextResponse.json({ services: cache.data, cachedAt: cache.at });
}