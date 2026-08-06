import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../../lib/supabase/logActivity';
// mapProviderStatus sekarang diambil dari lib/provider, bukan didefinisiin
// ulang di file ini. Dulu ada dua salinan (di sini dan yang dipakai
// /api/admin/orders) — begitu salah satu diupdate buat status provider
// baru, yang satunya diem-diem ketinggalan.
import { getOrderStatus, mapProviderStatus } from '../../../../../lib/provider';

// POST { id } — sync satu pesanan: ambil status asli dari provider,
// update ke DB kalau beda, catat activity log.
export async function POST(request) {
    const { error, status: authStatus, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: authStatus || 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { id } = body || {};
    if (!id) {
        return NextResponse.json({ error: 'id pesanan wajib diisi.' }, { status: 400 });
    }

    const { data: orderRow, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('id, status, provider_order_id')
        .eq('id', id)
        .maybeSingle();

    if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    if (!orderRow) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }
    if (!orderRow.provider_order_id) {
        return NextResponse.json({ error: 'Pesanan ini gak punya provider_order_id, gak bisa disync.' }, { status: 400 });
    }

    let providerData;
    try {
        providerData = await getOrderStatus(orderRow.provider_order_id);
    } catch (err) {
        return NextResponse.json({ error: `Gagal ambil status dari provider: ${err.message}` }, { status: 502 });
    }

    const mappedStatus = mapProviderStatus(providerData?.status);

    if (!mappedStatus) {
        return NextResponse.json({
            order: orderRow,
            providerStatus: providerData?.status,
            changed: false,
            warning: `Status provider "${providerData?.status}" belum ada mapping-nya, status DB tidak diubah.`,
        });
    }

    if (mappedStatus === orderRow.status) {
        return NextResponse.json({ order: orderRow, providerStatus: providerData.status, changed: false });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: mappedStatus })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
        adminEmail: email,
        aksi: 'Sync Status Provider',
        detail: `Pesanan ${id} disync jadi ${mappedStatus} (provider: ${providerData.status})`,
    }).catch((err) => console.error('logActivity gagal:', err.message));

    return NextResponse.json({ order: updated, providerStatus: providerData.status, changed: true });
}