import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/supabase/verifyAdmin';
import { logActivity } from '../../../../lib/supabase/logActivity';
import { getOrderStatus, mapProviderStatus } from '../../../../lib/provider';

const STATUS_VALID = ['Pending', 'Diproses', 'Selesai', 'Gagal'];

// Berapa order yang boleh disinkron ke provider dalam satu request, dan
// berapa yang jalan barengan. Dulu semua order pending disync satu-satu
// secara berurutan -> 150 order = 150 HTTP call antri = function timeout.
const MAX_SYNC = 100;
const SYNC_CONCURRENCY = 8;

// Batas baris yang ditarik sekali jalan. Tanpa ini query narik seluruh
// riwayat order seumur hidup tiap halaman admin dibuka.
const MAX_ROWS = 1000;

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    const { data, error: queryError } = await supabaseAdmin
        .from('orders')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(MAX_ROWS);

    if (queryError) {
        return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Sync status ke provider cuma jalan kalau diminta eksplisit lewat
    // ?sync=1. Kartu Overview di halaman admin juga manggil endpoint ini
    // cuma buat hitung omset — gak perlu ikut nunggu ratusan call provider.
    const wantSync = new URL(request.url).searchParams.get('sync') === '1';
    if (!wantSync) {
        return NextResponse.json({ orders: data, synced: 0 });
    }

    const toSync = data
        .filter((o) => ['Pending', 'Diproses'].includes(o.status) && o.provider_order_id)
        .slice(0, MAX_SYNC);

    const changed = [];

    for (let i = 0; i < toSync.length; i += SYNC_CONCURRENCY) {
        await Promise.allSettled(
            toSync.slice(i, i + SYNC_CONCURRENCY).map(async (order) => {
                try {
                    const result = await getOrderStatus(order.provider_order_id);
                    const mapped = mapProviderStatus(result?.status);
                    if (mapped && mapped !== order.status && STATUS_VALID.includes(mapped)) {
                        order.status = mapped; // ikut kekirim di response, gak perlu query ulang
                        changed.push({ id: order.id, status: mapped });
                    }
                } catch (err) {
                    // Satu order gagal sync (ID salah / provider error) -> skip,
                    // jangan gagalin seluruh halaman.
                    console.error(`Gagal sync order ${order.id}:`, err.message);
                }
            })
        );
    }

    // Update dikelompokin per status, jadi maksimal 4 query — bukan satu
    // UPDATE per order kayak sebelumnya.
    if (changed.length > 0) {
        const byStatus = new Map();
        for (const c of changed) {
            if (!byStatus.has(c.status)) byStatus.set(c.status, []);
            byStatus.get(c.status).push(c.id);
        }

        await Promise.allSettled(
            [...byStatus.entries()].map(([status, ids]) =>
                supabaseAdmin.from('orders').update({ status }).in('id', ids)
            )
        );
    }

    return NextResponse.json({ orders: data, synced: changed.length });
}

export async function PATCH(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return NextResponse.json({ error }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body request tidak valid.' }, { status: 400 });
    }

    const { id, status, refunded } = body || {};
    if (!id) {
        return NextResponse.json({ error: 'id pesanan wajib diisi.' }, { status: 400 });
    }

    // Status datang dari client, jadi jangan dipercaya mentah-mentah —
    // tanpa whitelist ini siapa pun yang bisa PATCH bisa nulis string apa
    // aja ke kolom status.
    if (status !== undefined && !STATUS_VALID.includes(status)) {
        return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    if (refunded !== undefined && typeof refunded !== 'boolean') {
        return NextResponse.json({ error: 'Nilai refunded tidak valid.' }, { status: 400 });
    }

    /* --------------------------- refund --------------------------- *
     * Dulu: SELECT refunded -> kalau false, tambah saldo -> baru UPDATE.
     * Itu read-then-write dan gak atomik: dobel klik atau dua tab admin
     * kebuka bisa nambah saldo dua kali.
     *
     * Sekarang flag-nya diklaim duluan lewat UPDATE ... WHERE refunded =
     * false. Cuma satu request yang bakal dapet baris balik; sisanya dapet
     * null dan gak nambah saldo apa-apa.
     *
     * Catatan skema: kolom `refunded` harus NOT NULL DEFAULT false. Kalau
     * masih nullable, baris NULL gak kematch sama .eq('refunded', false).
     * ALTER TABLE orders ALTER COLUMN refunded SET DEFAULT false;
     * UPDATE orders SET refunded = false WHERE refunded IS NULL;
     * ALTER TABLE orders ALTER COLUMN refunded SET NOT NULL;
     * --------------------------------------------------------------- */
    if (refunded === true) {
        const { data: claimed, error: claimError } = await supabaseAdmin
            .from('orders')
            .update({ refunded: true })
            .eq('id', id)
            .eq('refunded', false)
            .select('user_id, harga')
            .maybeSingle();

        if (claimError) {
            return NextResponse.json({ error: claimError.message }, { status: 500 });
        }

        if (claimed) {
            const { error: rpcError } = await supabaseAdmin.rpc('admin_add_balance', {
                target_user: claimed.user_id,
                amount: claimed.harga,
            });

            // Error RPC dulu gak dicek sama sekali: kalau saldo gagal masuk,
            // order tetap ketandain "sudah direfund" dan pelanggan gak pernah
            // dapet duitnya balik. Sekarang flag-nya dibalikin biar bisa
            // dicoba ulang.
            if (rpcError) {
                await supabaseAdmin.from('orders').update({ refunded: false }).eq('id', id);
                console.error(`admin_add_balance gagal buat pesanan ${id}:`, rpcError.message);
                return NextResponse.json(
                    { error: 'Refund gagal, saldo pelanggan tidak bertambah. Coba lagi.' },
                    { status: 500 }
                );
            }

            await logActivity(supabaseAdmin, {
                adminEmail: email,
                aksi: 'Refund',
                detail: `Refund Rp ${Number(claimed.harga).toLocaleString('id-ID')} buat pesanan ${id}`,
            }).catch((err) => console.error('logActivity gagal:', err.message));
        }
    }

    // refunded udah diurus di blok atas (termasuk kasus false -> unrefund
    // manual di bawah), jadi di sini tinggal sisanya.
    const updates = {};
    if (status) updates.status = status;
    if (refunded === false) updates.refunded = false;

    if (Object.keys(updates).length === 0) {
        const { data: current } = await supabaseAdmin.from('orders').select().eq('id', id).maybeSingle();
        return NextResponse.json({ order: current });
    }

    const { data, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (status) {
        await logActivity(supabaseAdmin, {
            adminEmail: email,
            aksi: 'Ubah Status',
            detail: `Pesanan ${id} diubah jadi ${status}`,
        }).catch((err) => console.error('logActivity gagal:', err.message));
    }

    return NextResponse.json({ order: data });
}