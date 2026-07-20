// Dipanggil dari route app/api/admin/* setelah aksi admin berhasil (ubah
// status pesanan, suspend user, balas tiket, dll), buat nyatet jejak audit.
// Gagal nyatet log gak boleh bikin aksi utamanya ikut gagal, makanya
// error-nya cuma di-log ke console, gak di-throw.
export async function logActivity(supabaseAdmin, { adminEmail, aksi, detail }) {
    try {
        await supabaseAdmin.from('activity_log').insert({
            admin_email: adminEmail || 'unknown',
            aksi,
            detail,
        });
    } catch (err) {
        console.error('Gagal nyatet activity log:', err);
    }
}