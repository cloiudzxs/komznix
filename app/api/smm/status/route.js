import { NextResponse } from 'next/server';
import { getOrderStatus } from '../../../../lib/provider';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        return NextResponse.json({ error: 'Parameter orderId wajib diisi.' }, { status: 400 });
    }

    try {
        const result = await getOrderStatus(orderId);
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}