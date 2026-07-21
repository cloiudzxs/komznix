import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';
import { refillOrder } from '../../../../lib/provider';

export async function POST(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { providerOrderId } = body || {};
    if (!providerOrderId) {
        return NextResponse.json({ error: 'providerOrderId wajib diisi.' }, { status: 400 });
    }

    try {
        const result = await refillOrder(providerOrderId);

        await logActivity(supabaseAdmin, {
            adminEmail: email,
            aksi: 'Refill',
            detail: `Refill pesanan (provider order ${providerOrderId})`,
        });

        return NextResponse.json({ refill: result?.refill });
    } catch (err) {
        console.error('refillOrder ke provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal memproses refill. Silakan coba lagi.' }, { status: 500 });
    }
}