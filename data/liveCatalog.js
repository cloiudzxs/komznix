// Logic bersama buat ambil & olah data layanan LIVE dari provider (SMMSOC)
// lewat /api/smm/services — dipakai bareng oleh OrderForm (halaman Pesan
// Layanan) dan DaftarLayananSection (halaman Daftar Layanan), biar kamus
// terjemahan & logic pengelompokan platform cuma ada di SATU tempat. Kalau
// nemu istilah yang belum keterjemahan, cukup tambah di TRANSLATE_DICTIONARY
// di bawah — otomatis kepakai di kedua halaman.

const TRANSLATE_DICTIONARY = [
    [/real \+ mix accounts/gi, 'Real + Akun Campuran'],
    [/mix accounts/gi, 'Akun Campuran'],
    [/real accounts?/gi, 'Akun Real'],
    [/real active/gi, 'Akun Aktif'],
    [/real profiles?/gi, 'Profil Real'],
    [/real data/gi, 'Data Real'],
    [/real indian/gi, 'India Real'],
    [/hq accounts?/gi, 'Akun HQ'],
    [/old accounts?/gi, 'Akun Lama'],
    [/new accounts?/gi, 'Akun Baru'],
    [/app data/gi, 'Data Aplikasi'],
    [/cheapest on the market/gi, 'Termurah di Pasaran'],
    [/cheapest/gi, 'Termurah'],
    [/cheap/gi, 'Murah'],
    [/lowest price/gi, 'Harga Termurah'],
    [/best price/gi, 'Harga Terbaik'],
    [/best data/gi, 'Data Terbaik'],
    [/best services?/gi, 'Layanan Terbaik'],
    [/high quality/gi, 'Kualitas Tinggi'],
    [/high speed/gi, 'Kecepatan Tinggi'],
    [/ultra ?fast speed/gi, 'Kecepatan Sangat Cepat'],
    [/ultra speed/gi, 'Kecepatan Ultra'],
    [/different speed/gi, 'Kecepatan Berbeda'],
    [/fast speed/gi, 'Kecepatan Cepat'],
    [/fast completed/gi, 'Selesai Cepat'],
    [/almost no drop/gi, 'Hampir Tanpa Drop'],
    [/no drop/gi, 'Tanpa Drop'],
    [/non drop/gi, 'Tanpa Drop'],
    [/low drop/gi, 'Drop Rendah'],
    [/less drops?/gi, 'Drop Minim'],
    [/update working/gi, 'Update Berfungsi'],
    [/refill button working/gi, 'Tombol Refill Berfungsi'],
    [/working/gi, 'Berfungsi'],
    [/auto refill/gi, 'Isi Ulang Otomatis'],
    [/with posts?/gi, 'dengan Postingan'],
    [/english names?/gi, 'Nama Inggris'],
    [/women/gi, 'Wanita'],
    [/\bmen\b/gi, 'Pria'],
    [/recommended/gi, 'Direkomendasikan'],
    [/\bnew\b/gi, 'BARU'],
    // Entity HTML yang kadang kebawa mentah dari provider.
    [/&amp;/gi, '&'],
    // Kualitas & label umum lainnya.
    [/premium quality/gi, 'Kualitas Premium'],
    [/good quality/gi, 'Kualitas Bagus'],
    [/top quality/gi, 'Kualitas Terbaik'],
    [/instant delivery/gi, 'Pengiriman Instan'],
    [/instant start/gi, 'Mulai Instan'],
    [/cancel enable/gi, 'Bisa Dibatalkan'],
    [/\binstant\b/gi, 'Instan'],
    [/guaranteed/gi, 'Bergaransi'],
    [/lifetime guarantee/gi, 'Garansi Seumur Hidup'],
    [/\blifetime\b/gi, 'Seumur Hidup'],
    [/stable/gi, 'Stabil'],
    [/active users?/gi, 'Pengguna Aktif'],
    [/real users?/gi, 'Pengguna Real'],
    [/fast delivery/gi, 'Pengiriman Cepat'],
    [/slow delivery/gi, 'Pengiriman Lambat'],
    [/no refill/gi, 'Tanpa Refill'],
    [/with refill/gi, 'Dengan Refill'],
    [/day(s)? guarantee/gi, 'Hari Garansi'],
    [/limited time/gi, 'Waktu Terbatas'],
    [/best seller/gi, 'Terlaris'],
    [/most popular/gi, 'Paling Populer'],
    // Nama negara yang sering dipakai sebagai target spesifik.
    [/turkey/gi, 'Turki'],
    [/brazil/gi, 'Brasil'],
    [/indian\b/gi, 'India'],
    [/indonesian?\b/gi, 'Indonesia'],
    [/american\b/gi, 'Amerika'],
    [/european\b/gi, 'Eropa'],
    [/worldwide/gi, 'Seluruh Dunia'],
    [/global/gi, 'Global'],
    // Nama negara tambahan yang sering muncul sebagai target spesifik.
    [/saudi arabia/gi, 'Arab Saudi'],
    [/\busa\b/gi, 'Amerika'],
    [/united states/gi, 'Amerika Serikat'],
    [/\buk\b/gi, 'Inggris'],
    [/\bpakistan\b/gi, 'Pakistan'],
    [/\bkorea\b/gi, 'Korea'],
    [/\bvietnam\b/gi, 'Vietnam'],
    [/\bnigeria\b/gi, 'Nigeria'],
    [/\bmexico\b/gi, 'Meksiko'],
    [/\bphilippines?\b/gi, 'Filipina'],
    [/\bthailand\b/gi, 'Thailand'],
    [/\bmalaysia\b/gi, 'Malaysia'],
    [/\bgermany\b/gi, 'Jerman'],
    [/\bfrance\b/gi, 'Prancis'],
    [/\bjapan\b/gi, 'Jepang'],
    [/\brussia\b/gi, 'Rusia'],
    [/\bchina\b/gi, 'China'],
    [/\begypt\b/gi, 'Mesir'],
    // Istilah umum lain di nama/kategori layanan.
    [/\bservices?\b/gi, 'Layanan'],
    [/\bbest\b/gi, 'Terbaik'],
    [/\bsave\b/gi, 'Simpan'],
    [/\bmax\b/gi, 'Maks'],
    [/\bday (\d+[kKmM]?)\b/gi, '$1/Hari'],
    [/\bdays?\b/gi, 'Hari'],
    // Batch tambahan hasil analisis 2895 layanan asli dari katalog SMMSOC.
    [/don'?t use/gi, 'Jangan Dipakai'],
    [/other ad/gi, 'Iklan Lain'],
    [/\bunlimited\b/gi, 'Tak Terbatas'],
    [/\btargeted\b/gi, 'Tertarget'],
    [/\bweekly\b/gi, 'Mingguan'],
    [/\bdaily\b/gi, 'Harian'],
    [/\bmonthly\b/gi, 'Bulanan'],
    [/\bcountry\b/gi, 'Negara'],
    [/\bhidden\b/gi, 'Tersembunyi'],
    [/\bcompleted\b/gi, 'Selesai'],
    [/\bcomplete\b/gi, 'Selesai'],
    [/\bsearch\b/gi, 'Pencarian'],
    [/\bkeywords?\b/gi, 'Kata Kunci'],
    [/\bretention\b/gi, 'Retensi'],
    [/\bbutton\b/gi, 'Tombol'],
    [/\blisteners?\b/gi, 'Pendengar'],
    [/\bbrazilian\b/gi, 'Brasil'],
    [/\bturkish\b/gi, 'Turki'],
    [/\bconcurrent\b/gi, 'Bersamaan'],
    [/\busers?\b/gi, 'Pengguna'],
    [/\bfeatures?\b/gi, 'Fitur'],
    [/\bsuggested?\b/gi, 'Disarankan'],
    [/\bdelivery\b/gi, 'Pengiriman'],
    [/\bvotes?\b/gi, 'Suara'],
    [/\bprice\b/gi, 'Harga'],
    [/\bminutes?\b/gi, 'Menit'],
    [/\bhours?\b/gi, 'Jam'],
    [/\bhr\b/gi, 'Jam'],
    [/\bquality\b/gi, 'Kualitas'],
    [/\bsource\b/gi, 'Sumber'],
    [/\bspeed\b/gi, 'Kecepatan'],
    [/\btime\b/gi, 'Waktu'],
    // Kata generik ini sengaja ditaruh paling akhir — biar frasa yang lebih
    // spesifik (mis. "Real Accounts", "No Refill") kena duluan sebelum kata
    // tunggalnya diganti sendiri-sendiri.
    [/\baccounts?\b/gi, 'Akun'],
    [/\brefill\b/gi, 'Isi Ulang'],
    [/\bfast\b/gi, 'Cepat'],
    [/\breal\b/gi, 'Asli'],
];

export function translateText(text) {
    if (!text) return text;
    let result = text;
    for (const [pattern, replacement] of TRANSLATE_DICTIONARY) {
        result = result.replace(pattern, replacement);
    }
    // Hapus emoji bendera (pasangan "regional indicator symbol") — di banyak
    // perangkat Windows ini gak ke-render jadi gambar bendera, malah muncul
    // kotak kosong. Kode negaranya (mis. "TR", "BR", "SA") biasanya udah ada
    // di teksnya sendiri, jadi aman dihapus. Dropdown <select> juga gak bisa
    // dipaksa render gambar/font emoji custom, jadi ini satu-satunya cara
    // yang benar-benar konsisten di semua perangkat.
    result = result.replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '');
    result = result.replace(/[ \t]{2,}/g, ' ').trim();
    return result;
}

