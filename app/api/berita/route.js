// Simpan sebagai: app/api/berita/route.js

import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export async function GET() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('berita')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Gagal memuat berita.' }, { status: 500 });
    return NextResponse.json({ berita: data || [] });
}