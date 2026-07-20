// Helper server-side buat komunikasi ke API provider SMM.
// JANGAN pernah import file ini dari komponen 'use client' — API key harus
// tetap di server. Semua pemanggilan dari frontend wajib lewat route di
// app/api/smm/*, bukan langsung ke sini.
//
// Konvensi API di bawah ini ("Perfect Panel API") dipakai hampir semua
// panel reseller SMM — POST ke {API_URL}, body form-urlencoded berisi
// `key` + `action` + parameter lain, response JSON. Cek ulang di dashboard
// akun provider kamu (biasanya menu "API") buat mastiin URL & nama
// parameternya persis sama, soalnya tiap provider kadang ada penyesuaian
// kecil.

const PROVIDER_API_URL = process.env.SMM_PROVIDER_API_URL;
const PROVIDER_API_KEY = process.env.SMM_PROVIDER_API_KEY;

async function callProvider(params) {
    if (!PROVIDER_API_KEY || !PROVIDER_API_URL) {
        throw new Error('SMM_PROVIDER_API_KEY / SMM_PROVIDER_API_URL belum diatur di .env.local');
    }

    const body = new URLSearchParams({ key: PROVIDER_API_KEY, ...params });

    let res;
    try {
        res = await fetch(PROVIDER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
            cache: 'no-store',
        });
    } catch (err) {
        throw new Error(`Gagal menghubungi provider: ${err.message}`);
    }

    if (!res.ok) {
        throw new Error(`Provider merespons status ${res.status}`);
    }

    const data = await res.json();

    // Kebanyakan panel jenis ini balikin { "error": "..." } dengan HTTP 200,
    // bukan status HTTP error — jadi errornya dicek manual di sini.
    if (data && data.error) {
        throw new Error(data.error);
    }

    return data;
}

// GET action=services — daftar semua layanan yang tersedia dari provider.
// Bentuk tiap item kira-kira:
// { service, name, type, category, rate (USD per 1000), min, max, refill, cancel }
export function getServices() {
    return callProvider({ action: 'services' });
}

// POST action=add — bikin pesanan baru.
// serviceId = ID layanan dari provider (bukan ID internal kita)
// link = target (link/username)
// quantity = jumlah yang dipesan
export function placeOrder({ serviceId, link, quantity }) {
    return callProvider({ action: 'add', service: serviceId, link, quantity });
}

// GET action=status — cek status satu pesanan.
// Response: { charge, start_count, status, remains, currency }
// status dari provider (contoh SMMSOC): "Pending", "In progress",
// "Completed", "Partial", "Canceled", dll — bahasa Inggris, beda sama
// status internal kita.
export function getOrderStatus(orderId) {
    return callProvider({ action: 'status', order: orderId });
}

// Mapping status provider (Inggris) -> status internal kita (Indonesia).
// Dipakai di mana pun kita sync status dari provider ke DB.
export function mapProviderStatus(providerStatus) {
    const s = String(providerStatus || '').toLowerCase();

    if (s.includes('pending')) return 'Pending';
    if (s.includes('progress') || s.includes('processing')) return 'Diproses';
    if (s.includes('completed')) return 'Selesai';
    if (s.includes('partial') || s.includes('canceled') || s.includes('cancelled') || s.includes('error')) return 'Gagal';

    // Status yang gak dikenal -> jangan diubah, biar ketauan butuh mapping baru
    return null;
}

// GET action=balance — cek saldo akun kita sendiri di provider
// (bukan saldo pelanggan kita — ini saldo buat bayar ke provider-nya).
export function getProviderBalance() {
    return callProvider({ action: 'balance' });
}

// POST action=refill — minta provider ngirim ulang pesanan yang drop.
// orderId di sini WAJIB id pesanan di PROVIDER (bukan id di database kita
// sendiri) — biasanya balikin { refill: "id_refill_di_provider" }.
export function refillOrder(orderId) {
    return callProvider({ action: 'refill', order: orderId });
}