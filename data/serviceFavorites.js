// Daftar ID layanan yang ditandai favorit pengguna di halaman Pesan Layanan.
// Masih lewat localStorage (per-browser, per-perangkat) — begitu backend
// ada, ganti jadi tabel `favorite_services` per user di database, biar
// favoritnya kebawa lintas perangkat.

const FAVORITE_SERVICES_KEY = 'suntik_favorite_services';

export function loadFavoriteServiceIds() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(FAVORITE_SERVICES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveFavoriteServiceIds(ids) {
    try {
        window.localStorage.setItem(FAVORITE_SERVICES_KEY, JSON.stringify(ids));
    } catch {
        // localStorage penuh/diblokir — favorit tetap kepakai untuk sesi ini saja
    }
}

export function toggleFavoriteServiceId(id, currentIds) {
    const idStr = String(id);
    const exists = currentIds.includes(idStr);
    const next = exists ? currentIds.filter((x) => x !== idStr) : [...currentIds, idStr];
    saveFavoriteServiceIds(next);
    return next;
}