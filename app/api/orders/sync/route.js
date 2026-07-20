import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { getOrderStatus, mapProviderStatus } from '../../../../lib/provider';

// Sync status pesanan MILIK PELANGGAN YANG LAGI LOGIN ke provider — dipanggil
// otomatis pas dashboard pelanggan dibuka. Update ke DB pakai service role
// (bypass RLS, sama kayak sisi admin), TAPI query-nya selalu dibatesin
// `eq('user_id', user.id)` dari session yang baru diverifikasi di atas, jadi
// pelanggan gak mungkin nge-trigger sync/update buat pesanan orang lain.
export async function POST(request) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: orders, error: queryError } = await supabaseAdmin
        .from('orders')
        .select('id, status, provider_order_id')
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Diproses'])
        .not('provider_order_id', 'is', null);

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const updated = [];
    for (const order of orders || []) {
        try {
            const result = await getOrderStatus(order.provider_order_id);
            const mapped = mapProviderStatus(result.status);

            if (mapped && mapped !== order.status) {
                await supabaseAdmin.from('orders').update({ status: mapped }).eq('id', order.id);
                updated.push({ id: order.id, status: mapped });
            }
        } catch (err) {
            // Satu order gagal sync -> skip, jangan gagalin seluruh request.
            console.error(`Gagal sync order ${order.id}:`, err.message);
        }
    }

    return NextResponse.json({ updated });
}