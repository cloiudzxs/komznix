import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { getProviderBalance } from '../../../../lib/provider';

// Saldo akun kita sendiri di provider (bukan saldo customer) -- admin-only.
export async function GET(request) {
    const { error } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    try {
        const result = await getProviderBalance();
        return NextResponse.json({ balance: result?.balance, currency: result?.currency });
    } catch (err) {
        console.error('getProviderBalance dari provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal mengambil data saldo.' }, { status: 500 });
    }
}