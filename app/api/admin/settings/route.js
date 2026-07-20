import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin.from('settings').select('key, value');

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const settings = {};
    (data || []).forEach((row) => {
        settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
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

    const { key, value } = body || {};
    if (!key || value === undefined || value === null) {
        return NextResponse.json({ error: 'key dan value wajib diisi.' }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() });

    if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const labelMap = { markup_persen: 'markup global', kurs_usd_idr: 'kurs USD → IDR' };
    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Pengaturan',
        detail: `Mengubah ${labelMap[key] || key} jadi ${value}`,
    });

    return NextResponse.json({ success: true });
}