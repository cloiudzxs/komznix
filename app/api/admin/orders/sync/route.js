import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../../lib/supabase/logActivity';
import { getOrderStatus } from '../../../../../lib/provider';

// Perfect Panel API balikin status dalam bahasa Inggris & variannya lumayan
// banyak antar provider. Mapping ke 4 status internal kita: Pending,
// Diproses, Selesai, Gagal.
function mapProviderStatus(providerStatus) {
    const s = String(providerStatus || '').toLowerCase();

    if (s.includes('pending')) return 'Pending';
    if (s.includes('progress') || s.includes('processing')) return 'Diproses';
    if (s.includes('completed')) return 'Selesai';
    if (s.includes('partial') || s.includes('canceled') || s.includes('cancelled') || s.includes('error')) return 'Gagal';

    // Status yang gak dikenal -> jangan diubah, biar ketauan butuh mapping baru
    return null;
}

// POST { id } — sync satu pesanan: ambil status asli dari provider,
// update ke DB kalau beda, catat activity log.
export async function POST(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

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
        .select('id, status, provider_order_id') // <-- ganti nama kolom di sini kalau beda
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

    const mappedStatus = mapProviderStatus(providerData.status);

    if (!mappedStatus) {
        return NextResponse.json({
            order: orderRow,
            providerStatus: providerData.status,
            warning: `Status provider "${providerData.status}" belum ada mapping-nya, status DB tidak diubah.`,
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
    });

    return NextResponse.json({ order: updated, providerStatus: providerData.status, changed: true });
}