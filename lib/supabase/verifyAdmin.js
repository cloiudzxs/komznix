import { cookies } from 'next/headers';
import { createAdminClient } from './admin';
import { verifyAdminSessionToken } from '../adminAuth';

// Cek cookie admin_session (auth admin terpisah total dari Supabase Auth
// pelanggan — lihat lib/adminAuth.js). Kalau valid, kasih balik client
// Supabase yang pakai Secret key (bypass RLS).
//
// Client-nya dibikin sekali lalu dipakai ulang — stateless, dan dulu
// createAdminClient() dipanggil ulang tiap request.
let cachedClient = null;
function getAdminClient() {
    if (!cachedClient) cachedClient = createAdminClient();
    return cachedClient;
}

export async function verifyAdmin(request) {
    // request.cookies cuma ada di NextRequest. Kalau fungsi ini kepanggil
    // dari Server Action atau handler yang nerima Request biasa, dulu
    // langsung TypeError -> 500, bukan 403.
    let token;
    if (request?.cookies?.get) {
        token = request.cookies.get('admin_session')?.value;
    } else {
        const store = await cookies();
        token = store.get('admin_session')?.value;
    }

    const payload = verifyAdminSessionToken(token);

    if (!payload) {
        // 401, bukan 403: artinya "belum/nggak lagi login", jadi client bisa
        // bedain ini dari "login tapi nggak berhak" dan langsung lempar ke
        // halaman login.
        return { error: 'Sesi admin tidak valid atau sudah kedaluwarsa.', status: 401 };
    }

    // Lapis kedua: email di token harus masih sama dengan ADMIN_EMAIL yang
    // aktif. Tanpa ini, token yang diterbitkan sebelum ADMIN_EMAIL diganti
    // tetap sakti sampai masa berlakunya habis.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.error('ADMIN_EMAIL belum diatur — semua akses admin ditolak.');
        return { error: 'Konfigurasi admin belum lengkap.', status: 500 };
    }

    if (String(payload.email).toLowerCase() !== adminEmail.toLowerCase()) {
        return { error: 'Akun ini bukan admin aktif.', status: 403 };
    }

    return { email: payload.email, supabaseAdmin: getAdminClient() };
}

/**
 * Pembungkus buat route handler admin.
 *
 * Pola lama (`const { error, supabaseAdmin } = await verifyAdmin(request)`
 * di awal tiap handler) jalan, tapi kalau satu route lupa manggilnya,
 * endpoint itu langsung kebuka dengan client yang bypass RLS — persis yang
 * kejadian di /api/smm/services. Dengan wrapper ini, handler-nya nggak
 * mungkin jalan tanpa lolos auth dulu.
 *
 * Pakainya:
 *   export const GET = withAdmin(async (request, { supabaseAdmin, email }) => {
 *       ...
 *       return NextResponse.json({ ... });
 *   });
 */
export function withAdmin(handler) {
    return async function (request, routeContext) {
        const { error, status, supabaseAdmin, email } = await verifyAdmin(request);
        if (error) {
            return Response.json({ error }, { status: status || 401 });
        }
        return handler(request, { supabaseAdmin, email, routeContext });
    };
}