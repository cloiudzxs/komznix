'use client';

import { useEffect, useState } from 'react';
import {
    Newspaper,
    Send,
    Eye,
    Trash2,
    Loader2,
    AlertTriangle,
    Pencil,
    X,
    ExternalLink,
    Plus,
} from 'lucide-react';
import { renderBlogContent } from '../../data/blogFormat';

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatTanggal(iso) {
    if (!iso) return '-';
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][date.getMonth()];
    return `${dd} ${month} ${date.getFullYear()}`;
}

const EMPTY_FORM = {
    id: null,
    title: '',
    slug: '',
    slugTouched: false,
    excerpt: '',
    content: '',
    coverImageUrl: '',
    metaDescription: '',
    status: 'draft',
};

export default function BlogManager() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function load() {
        setLoading(true);
        setLoadError('');
        try {
            const res = await fetch('/api/admin/blog');
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat artikel.');
            setPosts(data.posts || []);
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function openNewForm() {
        setForm(EMPTY_FORM);
        setError('');
        setShowForm(true);
    }

    function openEditForm(post) {
        setForm({
            id: post.id,
            title: post.title,
            slug: post.slug,
            slugTouched: true,
            excerpt: post.excerpt || '',
            content: post.content,
            coverImageUrl: post.cover_image_url || '',
            metaDescription: post.meta_description || '',
            status: post.status,
        });
        setError('');
        setShowForm(true);
    }

    function handleTitleChange(value) {
        setForm((f) => ({
            ...f,
            title: value,
            slug: f.slugTouched ? f.slug : slugify(value),
        }));
    }

    async function handleSubmit(e, publishNow) {
        e.preventDefault();
        setError('');

        if (!form.title.trim() || !form.content.trim()) {
            setError('Judul dan isi artikel wajib diisi.');
            return;
        }

        const payload = {
            id: form.id || undefined,
            title: form.title,
            slug: form.slug,
            excerpt: form.excerpt,
            content: form.content,
            coverImageUrl: form.coverImageUrl,
            metaDescription: form.metaDescription,
            status: publishNow ? 'published' : form.status === 'published' ? 'published' : 'draft',
        };

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/blog', {
                method: form.id ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal menyimpan artikel.');

            setPosts((prev) => {
                if (form.id) return prev.map((p) => (p.id === data.post.id ? data.post : p));
                return [data.post, ...prev];
            });
            setShowForm(false);
            setForm(EMPTY_FORM);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        const prev = posts;
        setPosts((p) => p.filter((x) => x.id !== id));
        try {
            const res = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Gagal menghapus artikel.');
        } catch (err) {
            setPosts(prev);
            setLoadError(err.message);
        }
    }

    return (
        <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-[#FFB800]" />
                    <h2 className="text-lg font-bold">Blog</h2>
                </div>
                {!showForm && (
                    <button
                        onClick={openNewForm}
                        className="flex items-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#e6a600] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Artikel Baru
                    </button>
                )}
            </div>

            <p className="text-sm text-gray-400 -mt-2">
                Artikel yang statusnya "Publik" bisa diakses siapa aja di{' '}
                <span className="font-mono">/blog/slug-artikel</span> (keindex Google). Status "Draft" cuma keliatan di
                sini, belum tampil ke publik.
            </p>

            {!loading && !loadError && posts.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center gap-4 w-fit">
                        <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-[#FFB800]" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Total Views (semua artikel)</p>
                            <p className="text-xl font-bold">
                                {posts.reduce((sum, p) => sum + (p.views || 0), 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex items-center gap-4 w-fit">
                        <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center">
                            <Newspaper className="w-5 h-5 text-[#FFB800]" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">Artikel Publik</p>
                            <p className="text-xl font-bold">{posts.filter((p) => p.status === 'published').length}</p>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <form className="bg-[#191A19] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold">{form.id ? 'Edit Artikel' : 'Artikel Baru'}</h3>
                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Judul</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Contoh: Cara Menambah Followers Instagram Secara Organik"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Slug URL <span className="text-gray-600">(otomatis dari judul, bisa diedit)</span>
                        </label>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 shrink-0">/blog/</span>
                            <input
                                type="text"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), slugTouched: true }))}
                                className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Ringkasan <span className="text-gray-600">(tampil di daftar blog & preview share)</span>
                        </label>
                        <textarea
                            value={form.excerpt}
                            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                            rows={2}
                            placeholder="1-2 kalimat ringkasan artikel..."
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            URL Gambar Sampul <span className="text-gray-600">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.coverImageUrl}
                            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                            placeholder="https://..."
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            Meta Description SEO <span className="text-gray-600">(opsional, default pakai Ringkasan)</span>
                        </label>
                        <input
                            type="text"
                            value={form.metaDescription}
                            onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                            maxLength={160}
                            placeholder="Deskripsi buat hasil pencarian Google (maks ~160 karakter)..."
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Isi Artikel</label>
                        <textarea
                            value={form.content}
                            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                            rows={14}
                            placeholder="Tulis isi artikel di sini... (boleh panjang)"
                            className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] resize-y leading-relaxed font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Pisahin paragraf pakai baris kosong (Enter 2x). Heading pakai{' '}
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300"># Judul</code>,{' '}
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">## Subjudul</code>, atau{' '}
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">### Sub-subjudul</code>. Tebal
                            pakai <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">**teks**</code>, link
                            pakai <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">[teks](https://url)</code>.
                        </p>
                    </div>

                    {form.content.trim() && (
                        <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                <Eye className="w-3.5 h-3.5" />
                                Pratinjau
                            </div>
                            <div className="bg-[#111111] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                                {renderBlogContent(form.content)}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={(e) => handleSubmit(e, false)}
                            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-sm font-medium px-5 py-3 rounded-xl transition-colors disabled:opacity-60"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Draft
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={(e) => handleSubmit(e, true)}
                            className="flex items-center justify-center gap-2 bg-[#FFB800] text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-[#e6a600] transition-colors disabled:opacity-60"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Terbitkan
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-[#191A19] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-sm font-bold">Semua Artikel</h3>
                </div>

                {loading ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                        <p className="text-sm text-gray-500">Memuat artikel...</p>
                    </div>
                ) : loadError ? (
                    <div className="p-10 flex flex-col items-center gap-3 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                        <p className="text-sm text-red-400">{loadError}</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-500">Belum ada artikel.</div>
                ) : (
                    <div className="flex flex-col">
                        {posts.map((p) => (
                            <div key={p.id} className="flex items-start justify-between gap-4 px-6 py-4 border-b border-white/5 last:border-0">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span
                                        className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${p.status === 'published'
                                            ? 'bg-[#B9FF66]/10 text-[#B9FF66]'
                                            : 'bg-gray-500/10 text-gray-400'
                                            }`}
                                    >
                                        {p.status === 'published' ? 'Publik' : 'Draft'}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{p.title}</p>
                                        <p className="text-gray-500 text-xs mt-0.5 font-mono">/blog/{p.slug}</p>
                                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-3 flex-wrap">
                                            <span>
                                                {p.status === 'published' ? `Terbit ${formatTanggal(p.published_at)}` : `Diubah ${formatTanggal(p.updated_at)}`}
                                            </span>
                                            {p.status === 'published' && (
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {(p.views || 0).toLocaleString('id-ID')} views
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {p.status === 'published' && (
                                        <a
                                            href={`/blog/${p.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-500 hover:text-[#FFB800]"
                                            title="Lihat halaman publik"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button onClick={() => openEditForm(p)} className="text-gray-500 hover:text-[#FFB800]" title="Edit">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-400" title="Hapus">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}