import { NextResponse } from 'next/server';
import { getProviderBalance } from '../../../../lib/provider';

// TODO KEAMANAN: route ini belum ada pengecekan admin sama sekali. Ini
// nampilin saldo akun kita sendiri di provider (bukan saldo customer) --
// WAJIB admin-only sebelum di-deploy. Tambahin pengecekan sesi admin
// (env-var credentials + signed httpOnly cookie, sama kayak pattern yang
// dipakai di route /api/admin/*) di awal handler ini, return 401/403
// kalau bukan admin, SEBELUM manggil getProviderBalance().

export async function GET() {
    try {
        const result = await getProviderBalance();
        return NextResponse.json({ balance: result?.balance, currency: result?.currency });
    } catch (err) {
        console.error('getProviderBalance dari provider gagal:', err.message);
        return NextResponse.json({ error: 'Gagal mengambil data saldo.' }, { status: 500 });
    }
}