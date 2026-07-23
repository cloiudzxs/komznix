// Simpan sebagai: app/api/admin/services/route.js

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin.from('disabled_services').select('service_id');
    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });

    return NextResponse.json({ ids: (data || []).map((r) => r.service_id) });
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

    const { serviceId, disabled } = body || {};
    if (!serviceId) {
        return NextResponse.json({ error: 'serviceId wajib diisi.' }, { status: 400 });
    }
    const idStr = String(serviceId);

    if (disabled) {
        const { error: upsertError } = await supabaseAdmin
            .from('disabled_services')
            .upsert({ service_id: idStr, disabled_by: email });
        if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
    } else {
        const { error: deleteError } = await supabaseAdmin
            .from('disabled_services')
            .delete()
            .eq('service_id', idStr);
        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Kelola Layanan',
        detail: `${disabled ? 'Menonaktifkan' : 'Mengaktifkan'} layanan ID ${idStr}`,
    });

    return NextResponse.json({ success: true });
}