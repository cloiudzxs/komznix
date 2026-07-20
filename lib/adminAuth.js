import crypto from 'crypto';

// Sesi login admin ini SENGAJA terpisah total dari Supabase Auth pelanggan
// — kredensialnya (ADMIN_EMAIL, ADMIN_PASSWORD_HASH) cuma ada di .env.local
// (server), gak pernah kesimpen di tabel database mana pun. Jadi kalau
// suatu saat database Supabase bocor, akun admin ini TETAP aman karena
// emang gak ada di situ.
//
// Token sesinya berupa payload di-base64 + tanda tangan HMAC-SHA256 pakai
// ADMIN_SESSION_SECRET, disimpan di cookie httpOnly (gak bisa dibaca lewat
// JavaScript di browser, jadi aman dari XSS).

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 jam

function sign(payload) {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error('ADMIN_SESSION_SECRET belum diatur di .env.local');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function createAdminSessionToken(email) {
    const payload = JSON.stringify({ email, exp: Date.now() + SESSION_DURATION_MS });
    const encoded = Buffer.from(payload).toString('base64url');
    const signature = sign(encoded);
    return `${encoded}.${signature}`;
}

export function verifyAdminSessionToken(token) {
    if (!token || !token.includes('.')) return null;

    const [encoded, signature] = token.split('.');
    let expectedSignature;
    try {
        expectedSignature = sign(encoded);
    } catch {
        return null;
    }

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        if (!payload.exp || payload.exp < Date.now()) return null;
        return payload; // { email, exp }
    } catch {
        return null;
    }
}