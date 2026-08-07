// Cache buat katalog publik (/api/services).
//
// Dipisah jadi DUA lapis:
//
// 1. rawCache — daftar layanan mentah dari provider. Ini bagian yang mahal
//    (HTTP ke SMMSOC, ribuan baris), jadi disimpan pakai TTL.
//
// 2. groupedCache — hasil jadi yang dikirim ke browser, disimpan dengan
//    KUNCI berisi markup + kurs + daftar layanan nonaktif. Begitu admin
//    ngubah salah satunya, kuncinya beda dan cache lama otomatis gak
//    kepakai — gak perlu ada yang manggil invalidate.
//
// Kenapa gak andalin invalidate manual: di Next.js, state level modul GAK
// dijamin kebagi antar route handler (tiap route bisa punya module graph
// sendiri, apalagi di dev). Jadi invalidateServicesCache() yang dipanggil
// dari /api/admin/settings bisa aja ngosongin salinan cache yang beda dari
// yang dibaca /api/services — kelihatannya jalan, padahal harga lama tetap
// nyangkut. Kunci berbasis nilai gak punya masalah itu.

export const RAW_TTL_MS = 5 * 60 * 1000;

let rawCache = { at: 0, data: null };
let groupedCache = { key: null, payload: null };

export function readRawServices() {
    if (!rawCache.data) return null;
    if (Date.now() - rawCache.at > RAW_TTL_MS) return null;
    return rawCache.data;
}

// Jaring pengaman kalau provider lagi error: lebih baik nyajiin katalog agak
// basi daripada halaman pelanggan kosong.
export function readStaleRawServices() {
    return rawCache.data;
}

export function writeRawServices(data) {
    rawCache = { at: Date.now(), data };
}

export function buildCacheKey({ markupPersen, kursUsdIdr, disabledIds }) {
    const disabled = [...disabledIds].sort().join(',');
    return `${markupPersen}|${kursUsdIdr}|${disabled}`;
}

export function readGroupedServices(key) {
    return groupedCache.key === key ? groupedCache.payload : null;
}

export function writeGroupedServices(key, payload) {
    groupedCache = { key, payload };
}

export function invalidateServicesCache() {
    rawCache = { at: 0, data: null };
    groupedCache = { key: null, payload: null };
}