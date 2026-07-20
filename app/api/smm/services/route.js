import { NextResponse } from 'next/server';
import { getServices } from '../../../../lib/provider';

export async function GET() {
    try {
        const services = await getServices();
        return NextResponse.json({ services });
    } catch (err) {
        console.error('getServices dari provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal mengambil daftar layanan.' }, { status: 500 });
    }
}