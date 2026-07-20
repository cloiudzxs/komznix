import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data: profiles, error: queryError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, referral_code, referred_by, komisi_balance, created_at');

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const byId = new Map((profiles || []).map((p) => [p.id, p]));

    // Rekap per pemilik kode referral: berapa teman yang keajak lewat kodenya.
    const summary = (profiles || [])
        .filter((p) => p.referral_code)
        .map((p) => {
            const referred = (profiles || []).filter((u) => u.referred_by === p.id);
            return {
                id: p.id,
                email: p.email,
                fullName: p.full_name,
                referralCode: p.referral_code,
                temanDiajak: referred.length,
                komisiBalance: Number(p.komisi_balance) || 0,
                temanList: referred.map((u) => ({ email: u.email, fullName: u.full_name, createdAt: u.created_at })),
            };
        })
        .sort((a, b) => b.temanDiajak - a.temanDiajak);

    return NextResponse.json({ summary });
}