// Penyimpanan saldo & riwayat pesanan pelanggan. Ini masih lewat
// localStorage (per-browser, bukan database asli) — begitu backend/Supabase
// ada, ganti jadi tabel `orders` dan kolom `balance` di tabel user yang
// dibaca dari server, bukan dari sini lagi.

const ORDERS_STORAGE_KEY = 'suntik_orders';
const BALANCE_STORAGE_KEY = 'suntik_balance';

export const DEFAULT_BALANCE = 125000;

export function loadOrders() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveOrders(orders) {
    try {
        window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
        // localStorage penuh/diblokir — riwayat tetap kepakai untuk sesi ini saja
    }
}

export function addOrder(order) {
    const orders = [order, ...loadOrders()];
    saveOrders(orders);
    return orders;
}

export function loadBalance() {
    if (typeof window === 'undefined') return DEFAULT_BALANCE;
    const raw = window.localStorage.getItem(BALANCE_STORAGE_KEY);
    const value = Number(raw);
    return raw !== null && Number.isFinite(value) ? value : DEFAULT_BALANCE;
}

export function saveBalance(value) {
    try {
        window.localStorage.setItem(BALANCE_STORAGE_KEY, String(value));
    } catch {
        // localStorage penuh/diblokir — saldo tetap kepakai untuk sesi ini saja
    }
}