// Simpan sebagai: app/api/admin/berita/route.js

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('berita')
        .select('*')
        .order('created_at', { ascending: false });

    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
    return NextResponse.json({ berita: data || [] });
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

    const { judul, tipe, isi } = body || {};
    if (!judul?.trim() || !isi?.trim()) {
        return NextResponse.json({ error: 'Judul dan isi wajib diisi.' }, { status: 400 });
    }

    const { data, error: insertError } = await supabaseAdmin
        .from('berita')
        .insert({ judul: judul.trim(), tipe: tipe?.trim() || 'Pengumuman', isi: isi.trim() })
        .select()
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Kelola Berita',
        detail: `Menambah berita "${judul.trim()}"`,
    });

    return NextResponse.json({ berita: data });
}

export async function DELETE(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from('berita').select('judul').eq('id', id).single();

    const { error: deleteError } = await supabaseAdmin.from('berita').delete().eq('id', id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Kelola Berita',
        detail: `Menghapus berita "${existing?.judul || id}"`,
    });

    return NextResponse.json({ success: true });
}