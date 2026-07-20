import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSessionToken } from '../../../../lib/adminAuth';

// Hash "umpan" (bukan hash asli siapa pun) — dipakai buat tetep manggil
// bcrypt.compare walau EMAIL-nya udah salah, biar waktu respons gak beda
// jauh antara "email salah" vs "email benar tapi password salah". Kalau
// bcrypt cuma dipanggil pas email cocok, orang yang ngukur waktu respons
// bisa nebak email admin yang bener meski pesan errornya identik.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Uu/rq7GJvSJDb0k.vd2jqiFGY.Bpu';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { email, password } = body || {};
    if (!email || !password) {
        return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;

    if (!adminEmail || !adminPasswordHashB64) {
        return NextResponse.json(
            { error: 'ADMIN_EMAIL / ADMIN_PASSWORD_HASH_B64 belum diatur di .env.local' },
            { status: 500 }
        );
    }

    // Hash bcrypt-nya disimpan dalam bentuk Base64 di .env.local (biar gak
    // kena masalah tanda "$" yang diterjemahin Next.js sebagai referensi
    // variabel) — di-decode balik ke bentuk aslinya di sini sebelum dicek.
    const adminPasswordHash = Buffer.from(adminPasswordHashB64, 'base64').toString('utf8');

    const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    // SELALU panggil bcrypt.compare, apapun hasil pengecekan email di atas
    // — kalau email gak cocok, dibandingin ke DUMMY_HASH (hasilnya pasti
    // false, tapi makan waktu proses yang sama kayak compare ke hash asli).
    const passwordMatches = await bcrypt.compare(password, emailMatches ? adminPasswordHash : DUMMY_HASH);

    if (!emailMatches || !passwordMatches) {
        return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const token = createAdminSessionToken(adminEmail);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60, // 12 jam, dalam detik
    });
    return response;
}