// Daftar kata kunci platform yang dikenali. Category dari provider gak
// selalu formatnya "Platform - Deskripsi" (kadang gak ada tanda "-" sama
// sekali, mis. "Instagram Followers [ Real Accounts ]"), jadi cara paling
// aman adalah cari kata kunci platform di dalam category/nama layanan,
// bukan asal potong string di karakter tertentu.
export const PLATFORM_KEYWORDS = [
    { match: 'instagram', label: 'Instagram' },
    { match: 'tiktok', label: 'TikTok' },
    { match: 'youtube', label: 'YouTube' },
    { match: 'facebook', label: 'Facebook' },
    { match: 'twitter', label: 'X / Twitter' },
    { match: 'telegram', label: 'Telegram' },
    { match: 'whatsapp', label: 'WhatsApp' },
    { match: 'threads', label: 'Threads' },
    { match: 'discord', label: 'Discord' },
    { match: 'twitch', label: 'Twitch' },
    { match: 'pinterest', label: 'Pinterest' },
    { match: 'spotify', label: 'Spotify' },
    { match: 'linkedin', label: 'LinkedIn' },
    { match: 'snapchat', label: 'Snapchat' },
    { match: 'kick', label: 'Kick' },
    { match: 'website', label: 'Website Traffic' },
];

