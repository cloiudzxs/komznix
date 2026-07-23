// Simpan sebagai: app/api/broadcasts/route.js

import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Gagal memuat broadcast.' }, { status: 500 });
    return NextResponse.json({ broadcasts: data || [] });
}