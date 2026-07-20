// Next.js otomatis nge-generate /sitemap.xml dari file ini — gak perlu
// bikin XML manual. Halaman dashboard/admin SENGAJA gak dimasukin (butuh
// login, gak ada gunanya buat SEO). Kalau nanti nambah halaman publik baru
// (mis. halaman detail per-layanan), tambahin ke daftar routes di bawah.
export default function sitemap() {
    const baseUrl = 'https://smmsuntiksosmed.my.id';

    const routes = [
        { path: '', priority: 1, changeFrequency: 'daily' },
        { path: '/layanan', priority: 0.9, changeFrequency: 'daily' },
        { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/login', priority: 0.6, changeFrequency: 'monthly' },
        { path: '/privacy-policy', priority: 0.4, changeFrequency: 'yearly' },
        { path: '/terms-of-service', priority: 0.4, changeFrequency: 'yearly' },
        { path: '/refund-policy', priority: 0.4, changeFrequency: 'yearly' },
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}
