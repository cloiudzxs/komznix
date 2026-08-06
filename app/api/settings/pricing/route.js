import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Endpoint publik (sengaja TANPA auth check) buat baca pengaturan yang emang
// perlu keliatan siapa aja, termasuk pengunjung yang belum login.
//
// Yang dikirim SEKARANG cuma komisi referral.
//
// markup_persen & kurs_usd_idr sengaja DIBUANG dari response. Dulu keduanya
// ikut kekirim dengan alasan "efeknya udah keliatan implisit dari harga
// jual" — itu keliru arahnya: yang keliatan cuma harga jual, sedangkan
// modalnya gak. Begitu markup dan kurs dikasih tau, modal per layanan bisa
// dihitung mundur persis (harga_jual / kurs / (1 + markup/100) = rate
// provider), dan margin kita kebaca siapa pun yang buka DevTools.
//
// Halaman pelanggan juga udah gak butuh dua angka ini: harga jual sekarang
// dihitung di server lewat /api/services.
export async function GET() {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
        .from('settings')
        .select('key, value')
        .in('key', ['referral_komisi_persen']);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
    return NextResponse.json({
        referral_komisi_persen: map.referral_komisi_persen,
    });
}