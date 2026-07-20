// Pengaturan-pengaturan yang diatur admin (markup%, kurs USD->IDR, komisi
// referral%), sekarang tersimpan di tabel `settings` (database), bukan
// localStorage lagi — jadi begitu admin ubah, SEMUA pelanggan (di
// perangkat manapun) langsung kepakai nilai yang sama.
//
// File ini dibaca lewat /api/settings/pricing (route publik, pakai service
// role di server) — BUKAN query langsung ke tabel `settings` dari browser
// lagi. Sebelumnya pakai Supabase client sisi browser, yang kena RLS dan
// gagal (401) buat pengunjung yang belum login (mis. halaman /layanan
// publik). Komponen ADMIN tetap baca/tulis lewat /api/admin/settings (pakai
// Secret key), BUKAN lewat file ini.

export const DEFAULT_MARKUP_PERSEN = 20;
export const DEFAULT_KURS_USD_IDR = 15800;
export const DEFAULT_REFERRAL_KOMISI_PERSEN = 5;

// Di-cache dalam satu kunjungan halaman biar 3 fungsi di bawah gak
// masing-masing fetch sendiri-sendiri ke endpoint yang sama.
let cachedSettings = null;
let cachedPromise = null;

async function loadAllSettings() {
    if (cachedSettings) return cachedSettings;
    if (!cachedPromise) {
        cachedPromise = fetch('/api/settings/pricing')
            .then((res) => res.json())
            .then((data) => {
                cachedSettings = data;
                return data;
            })
            .catch(() => ({}));
    }
    return cachedPromise;
}

export async function loadMarkupPersen() {
    const data = await loadAllSettings();
    const value = Number(data.markup_persen);
    return Number.isFinite(value) ? value : DEFAULT_MARKUP_PERSEN;
}

export async function loadKursUsdIdr() {
    const data = await loadAllSettings();
    const value = Number(data.kurs_usd_idr);
    return Number.isFinite(value) ? value : DEFAULT_KURS_USD_IDR;
}

export async function loadReferralKomisiPersen() {
    const data = await loadAllSettings();
    const value = Number(data.referral_komisi_persen);
    return Number.isFinite(value) ? value : DEFAULT_REFERRAL_KOMISI_PERSEN;
}