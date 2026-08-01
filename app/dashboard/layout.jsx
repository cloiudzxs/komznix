import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../lib/supabase/server';

// Dashboard gak boleh keindeks mesin pencari — isinya halaman pribadi
// pelanggan, dan URL-nya sekarang bisa bawa ?tab=... yang gak ada gunanya
// muncul di hasil pencarian.
export const metadata = {
    robots: { index: false, follow: false },
};

// Guard-nya dijalanin di server, sebelum satu byte pun HTML dashboard dikirim.
//
// Cek yang ada di app/dashboard/page.jsx tetep dipertahankan, tapi itu cuma
// lapis kedua buat UX: getSession() di browser cuma baca token dari
// localStorage tanpa verifikasi ke server, dan semua cek di sana jalan di
// perangkat pelanggan — termasuk cek status Suspend, yang bisa dilewatin
// tinggal dengan ngeblokir request ke tabel profiles dari DevTools.
// getUser() di bawah beda: dia verifikasi token ke Supabase.
export default async function DashboardLayout({ children }) {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.status === 'Suspend') {
        redirect('/login?suspended=1');
    }

    return children;
}