import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { getOrderStatus } from '../../../../lib/provider';

export async function GET(request) {
    // Wajib login dulu.
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Belum login.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ error: 'Parameter orderId wajib diisi.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Pastikan orderId (provider_order_id) ini emang pesanan MILIK user yang
    // lagi login -- biar orang gak bisa nebak-nebak orderId provider punya
    // orang lain buat intip status pesanannya.
    const { data: order, error: queryError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider_order_id', orderId)
        .maybeSingle();

    if (queryError) {
        console.error('Query order gagal:', queryError.message);
        return NextResponse.json({ error: 'Gagal memverifikasi pesanan.' }, { status: 500 });
    }

    if (!order) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    try {
        const result = await getOrderStatus(orderId);
        return NextResponse.json({
            status: result?.status,
            remains: result?.remains,
            start_count: result?.start_count,
            charge: result?.charge,
        });
    } catch (err) {
        console.error('getOrderStatus dari provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal mengambil status pesanan.' }, { status: 500 });
    }
}