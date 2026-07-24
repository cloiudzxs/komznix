// Simpan sebagai: app/blog/page.jsx

import Link from 'next/link';
import { createAdminClient } from '../../lib/supabase/admin';

export const revalidate = 300; // re-fetch tiap 5 menit, gak perlu real-time

export const metadata = {
    title: 'Blog — SuntikSosmed',
    description:
        'Tips, panduan, dan info seputar social media marketing: followers, likes, views Instagram, TikTok, YouTube, dan platform lainnya.',
    alternates: { canonical: '/blog' },
};

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    return `${dd} ${month} ${date.getFullYear()}`;
}

async function getPosts() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('slug, title, excerpt, cover_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (error) return [];
    return data || [];
}

export default async function BlogIndexPage() {
    const posts = await getPosts();

    return (
        <div className="min-h-screen bg-[#111111] text-white">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold">Blog SuntikSosmed</h1>
                    <p className="text-gray-400 mt-3">
                        Tips & panduan seputar social media marketing, biar followers/likes/views kamu naik dengan cara
                        yang bener.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <p className="text-gray-500">Belum ada artikel yang diterbitkan.</p>
                ) : (
                    <div className="flex flex-col gap-6">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="block bg-[#191A19] border border-white/10 rounded-2xl p-6 hover:border-[#B9FF66]/40 transition-colors"
                            >
                                {post.cover_image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={post.cover_image_url}
                                        alt=""
                                        className="w-full h-48 object-cover rounded-xl mb-4"
                                    />
                                )}
                                <p className="text-xs text-gray-500 mb-2">{formatTanggal(post.published_at)}</p>
                                <h2 className="text-xl font-bold mb-2">{post.title}</h2>
                                {post.excerpt && <p className="text-gray-400 text-sm leading-relaxed">{post.excerpt}</p>}
                                <span className="inline-block mt-3 text-sm text-[#B9FF66] font-medium">
                                    Baca selengkapnya &rarr;
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}