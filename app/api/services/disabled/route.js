// Simpan sebagai: app/api/services/disabled/route.js

import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

export async function GET() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('disabled_services').select('service_id');
    if (error) return NextResponse.json({ error: 'Gagal memuat status layanan.' }, { status: 500 });
    return NextResponse.json({ ids: (data || []).map((r) => r.service_id) });
}