// Next.js otomatis nge-generate /sitemap.xml dari file ini — gak perlu
// bikin XML manual. Halaman dashboard/admin SENGAJA gak dimasukin (butuh
// login, gak ada gunanya buat SEO). Kalau nanti nambah halaman publik baru
// (mis. halaman detail per-layanan), tambahin ke daftar routes di bawah.
//
// Artikel blog (/blog & /blog/[slug]) di-fetch DINAMIS dari Supabase --
// setiap artikel baru yang di-publish otomatis masuk sitemap tanpa perlu
// edit file ini lagi.
import { createAdminClient } from '../lib/supabase/admin';

async function getBlogRoutes(baseUrl) {
    try {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('status', 'published');

        if (error || !data) return [];

        return data.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at),
            changeFrequency: 'monthly',
            priority: 0.7,
        }));
    } catch {
        // Kalau Supabase lagi gangguan, jangan sampe bikin sitemap.xml
        // gagal total -- mending sitemap tanpa artikel blog daripada
        // sitemap.xml error 500.
        return [];
    }
}

export default async function sitemap() {
    const baseUrl = 'https://smmsuntiksosmed.my.id';

    const routes = [
        { path: '', priority: 1, changeFrequency: 'daily' },
        { path: '/layanan', priority: 0.9, changeFrequency: 'daily' },
        { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
        { path: '/register', priority: 0.8, changeFrequency: 'monthly' },
        { path: '/login', priority: 0.6, changeFrequency: 'monthly' },
        { path: '/privacy-policy', priority: 0.4, changeFrequency: 'yearly' },
        { path: '/terms-of-service', priority: 0.4, changeFrequency: 'yearly' },
        { path: '/refund-policy', priority: 0.4, changeFrequency: 'yearly' },
    ];

    const staticEntries = routes.map((route) => ({
        url: `${baseUrl}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const blogEntries = await getBlogRoutes(baseUrl);

    return [...staticEntries, ...blogEntries];
}