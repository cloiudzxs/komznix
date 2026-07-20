import { createAdminClient } from './admin';
import { verifyAdminSessionToken } from '../adminAuth';

// Cek cookie admin_session (auth admin sekarang terpisah total dari
// Supabase Auth pelanggan — lihat lib/adminAuth.js). Kalau valid, kasih
// balik client Supabase yang pakai Secret key (bypass RLS) buat query data
// semua pengguna.
export async function verifyAdmin(request) {
    const token = request.cookies.get('admin_session')?.value;
    const payload = verifyAdminSessionToken(token);

    if (!payload) {
        return { error: 'Sesi admin tidak valid atau sudah kedaluwarsa.' };
    }

    const supabaseAdmin = createAdminClient();
    return { email: payload.email, supabaseAdmin };
}