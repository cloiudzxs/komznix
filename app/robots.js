// Next.js otomatis nge-generate /robots.txt dari file ini.
export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Halaman ini SENGAJA gak boleh diindex Google — butuh login
                // (dashboard) atau halaman transaksi sekali pakai
                // (reset-password) yang gak ada gunanya muncul di hasil
                // pencarian. Path /admin SENGAJA gak dicantumin di sini —
                // robots.txt itu file PUBLIK, siapa aja bisa buka & baca
                // isinya, jadi nulis /admin di sini sama aja ngasih tau orang
                // "ada panel admin di sini". Larangan index buat /admin
                // ditangani lewat meta tag noindex di halaman itu sendiri
                // (lihat app/admin/layout.jsx), bukan lewat robots.txt.
                disallow: ['/dashboard', '/reset-password'],
            },
        ],
        sitemap: 'https://smmsuntiksosmed.my.id/sitemap.xml',
    };
}
