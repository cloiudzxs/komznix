import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';
import { getOrderStatus, mapProviderStatus } from '../../../../lib/provider';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('orders')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Auto-sync: tiap order yang masih Pending/Diproses & punya
    // provider_order_id dicek ulang statusnya ke provider satu-satu,
    // setiap kali admin buka/refresh halaman ini. Gak pake cron.
    const toSync = data.filter(
        (o) => ['Pending', 'Diproses'].includes(o.status) && o.provider_order_id
    );

    for (const order of toSync) {
        try {
            const result = await getOrderStatus(order.provider_order_id);
            const mapped = mapProviderStatus(result.status);

            if (mapped && mapped !== order.status) {
                await supabaseAdmin.from('orders').update({ status: mapped }).eq('id', order.id);
                order.status = mapped; // langsung update di response juga, biar gak perlu query ulang
            }
        } catch (err) {
            // Satu order gagal sync (misal ID salah/provider error) -> skip,
            // jangan gagalin seluruh halaman.
            console.error(`Gagal sync order ${order.id}:`, err.message);
        }
    }

    return NextResponse.json({ orders: data });
}

export async function PATCH(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { id, status, refunded } = body || {};
    if (!id) {
        return NextResponse.json({ error: 'id pesanan wajib diisi.' }, { status: 400 });
    }

    // Kalau admin nge-refund pesanan yang belum pernah di-refund, saldo
    // pelanggan otomatis ditambah balik sebesar harga pesanan itu.
    if (refunded === true) {
        const { data: orderRow } = await supabaseAdmin
            .from('orders')
            .select('user_id, harga, refunded')
            .eq('id', id)
            .maybeSingle();

        if (orderRow && !orderRow.refunded) {
            await supabaseAdmin.rpc('admin_add_balance', {
                target_user: orderRow.user_id,
                amount: orderRow.harga,
            });
            await logActivity(supabaseAdmin, {
                adminEmail: email,
                aksi: 'Refund',
                detail: `Refund Rp ${Number(orderRow.harga).toLocaleString('id-ID')} buat pesanan ${id}`,
            });
        }
    }

    const updates = {};
    if (status) updates.status = status;
    if (typeof refunded === 'boolean') updates.refunded = refunded;

    const { data, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (status) {
        await logActivity(supabaseAdmin, {
            adminEmail: email,
            aksi: 'Ubah Status',
            detail: `Pesanan ${id} diubah jadi ${status}`,
        });
    }

    return NextResponse.json({ order: data });
}