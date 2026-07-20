import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Supabase client yang baca session pelanggan dari cookies request —
// dipakai di Route Handler (app/api/...) buat verifikasi "siapa yang lagi
// login" di server, BUKAN buat bypass RLS (itu tugasnya lib/supabase/admin.js).
// Beda dari lib/supabase/client.js yang khusus buat komponen 'use client'.
export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    } catch {
                        // Dipanggil dari konteks yang gak bisa nulis cookie (mis. Server
                        // Component) — aman diabaikan selama ada middleware yang refresh
                        // session di tempat lain.
                    }
                },
            },
        }
    );
}