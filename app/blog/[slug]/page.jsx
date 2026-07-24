// Simpan sebagai: app/blog/[slug]/page.jsx

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '../../../lib/supabase/admin';
import { renderBlogContent, estimateReadMinutes } from '../../../data/blogFormat';

export const revalidate = 300;

async function getPost(slug) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) return null;
    return data;
}

async function getOtherPosts(excludeSlug, limit = 3) {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('slug, title, excerpt, cover_image_url, published_at')
        .eq('status', 'published')
        .neq('slug', excludeSlug)
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error) return [];
    return data || [];
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) return { title: 'Artikel Tidak Ditemukan — SuntikSosmed' };

    const description = post.meta_description || post.excerpt || undefined;
    return {
        title: `${post.title} — SuntikSosmed`,
        description,
        alternates: { canonical: `/blog/${post.slug}` },
        openGraph: {
            title: post.title,
            description,
            type: 'article',
            publishedTime: post.published_at,
            images: post.cover_image_url ? [post.cover_image_url] : undefined,
        },
    };
}

function formatTanggal(iso) {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    return `${dd} ${month} ${date.getFullYear()}`;
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    const post = await getPost(slug);
    if (!post) notFound();
    const otherPosts = await getOtherPosts(slug);

    return (
        <div className="min-h-screen bg-[#111111] text-white">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <Link href="/blog" className="text-sm text-gray-400 hover:text-[#B9FF66] transition-colors">
                    &larr; Kembali ke Blog
                </Link>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 min-w-0">
                        <article>
                            {post.cover_image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={post.cover_image_url}
                                    alt=""
                                    className="w-full h-64 object-cover rounded-2xl mb-6"
                                />
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <span>{formatTanggal(post.published_at)}</span>
                                <span>&middot;</span>
                                <span>{estimateReadMinutes(post.content)} menit baca</span>
                            </div>

                            <h1 className="text-3xl font-bold mb-6">{post.title}</h1>

                            <div className="flex flex-col gap-4">{renderBlogContent(post.content)}</div>
                        </article>

                        <div className="mt-12 bg-[#191A19] border border-white/10 rounded-2xl p-6 text-center">
                            <p className="text-gray-300 mb-3">Siap naikkin followers, likes, dan views kamu?</p>
                            <Link
                                href="/register"
                                className="inline-block bg-[#B9FF66] text-black text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#a0e655] transition-colors"
                            >
                                Mulai Sekarang
                            </Link>
                        </div>
                    </div>

                    {otherPosts.length > 0 && (
                        <aside className="lg:col-span-1">
                            <div className="lg:sticky lg:top-8">
                                <h2 className="text-lg font-bold mb-4">Artikel Lainnya</h2>
                                <div className="flex flex-col gap-4">
                                    {otherPosts.map((other) => (
                                        <Link
                                            key={other.slug}
                                            href={`/blog/${other.slug}`}
                                            className="block bg-[#191A19] border border-white/10 rounded-2xl p-4 hover:border-[#B9FF66]/40 transition-colors"
                                        >
                                            {other.cover_image_url && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={other.cover_image_url}
                                                    alt=""
                                                    className="w-full h-28 object-cover rounded-xl mb-3"
                                                />
                                            )}
                                            <p className="font-medium text-sm leading-snug">{other.title}</p>
                                            {other.excerpt && (
                                                <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{other.excerpt}</p>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}