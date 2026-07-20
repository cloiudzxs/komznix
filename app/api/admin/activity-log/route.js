import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data });
}