import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

// Endpoint publik (sengaja TANPA auth check) buat baca pengaturan harga yang
// emang perlu keliatan siapa aja, termasuk pengunjung yang belum login
// (mis. halaman /layanan publik). Cuma expose angka markup/kurs/komisi
// referral — bukan data sensitif, dan efeknya udah keliatan implisit dari
// harga jual yang ditampilin ke pelanggan di halaman manapun.
export async function GET() {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .in('key', ['markup_persen', 'kurs_usd_idr', 'referral_komisi_persen']);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
    return NextResponse.json({
        markup_persen: map.markup_persen,
        kurs_usd_idr: map.kurs_usd_idr,
        referral_komisi_persen: map.referral_komisi_persen,
    });
}