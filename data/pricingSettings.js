// Pengaturan yang diatur admin, tersimpan di tabel `settings` (database),
// bukan localStorage — jadi begitu admin ubah, SEMUA pelanggan (di perangkat
// manapun) langsung kepakai nilai yang sama.
//
// File ini dibaca lewat /api/settings/pricing (route publik, pakai service
// role di server) — BUKAN query langsung ke tabel `settings` dari browser.
// Komponen ADMIN tetap baca/tulis lewat /api/admin/settings (pakai Secret
// key), BUKAN lewat file ini.
//
// CATATAN PENTING soal markup & kurs:
// loadMarkupPersen() dan loadKursUsdIdr() sudah DIHAPUS dari file ini, dan
// /api/settings/pricing gak ngirim dua angka itu lagi. Harga jual sekarang
// dihitung DI SERVER (app/api/services/route.js), jadi browser gak perlu —
// dan gak boleh — tau angka modalnya. Kalau keduanya dikasih ke client,
// modal per layanan bisa dihitung mundur dari harga jual dan margin kita
// kebaca dari luar.
//
// DEFAULT_MARKUP_PERSEN & DEFAULT_KURS_USD_IDR sengaja tetap diekspor karena
// dipakai sebagai fallback DI SERVER oleh app/api/services/route.js. Jangan
// dipakai buat ngitung harga di komponen client.

export const DEFAULT_MARKUP_PERSEN = 20;
export const DEFAULT_KURS_USD_IDR = 15800;
export const DEFAULT_REFERRAL_KOMISI_PERSEN = 5;

// Di-cache dalam satu kunjungan halaman biar pemanggil gak fetch
// sendiri-sendiri ke endpoint yang sama.
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

export async function loadReferralKomisiPersen() {
    const data = await loadAllSettings();
    const value = Number(data.referral_komisi_persen);
    return Number.isFinite(value) ? value : DEFAULT_REFERRAL_KOMISI_PERSEN;
}