// Daftar kata kasar/gak pantes dasar (Indonesia + Inggris umum) buat filter
// nama pas daftar akun. Ini BUKAN daftar lengkap/sempurna — orang yang niat
// nyari celah (typo sengaja, angka ganti huruf, spasi disisipin, dst) masih
// mungkin bisa lolos. Anggap ini lapisan pertama nyaring kasus paling umum
// & jelas, bukan solusi 100%. Tambah kata baru ke array ini kalau nemu
// kasus yang lolos.
const BAD_WORDS = [
    // Indonesia — kasar/vulgar umum
    'anjing', 'anjg', 'asu', 'bangsat', 'bego', 'goblok', 'tolol',
    'kontol', 'memek', 'ngentot', 'jancok', 'jancuk', 'jembut',
    'pepek', 'pukimak', 'kimak', 'bajingan', 'brengsek', 'sialan',
    'tai', 'taik', 'kampret', 'lonte', 'pelacur',
    // Inggris — umum
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
    'cunt', 'nigger', 'nigga', 'faggot', 'whore', 'slut',
];

// Normalisasi ringan biar variasi umum (angka pengganti huruf, dsb) ikut
// kedeteksi — mis. "b4ngs4t" tetap kena karena "4" dibaca sebagai "a".
function normalize(text) {
    const substitutions = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };
    return text
        .toLowerCase()
        .split('')
        .map((c) => substitutions[c] || c)
        .join('')
        .replace(/[^a-z\s]/g, '');
}

export function containsBadWord(text) {
    if (!text) return false;
    const normalized = normalize(text);
    return BAD_WORDS.some((word) => normalized.includes(word));
}

// Validasi email lebih ketat dari cuma type="email" bawaan browser (yang
// nerima hampir apa aja, mis. "a@b.c"). Ini masih pengecekan FORMAT doang —
// bukan verifikasi domain/MX record beneran ada atau email itu aktif; buat
// itu perlu kirim email verifikasi beneran (yang udah dilakuin lewat
// Supabase Auth di alur daftar ini).
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
}