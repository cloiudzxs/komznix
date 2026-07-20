import { NextResponse } from 'next/server';
import { getProviderBalance } from '../../../../lib/provider';

export async function GET() {
    try {
        const result = await getProviderBalance();
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}