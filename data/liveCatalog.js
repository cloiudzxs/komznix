// Logic bersama buat olah data layanan LIVE dari provider (SMMSOC) — kamus
// terjemahan & logic pengelompokan platform cuma ada di SATU tempat. Kalau
// nemu istilah yang belum keterjemahan, cukup tambah di TRANSLATE_DICTIONARY
// di bawah — otomatis kepakai di semua halaman.
//
// PENTING: groupServices() sekarang dipanggil DI SERVER (app/api/services/
// route.js), bukan di browser. Dulu halaman pelanggan narik katalog mentah
// dari /api/smm/services lalu ngaliin kurs + markup sendiri — artinya rate
// modal provider harus dikirim ke browser, dan margin per layanan bisa
// dihitung siapa pun yang buka DevTools. Jangan dibalikin ke browser lagi.

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
    [/working button/gi, 'Tombol Berfungsi'],
    [/always working/gi, 'Selalu Berfungsi'],
    [/working after update/gi, 'Berfungsi Setelah Update'],
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
    [/no refill/gi, 'Tanpa Isi Ulang'],
    [/with refill/gi, 'Dengan Isi Ulang'],
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
    // === Frasa tambahan (harus di atas blok kata tunggal di bawah) ===
    [/world ?wide/gi, 'Seluruh Dunia'],
    [/cheapest in the market/gi, 'Termurah di Pasaran'],
    [/in the world/gi, 'di Dunia'],
    [/on the market/gi, 'di Pasaran'],
    [/very cheapest/gi, 'Paling Murah'],
    [/very cheap/gi, 'Sangat Murah'],
    [/ultra ?fast completed/gi, 'Selesai Sangat Cepat'],
    [/super ?fast complete(d)?/gi, 'Selesai Super Cepat'],
    [/ultra ?fast/gi, 'Sangat Cepat'],
    [/super ?instant/gi, 'Sangat Instan'],
    [/medium speed/gi, 'Kecepatan Sedang'],
    [/daily speed/gi, 'Kecepatan Harian'],
    [/natural increase/gi, 'Naik Alami'],
    [/always stabil(e)?/gi, 'Selalu Stabil'],
    [/refill button working/gi, 'Tombol Isi Ulang Berfungsi'],
    [/no warranty/gi, 'Tanpa Garansi'],
    [/low quality/gi, 'Kualitas Rendah'],
    [/high drop/gi, 'Drop Tinggi'],
    [/mix quality/gi, 'Kualitas Campuran'],
    [/premium quality/gi, 'Kualitas Premium'],
    [/no stuck/gi, 'Tanpa Macet'],
    [/not stuck/gi, 'Tanpa Macet'],
    [/big base/gi, 'Basis Besar'],
    [/different base/gi, 'Basis Berbeda'],
    [/main provider/gi, 'Provider Utama'],
    [/all type(s)?/gi, 'Semua Tipe'],
    [/all links?/gi, 'Semua Link'],
    [/all stories/gi, 'Semua Story'],
    [/with stories/gi, 'dengan Story'],
    [/profile photo available/gi, 'Ada Foto Profil'],
    [/profile photos?/gi, 'Foto Profil'],
    [/hidden accounts?/gi, 'Akun Tersembunyi'],
    [/hidden profiles?/gi, 'Profil Tersembunyi'],
    [/hidden data/gi, 'Data Tersembunyi'],
    [/online members/gi, 'Anggota Online'],
    // Nama layanan
    [/live ?stream/gi, 'Siaran Langsung'],
    [/post reactions?/gi, 'Reaksi Postingan'],
    [/comment reactions?/gi, 'Reaksi Komentar'],
    [/comments? reply/gi, 'Balasan Komentar'],
    [/comment likes/gi, 'Like Komentar'],
    [/random comments?/gi, 'Komentar Acak'],
    [/custom comments?/gi, 'Komentar Kustom'],
    [/emoji comments?/gi, 'Komentar Emoji'],
    [/page likes/gi, 'Like Halaman'],
    [/group members/gi, 'Anggota Grup'],
    [/channel members/gi, 'Anggota Channel'],
    [/premium members/gi, 'Anggota Premium'],
    [/bot start/gi, 'Mulai Bot'],
    [/poll votes/gi, 'Voting Polling'],
    [/profile visits/gi, 'Kunjungan Profil'],
    [/watch ?time/gi, 'Waktu Tonton'],
    [/monthly listeners/gi, 'Pendengar Bulanan'],
    // Sumber trafik / SEO
    [/start time/gi, 'Waktu Mulai'],
    [/browse features?/gi, 'Fitur Jelajah'],
    [/search engines?/gi, 'Mesin Pencari'],
    [/social networks?/gi, 'Jejaring Sosial'],
    [/organic search/gi, 'Pencarian Organik'],
    [/redirection from/gi, 'Pengalihan dari'],
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
    // === Kata tunggal tambahan ===
    [/\bfastest\b/gi, 'Tercepat'],
    [/\bslow\b/gi, 'Lambat'],
    [/\bvery\b/gi, 'Sangat'],
    [/\bmedium\b/gi, 'Sedang'],
    [/\brandom\b/gi, 'Acak'],
    [/\bcustom\b/gi, 'Kustom'],
    [/\bmix\b/gi, 'Campuran'],
    [/\borganic\b/gi, 'Organik'],
    [/\bpages?\b/gi, 'Halaman'],
    [/\bprofiles?\b/gi, 'Profil'],
    [/\bposts?\b/gi, 'Postingan'],
    [/\bphotos?\b/gi, 'Foto'],
    [/\bstories\b/gi, 'Story'],
    [/\breactions?\b/gi, 'Reaksi'],
    [/\bcomments?\b/gi, 'Komentar'],
    [/\bmembers?\b/gi, 'Anggota'],
    [/\bsubscribers?\b/gi, 'Subscriber'],
    [/\bsaves?\b/gi, 'Simpan'],
    [/\bimpressions?\b/gi, 'Impresi'],
    [/\bengagements?\b/gi, 'Interaksi'],
    [/\bdetails?\b/gi, 'Detail'],
    [/\btraffic\b/gi, 'Trafik'],
    [/\bcancel\b/gi, 'Batal'],
    [/\bstart\b/gi, 'Mulai'],
    [/\bmarket\b/gi, 'Pasaran'],
    // OPSIONAL — buka komentarnya kalau mau kata inti ikut diterjemahin.
    // Banyak panel Indonesia sengaja MEMBIARKAN ini dalam Inggris karena
    // itu istilah yang dicari pelanggan. Nyalain cuma kalau memang mau.
    // [/\bfollowers?\b/gi, 'Pengikut'],
    // [/\blikes?\b/gi, 'Suka'],
    // [/\bviews?\b/gi, 'Tayangan'],
    // [/\bshares?\b/gi, 'Bagikan'],
    // Kata generik ini sengaja ditaruh paling akhir — biar frasa yang lebih
    // spesifik (mis. "Real Accounts", "No Refill") kena duluan sebelum kata
    // tunggalnya diganti sendiri-sendiri.
    [/\baccounts?\b/gi, 'Akun'],
    [/\brefill\b/gi, 'Isi Ulang'],
    [/\bfast\b/gi, 'Cepat'],
    [/\breal\b/gi, 'Asli'],
];

