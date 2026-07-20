import { NextResponse } from 'next/server';
import { getServices } from '../../../../lib/provider';

export async function GET() {
    try {
        const services = await getServices();
        return NextResponse.json({ services });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}