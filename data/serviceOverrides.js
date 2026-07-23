// Simpan sebagai: data/serviceOverrides.js (ganti file lama)
//
// Daftar ID layanan yang dinonaktifkan admin lewat halaman Kelola Layanan.
// Sekarang beneran nyambung lewat Supabase (tabel `disabled_services`) --
// bukan localStorage lagi, jadi admin nonaktifin di satu tempat langsung
// kefilter buat semua pelanggan.

export async function loadDisabledServiceIds() {
    try {
        const res = await fetch('/api/services/disabled');
        const data = await res.json();
        if (!res.ok || data.error) return [];
        return Array.isArray(data.ids) ? data.ids.map(String) : [];
    } catch {
        return [];
    }
}

// disable=true buat nonaktifin, false buat aktifin lagi. Butuh sesi admin
// (route /api/admin/services pakai verifyAdmin), jadi cuma dipanggil dari
// ServicesManager (halaman admin).
export async function toggleDisabledServiceId(id, currentDisabledIds, disable) {
    const idStr = String(id);
    const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: idStr, disabled: disable }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengubah status layanan.');
    }

    const exists = currentDisabledIds.includes(idStr);
    if (disable && !exists) return [...currentDisabledIds, idStr];
    if (!disable && exists) return currentDisabledIds.filter((x) => x !== idStr);
    return currentDisabledIds;
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