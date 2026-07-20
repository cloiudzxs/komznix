import { NextResponse } from 'next/server';
import { refillOrder } from '../../../../lib/provider';

export async function POST(request) {
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
        return NextResponse.json({ refill: result?.refill });
    } catch (err) {
        console.error('refillOrder ke provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal memproses refill. Silakan coba lagi.' }, { status: 500 });
    }
}