function extractPlatformName(category, name) {
    const haystack = `${category || ''} ${name || ''}`.toLowerCase();
    const found = PLATFORM_KEYWORDS.find(({ match }) => haystack.includes(match));
    return found ? found.label : 'Lainnya';
}

// Ubah daftar layanan flat dari API SMMSOC jadi struktur
// platform -> kategori -> layanan, biar bisa dipakai UI yang sama kayak
// sebelumnya (yang tadinya baca dari data/services.js statis).
// Provider (SMMSOC) gak ngirim field "waktu rata-rata selesai" secara
// langsung — tapi banyak nama layanan mereka nyelipin kapasitas kirim per
// hari di dalam namanya sendiri, mis. "... | Day 100K 🚀" artinya sanggup
// kirim ~100.000/hari. Kita ambil angka itu dari nama ASLI (sebelum
// diterjemahkan), biar estimasi waktu selesai dihitung dari data yang
// beneran ada, bukan angka ngarang.
function parseDailyCapacity(rawName) {
    if (!rawName) return null;
    const match = rawName.match(/day\s*([\d.]+)\s*([km])?/i);
    if (!match) return null;
    let value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'k') value *= 1_000;
    if (unit === 'm') value *= 1_000_000;
    return value > 0 ? Math.round(value) : null;
}

