import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('deposits')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ deposits: data });
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

    const { data: depositRow } = await supabaseAdmin
        .from('deposits')
        .select('user_id, nominal, status')
        .eq('id', id)
        .maybeSingle();

    if (!depositRow) {
        return NextResponse.json({ error: 'Deposit tidak ketemu.' }, { status: 404 });
    }

    // Kalau dikonfirmasi jadi "Berhasil" dan sebelumnya belum "Berhasil",
    // saldo user ditambah otomatis sebesar nominal deposit itu.
    if (status === 'Berhasil' && depositRow.status !== 'Berhasil') {
        await supabaseAdmin.rpc('admin_add_balance', {
            target_user: depositRow.user_id,
            amount: depositRow.nominal,
        });
    }

    const { data, error: updateError } = await supabaseAdmin
        .from('deposits')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: status === 'Berhasil' ? 'Konfirmasi Deposit' : 'Ubah Status',
        detail: `Deposit ${id} (Rp ${Number(depositRow.nominal).toLocaleString('id-ID')}) diubah jadi ${status}`,
    });

    return NextResponse.json({ deposit: data });
}