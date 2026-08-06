import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSessionToken } from '../../../../lib/adminAuth';

/* ------------------------------------------------------------------ *
 * Rate limit login
 *
 * Sebelumnya endpoint ini nerima percobaan login tanpa batas. bcrypt emang
 * lambat (~100ms sekali compare) jadi brute force-nya pelan, tapi pelan
 * bukan berarti mustahil — dan yang nyerang gak perlu buru-buru.
 *
 * Catatan: penyimpanannya di memori, jadi per-instance. Di Vercel yang
 * serverless, hitungannya bisa ke-reset kalau instance-nya baru. Tetep
 * ngeblok mayoritas percobaan otomatis. Kalau mau ketat beneran, pindahin
 * ke tabel Supabase (login_attempts) atau Upstash Redis.
 * ------------------------------------------------------------------ */
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

const attempts = new Map(); // ip -> { count, firstAt, lockedUntil }

function getClientIp(request) {
    const fwd = request.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    return request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);

    if (!entry) return { allowed: true };

    if (entry.lockedUntil && entry.lockedUntil > now) {
        return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
    }

    // Jendela percobaan udah lewat -> mulai hitungan baru
    if (now - entry.firstAt > WINDOW_MS) {
        attempts.delete(ip);
        return { allowed: true };
    }

    return { allowed: true };
}

function recordFailure(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);

    if (!entry || now - entry.firstAt > WINDOW_MS) {
        attempts.set(ip, { count: 1, firstAt: now, lockedUntil: 0 });
        return;
    }

    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = now + LOCKOUT_MS;

    // Bersihin entri basi sekalian, biar Map-nya gak numpuk terus.
    if (attempts.size > 500) {
        for (const [key, val] of attempts) {
            if (now - val.firstAt > WINDOW_MS && (!val.lockedUntil || val.lockedUntil < now)) {
                attempts.delete(key);
            }
        }
    }
}

export async function POST(request) {
    const ip = getClientIp(request);

    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
        return NextResponse.json(
            { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(limit.retryAfterSec / 60)} menit.` },
            { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
        );
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { email, password } = body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;

    if (!adminEmail || !adminPasswordHashB64) {
        // Pesan errornya digeneralisir — versi lama nyebutin nama variabel
        // env-nya ke siapa pun yang manggil endpoint ini.
        console.error('ADMIN_EMAIL / ADMIN_PASSWORD_HASH_B64 belum diatur.');
        return NextResponse.json({ error: 'Konfigurasi server belum lengkap.' }, { status: 500 });
    }

    // Hash bcrypt disimpan Base64 di .env.local biar tanda "$" gak dianggap
    // referensi variabel — di-decode balik di sini.
    const adminPasswordHash = Buffer.from(adminPasswordHashB64, 'base64').toString('utf8');

    const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

    // Selalu compare ke hash ASLI, apapun hasil cek email. Versi lama pakai
    // DUMMY_HASH pas email salah — itu jalan, tapi cuma kalau cost factor
    // dummy-nya persis sama dengan hash asli. Kalau hash asli cost 12 dan
    // dummy-nya cost 10, waktu responsnya beda jelas dan justru bocorin
    // email admin yang bener. Compare ke hash asli bikin masalah itu hilang
    // total tanpa perlu dummy.
    const passwordMatches = await bcrypt.compare(password, adminPasswordHash);

    if (!emailMatches || !passwordMatches) {
        recordFailure(ip);
        return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Login sukses -> hitungan gagal buat IP ini direset.
    attempts.delete(ip);

    const token = createAdminSessionToken(adminEmail);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60, // samain dengan SESSION_DURATION_MS di lib/adminAuth.js
    });
    return response;
}