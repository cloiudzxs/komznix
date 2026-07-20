import { NextResponse } from 'next/server';
import { verifyAdminSessionToken } from '../../../../lib/adminAuth';

export async function GET(request) {
    const token = request.cookies.get('admin_session')?.value;
    const payload = verifyAdminSessionToken(token);

    if (!payload) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, email: payload.email });
}