// Susun deskripsi dari data yang beneran dikirim provider (kategori, status
// refill, status cancel, kapasitas harian) — bukan cuma "Tipe layanan: X."
// yang seringnya isinya "Default" doang dan gak informatif.
function buildDescription({ categoryLabel, refill, cancel, dailyCapacity }) {
    const sentences = [];
    if (categoryLabel) sentences.push(`${categoryLabel}.`);
    sentences.push(refill ? 'Bergaransi refill.' : 'Tidak ada garansi refill.');
    sentences.push(cancel ? 'Bisa dibatalkan sebelum selesai.' : 'Tidak bisa dibatalkan setelah dipesan.');
    if (dailyCapacity) {
        sentences.push(`Kapasitas kirim sekitar ${dailyCapacity.toLocaleString('id-ID')}/hari.`);
    }
    return sentences.join(' ');
}

export function groupServices(rawServices, kursUsdIdr, markupPersen) {
    const platformMap = new Map();

    for (const raw of rawServices) {
        const platformName = extractPlatformName(raw.category, raw.name);
        const rateUsd = Number(raw.rate) || 0;
        const pricePer1000 = rateUsd * kursUsdIdr * (1 + markupPersen / 100);

        const dailyCapacity = parseDailyCapacity(raw.name);
        const typeLabel =
            raw.type && raw.type.toLowerCase() !== 'default' ? translateText(raw.type) : null;

        const service = {
            id: raw.service,
            name: translateText(raw.name),
            pricePer1000,
            min: Number(raw.min) || 1,
            max: Number(raw.max) || 0,
            description: buildDescription({
                categoryLabel: translateText(raw.category),
                refill: Boolean(raw.refill),
                cancel: Boolean(raw.cancel),
                dailyCapacity,
            }),
            refill: Boolean(raw.refill),
            cancel: Boolean(raw.cancel),
            typeLabel,
            dailyCapacity,
            targetHint: raw.desc ? translateText(raw.desc) : 'Link/Username',
            favorite: false,
        };

        if (!platformMap.has(platformName)) {
            platformMap.set(platformName, { key: platformName, label: platformName, categoriesMap: new Map() });
        }
        const platformEntry = platformMap.get(platformName);

        // categoryKey (buat identitas unik grouping) tetap pakai teks asli dari
        // provider, tapi label yang ditampilkan ke pengguna sudah diterjemahkan.
        const categoryKey = raw.category || platformName;
        if (!platformEntry.categoriesMap.has(categoryKey)) {
            platformEntry.categoriesMap.set(categoryKey, {
                id: categoryKey,
                label: translateText(categoryKey),
                services: [],
            });
        }
        platformEntry.categoriesMap.get(categoryKey).services.push(service);
    }

    const order = [...PLATFORM_KEYWORDS.map((k) => k.label), 'Lainnya'];
    return Array.from(platformMap.values())
        .map((p) => ({
            key: p.key,
            label: p.label,
            categories: Array.from(p.categoriesMap.values()),
        }))
        .sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

// Ambil daftar layanan live dari provider lewat API route kita sendiri,
// lalu kelompokkan jadi struktur platform -> kategori -> layanan siap pakai.
export async function fetchLiveCatalog(kursUsdIdr, markupPersen) {
    const res = await fetch('/api/smm/services');
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memuat layanan.');
    }
    const rawServices = Array.isArray(data.services) ? data.services : [];
    return groupServices(rawServices, kursUsdIdr, markupPersen);
}