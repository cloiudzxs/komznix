// Simpan sebagai: app/api/admin/blog/route.js

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
    return NextResponse.json({ posts: data || [] });
}

export async function POST(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { title, excerpt, content, coverImageUrl, metaDescription, status, slug: customSlug } = body || {};
    if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'Judul dan isi artikel wajib diisi.' }, { status: 400 });
    }

    const slug = slugify(customSlug?.trim() || title);
    if (!slug) {
        return NextResponse.json({ error: 'Slug gak valid (kosong setelah dibersihkan).' }, { status: 400 });
    }

    const finalStatus = status === 'published' ? 'published' : 'draft';

    const { data, error: insertError } = await supabaseAdmin
        .from('blog_posts')
        .insert({
            slug,
            title: title.trim(),
            excerpt: excerpt?.trim() || null,
            content: content.trim(),
            cover_image_url: coverImageUrl?.trim() || null,
            meta_description: metaDescription?.trim() || null,
            status: finalStatus,
            published_at: finalStatus === 'published' ? new Date().toISOString() : null,
        })
        .select()
        .single();

    if (insertError) {
        const msg = insertError.code === '23505' ? 'Slug ini udah dipakai artikel lain, coba slug lain.' : insertError.message;
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Blog',
        detail: `Menambah artikel blog "${title.trim()}" (${finalStatus})`,
    });

    return NextResponse.json({ post: data });
}

export async function PATCH(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { id, title, excerpt, content, coverImageUrl, metaDescription, status, slug: customSlug } = body || {};
    if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });
    if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'Judul dan isi artikel wajib diisi.' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
        .from('blog_posts')
        .select('status, published_at')
        .eq('id', id)
        .single();
    if (fetchError) return NextResponse.json({ error: 'Artikel gak ketemu.' }, { status: 404 });

    const slug = slugify(customSlug?.trim() || title);
    const finalStatus = status === 'published' ? 'published' : 'draft';
    // published_at cuma di-set SEKALI, pas pertama kali status berubah jadi
    // published -- biar tanggal terbit gak keubah tiap kali diedit ulang.
    const publishedAt =
        finalStatus === 'published' ? existing.published_at || new Date().toISOString() : existing.published_at;

    const { data, error: updateError } = await supabaseAdmin
        .from('blog_posts')
        .update({
            slug,
            title: title.trim(),
            excerpt: excerpt?.trim() || null,
            content: content.trim(),
            cover_image_url: coverImageUrl?.trim() || null,
            meta_description: metaDescription?.trim() || null,
            status: finalStatus,
            published_at: publishedAt,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        const msg = updateError.code === '23505' ? 'Slug ini udah dipakai artikel lain, coba slug lain.' : updateError.message;
        return NextResponse.json({ error: msg }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Blog',
        detail: `Mengubah artikel blog "${title.trim()}"`,
    });

    return NextResponse.json({ post: data });
}

export async function DELETE(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from('blog_posts').select('title').eq('id', id).single();

    const { error: deleteError } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Blog',
        detail: `Menghapus artikel blog "${existing?.title || id}"`,
    });

    return NextResponse.json({ success: true });
}