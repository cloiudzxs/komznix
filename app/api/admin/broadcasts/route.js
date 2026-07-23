// Simpan sebagai: app/api/admin/broadcasts/route.js

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
    return NextResponse.json({ broadcasts: data || [] });
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

    const { judul, isi, tipe } = body || {};
    if (!judul?.trim() || !isi?.trim()) {
        return NextResponse.json({ error: 'Judul dan isi wajib diisi.' }, { status: 400 });
    }

    const { data, error: insertError } = await supabaseAdmin
        .from('broadcasts')
        .insert({ judul: judul.trim(), isi: isi.trim(), tipe: tipe?.trim() || 'Info' })
        .select()
        .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Broadcast',
        detail: `Mengirim broadcast "${judul.trim()}"`,
    });

    return NextResponse.json({ broadcast: data });
}

export async function DELETE(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from('broadcasts').select('judul').eq('id', id).single();

    const { error: deleteError } = await supabaseAdmin.from('broadcasts').delete().eq('id', id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Broadcast',
        detail: `Menghapus broadcast "${existing?.judul || id}"`,
    });

    return NextResponse.json({ success: true });
}