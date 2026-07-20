// Daftar ID layanan yang dinonaktifkan admin lewat halaman Kelola Layanan.
// Dibaca lagi oleh OrderForm & DaftarLayananSection di sisi pelanggan buat
// nyaring layanan yang gak boleh ditampilkan. Masih lewat localStorage (jadi
// baru "nyambung" kalau admin & pelanggan buka di browser yang sama) —
// begitu backend ada, ganti jadi kolom `aktif` di tabel `services`.

const DISABLED_SERVICES_KEY = 'suntik_disabled_services';

export function loadDisabledServiceIds() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(DISABLED_SERVICES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveDisabledServiceIds(ids) {
    try {
        window.localStorage.setItem(DISABLED_SERVICES_KEY, JSON.stringify(ids));
    } catch {
        // localStorage penuh/diblokir — pengaturan tetap kepakai untuk sesi ini saja
    }
}

export function toggleDisabledServiceId(id, currentDisabledIds) {
    const idStr = String(id);
    const exists = currentDisabledIds.includes(idStr);
    const next = exists ? currentDisabledIds.filter((x) => x !== idStr) : [...currentDisabledIds, idStr];
    saveDisabledServiceIds(next);
    return next;
}

// Buang layanan yang dinonaktifkan dari struktur platform -> kategori ->
// layanan, lalu buang juga kategori/platform yang jadi kosong gara-gara itu.
export function filterDisabledFromCatalog(platforms, disabledIds) {
    if (!disabledIds || disabledIds.length === 0) return platforms;
    const disabledSet = new Set(disabledIds.map(String));

    return platforms
        .map((platform) => {
            const categories = platform.categories
                .map((category) => ({
                    ...category,
                    services: category.services.filter((s) => !disabledSet.has(String(s.id))),
                }))
                .filter((category) => category.services.length > 0);
            return { ...platform, categories };
        })
        .filter((platform) => platform.categories.length > 0);
}