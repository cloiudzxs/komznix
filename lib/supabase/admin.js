import { createClient } from '@supabase/supabase-js';

// Client khusus SERVER, pakai Secret key (bukan Publishable key) — bisa
// akses SEMUA baris di semua tabel, bypass RLS sepenuhnya. JANGAN PERNAH
// import file ini dari komponen 'use client' atau dari mana pun yang jalan
// di browser — kalau Secret key ini kekirim ke browser, siapa pun bisa baca
// & ubah data pengguna manapun.
export function createAdminClient() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}