// Provider sering nulis nama layanan pakai font unicode gaya-gayaan
// (𝐔𝐋𝐓𝐑𝐀 𝐅𝐀𝐒𝐓, 𝗛𝗤, 𝕭𝖊𝖘𝖙, ᴺᴱᵂ) dan huruf Turki (WORKİNG, Superİnstant).
// Karakter itu BUKAN huruf ASCII, jadi regex kamus di atas gak pernah kena —
// itu penyebab utama masih banyak kata Inggris yang lolos ke tampilan.
// Di sini teksnya diratakan dulu ke huruf biasa sebelum diterjemahkan.
const TURKISH_MAP = [
    [/\u0130/g, 'I'],
    [/\u0131/g, 'i'],
    [/\u015E/g, 'S'],
    [/\u015F/g, 's'],
    [/\u011E/g, 'G'],
    [/\u011F/g, 'g'],
];

export function normalizeProviderText(text) {
    if (!text) return text;
    // NFKC ngubah huruf matematis/tebal/fraktur dan superscript jadi ASCII:
    // 𝐔𝐋𝐓𝐑𝐀 -> ULTRA, 𝕭𝖊𝖘𝖙 -> Best, ᴺᴱᵂ -> NEW.
    let result = text.normalize('NFKC');
    for (const [pattern, replacement] of TURKISH_MAP) {
        result = result.replace(pattern, replacement);
    }
    return result;
}

export function translateText(text) {
    if (!text) return text;
    let result = normalizeProviderText(text);
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

// Ambil katalog siap pakai dari /api/services (endpoint publik).
//
// Yang balik dari sana SUDAH: harga dalam rupiah, layanan nonaktif kefilter,
// dan struktur platform -> kategori -> layanan. Rate provider, kurs, dan
// markup gak pernah ikut kekirim.
//
// Parameter kursUsdIdr & markupPersen sengaja masih diterima tapi diabaikan,
// biar pemanggil lama (OrderForm, DaftarLayananSection) gak perlu diubah.
// Aman dihapus dari sisi pemanggil kapan pun.
export async function fetchLiveCatalog(_kursUsdIdr, _markupPersen) {
    const res = await fetch('/api/services');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal memuat layanan.');
    }
    return Array.isArray(data.platforms) ? data.platforms : [];
}