import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('tickets')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
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

    const { id, status, balasan } = body || {};
    if (!id) {
        return NextResponse.json({ error: 'id tiket wajib diisi.' }, { status: 400 });
    }

    const updates = {};
    if (status) updates.status = status;
    if (typeof balasan === 'string') updates.balasan = balasan;

    const { data, error: updateError } = await supabaseAdmin
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (typeof balasan === 'string') {
        await logActivity(supabaseAdmin, {
            adminEmail: email,
            aksi: 'Balas',
            detail: `Membalas tiket ${id}`,
        });
    } else if (status === 'Ditutup') {
        await logActivity(supabaseAdmin, {
            adminEmail: email,
            aksi: 'Ubah Status',
            detail: `Menutup tiket ${id}`,
        });
    }

    return NextResponse.json({ ticket: data });
}