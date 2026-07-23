// Simpan sebagai: app/api/admin/komisi-log/route.js

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('komisi_log')
        .select('id, user_id, tipe, jumlah, created_at')
        .order('created_at', { ascending: false });

    if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
    return NextResponse.json({ log: data || [] });
}