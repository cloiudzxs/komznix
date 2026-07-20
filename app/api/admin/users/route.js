import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, balance, status, referral_code, created_at')
        .order('created_at', { ascending: false });

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
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

    const { id, status } = body || {};
    if (!id || !status) {
        return NextResponse.json({ error: 'id dan status wajib diisi.' }, { status: 400 });
    }

    const { data, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: status === 'Suspend' ? 'Suspend' : 'Aktifkan',
        detail: `${status === 'Suspend' ? 'Menangguhkan' : 'Mengaktifkan kembali'} pengguna ${data.email}`,
    });

    return NextResponse.json({ user: data });
}