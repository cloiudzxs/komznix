// ============================================================================
// KATALOG LAYANAN
// ----------------------------------------------------------------------------
// Ini masih data statis di client. Begitu backend/provider (SMMSOC, BuzzerPanel,
// dll) sudah disambungkan, ganti PLATFORMS di bawah dengan hasil fetch dari API
// (mis. GET /api/services) — bentuk datanya sengaja dibuat mirip supaya
// komponen yang memakainya tidak perlu banyak berubah, tinggal ganti sumber
// datanya. Dipakai bersama oleh OrderForm dan DaftarLayananSection.
// ============================================================================

export const PLATFORMS = [
    {
        key: 'instagram',
        label: 'Instagram',
        categories: [
            {
                id: 'ig-followers',
                label: 'Instagram - Followers | Rekomendasi',
                services: [
                    {
                        id: 1001,
                        name: 'Followers Instagram | Real Active | No Refill | Instant',
                        pricePer1000: 15000,
                        min: 100,
                        max: 50000,
                        description: 'Followers dari akun aktif, kualitas real, tanpa garansi refill.',
                        targetHint: 'Link/Username profil',
                        favorite: true,
                    },
                    {
                        id: 1002,
                        name: 'Followers Instagram | Premium | Garansi Refill 30 Hari',
                        pricePer1000: 28000,
                        min: 100,
                        max: 100000,
                        description: 'Followers kualitas premium dengan garansi refill otomatis selama 30 hari kalau drop.',
                        targetHint: 'Link/Username profil',
                        favorite: true,
                    },
                ],
            },
            {
                id: 'ig-likes-views',
                label: 'Instagram - Likes & Views',
                services: [
                    {
                        id: 1010,
                        name: 'Likes Instagram | Real | Instant',
                        pricePer1000: 8000,
                        min: 50,
                        max: 20000,
                        description: 'Likes dari akun real untuk postingan feed atau reels.',
                        targetHint: 'Link postingan',
                        favorite: false,
                    },
                    {
                        id: 1011,
                        name: 'Views Reels Instagram | SuperInstant',
                        pricePer1000: 3000,
                        min: 100,
                        max: 500000,
                        description: 'Views untuk Reels, proses sangat cepat begitu pesanan masuk.',
                        targetHint: 'Link Reels',
                        favorite: true,
                    },
                ],
            },
        ],
    },
    {
        key: 'tiktok',
        label: 'TikTok',
        categories: [
            {
                id: 'tt-rekomendasi',
                label: 'TikTok - Rekomendasi | Cepat (Update Terbaru)',
                services: [
                    {
                        id: 9912,
                        name: 'TikTok Video Views S-4',
                        pricePer1000: 1952,
                        min: 100,
                        max: 100000000,
                        description: 'Views video TikTok, kapasitas sangat besar, cocok untuk video viral.',
                        targetHint: 'Link/Username',
                        favorite: true,
                    },
                    {
                        id: 9920,
                        name: 'TikTok Followers | Real | Low Drop',
                        pricePer1000: 11000,
                        min: 100,
                        max: 50000,
                        description: 'Followers TikTok dari akun real, tingkat drop rendah.',
                        targetHint: 'Username TikTok',
                        favorite: true,
                    },
                ],
            },
            {
                id: 'tt-likes',
                label: 'TikTok - Likes & Share',
                services: [
                    {
                        id: 9931,
                        name: 'TikTok Likes | Real Active',
                        pricePer1000: 6500,
                        min: 50,
                        max: 100000,
                        description: 'Likes video TikTok dari akun aktif.',
                        targetHint: 'Link video',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'youtube',
        label: 'YouTube',
        categories: [
            {
                id: 'yt-utama',
                label: 'YouTube - Subscribers & Views',
                services: [
                    {
                        id: 2101,
                        name: 'YouTube Subscribers | Real | Garansi 15 Hari',
                        pricePer1000: 45000,
                        min: 50,
                        max: 10000,
                        description: 'Subscribers dari akun real dengan garansi refill 15 hari kalau drop.',
                        targetHint: 'Link channel',
                        favorite: true,
                    },
                    {
                        id: 2110,
                        name: 'YouTube Views | Retention Tinggi',
                        pricePer1000: 6000,
                        min: 100,
                        max: 1000000,
                        description: 'Views dengan watch time yang baik untuk membantu performa video.',
                        targetHint: 'Link video',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'twitter',
        label: 'Twitter/X',
        categories: [
            {
                id: 'tw-utama',
                label: 'Twitter/X - Followers & Likes',
                services: [
                    {
                        id: 4101,
                        name: 'Followers Twitter/X | Real',
                        pricePer1000: 20000,
                        min: 100,
                        max: 30000,
                        description: 'Followers akun Twitter/X dari akun real.',
                        targetHint: 'Username Twitter/X',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'facebook',
        label: 'Facebook',
        categories: [
            {
                id: 'fb-utama',
                label: 'Facebook - Followers & Likes',
                services: [
                    {
                        id: 3101,
                        name: 'Followers Halaman Facebook | Real',
                        pricePer1000: 18000,
                        min: 100,
                        max: 50000,
                        description: 'Followers halaman Facebook dari akun real.',
                        targetHint: 'Link halaman',
                        favorite: false,
                    },
                    {
                        id: 3110,
                        name: 'Likes Post Facebook | Instant',
                        pricePer1000: 10000,
                        min: 50,
                        max: 20000,
                        description: 'Likes untuk postingan Facebook.',
                        targetHint: 'Link postingan',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'threads',
        label: 'Threads',
        categories: [
            {
                id: 'th-utama',
                label: 'Threads - Followers & Likes',
                services: [
                    {
                        id: 7101,
                        name: 'Followers Threads | Real',
                        pricePer1000: 17000,
                        min: 100,
                        max: 30000,
                        description: 'Followers akun Threads dari akun real.',
                        targetHint: 'Username Threads',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'telegram',
        label: 'Telegram',
        categories: [
            {
                id: 'tg-utama',
                label: 'Telegram - Members & Views',
                services: [
                    {
                        id: 5101,
                        name: 'Telegram Channel Members | Real',
                        pricePer1000: 9000,
                        min: 100,
                        max: 50000,
                        description: 'Member channel Telegram dari akun real.',
                        targetHint: 'Link/Username channel',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'whatsapp',
        label: 'WhatsApp',
        categories: [
            {
                id: 'wa-utama',
                label: 'WhatsApp - Channel Followers',
                services: [
                    {
                        id: 6101,
                        name: 'WhatsApp Channel Followers',
                        pricePer1000: 25000,
                        min: 100,
                        max: 20000,
                        description: 'Followers untuk channel WhatsApp.',
                        targetHint: 'Link channel',
                        favorite: false,
                    },
                ],
            },
        ],
    },
    {
        key: 'discord',
        label: 'Discord',
        categories: [
            {
                id: 'dc-utama',
                label: 'Discord - Server Members',
                services: [
                    {
                        id: 8101,
                        name: 'Discord Server Members',
                        pricePer1000: 22000,
                        min: 100,
                        max: 20000,
                        description: 'Member untuk server Discord kamu.',
                        targetHint: 'Link invite server',
                        favorite: false,
                    },
                ],
            },
        ],
    },
];

export function formatRupiah(value) {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}