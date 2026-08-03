// app/api/admin/deposit-manual/route.js
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/verifyAdmin';

const METODE = 'Manual (Admin)';

// Nama kolom tabel `deposits` beda-beda antar project, jadi dicari otomatis
// dengan cara probing (tetap akurat walau tabelnya masih kosong).
const KANDIDAT_JUMLAH = ['jumlah', 'amount', 'nominal', 'total', 'value', 'harga'];
const KANDIDAT_METODE = ['metode', 'method', 'metode_pembayaran', 'payment_method', 'channel', 'tipe'];

let cachedCols = null;
let cachedLogCols = null;

async function probe(supabaseAdmin, tabel, kandidat) {
    for (const kolom of kandidat) {
        const { error } = await supabaseAdmin.from(tabel).select(kolom).limit(1);
        if (!error) return kolom;
    }
    return null;
}

// Kolom tabel activity_log juga dideteksi, biar pencatatan audit tidak gagal
// cuma gara-gara beda penamaan.
async function getLogCols(supabaseAdmin) {
    if (cachedLogCols) return cachedLogCols;
    const [colAksi, colDetail, colAdmin] = await Promise.all([
        probe(supabaseAdmin, 'activity_log', ['aksi', 'action', 'tipe', 'event', 'jenis', 'judul']),
        probe(supabaseAdmin, 'activity_log', ['detail', 'deskripsi', 'keterangan', 'description', 'pesan', 'isi']),
        probe(supabaseAdmin, 'activity_log', ['admin', 'admin_email', 'email', 'oleh', 'actor', 'user_email']),
    ]);
    cachedLogCols = { colAksi, colDetail, colAdmin };
    return cachedLogCols;
}

async function getCols(supabaseAdmin) {
    if (cachedCols) return cachedCols;
    const [colJumlah, colMetode] = await Promise.all([
        probe(supabaseAdmin, 'deposits', KANDIDAT_JUMLAH),
        probe(supabaseAdmin, 'deposits', KANDIDAT_METODE),
    ]);
    if (!colJumlah) {
        throw new Error(
            `Kolom nominal di tabel deposits tidak ditemukan. Dicoba: ${KANDIDAT_JUMLAH.join(', ')}`
        );
    }
    cachedCols = { colJumlah, colMetode };
    return cachedCols;
}

export async function GET(request) {
    const { error, supabaseAdmin } = await verifyAdmin(request);
    if (error) return error;

    try {
        const { colJumlah, colMetode } = await getCols(supabaseAdmin);

        let query = supabaseAdmin
            .from('deposits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (colMetode) query = query.eq(colMetode, METODE);

        const { data, error: dbErr } = await query;
        if (dbErr) throw dbErr;

        const rows = data || [];
        const ids = [...new Set(rows.map((d) => d.user_id))];
        let profilMap = {};
        if (ids.length) {
            const { data: profil } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, balance')
                .in('id', ids);
            profilMap = Object.fromEntries((profil || []).map((p) => [p.id, p]));
        }

        return NextResponse.json({
            kolom: { jumlah: colJumlah, metode: colMetode },
            riwayat: rows.map((d) => ({
                id: d.id,
                user_id: d.user_id,
                jumlah: d[colJumlah],
                status: d.status,
                created_at: d.created_at,
                nama: profilMap[d.user_id]?.full_name || '-',
                saldo_sekarang: profilMap[d.user_id]?.balance ?? null,
            })),
        });
    } catch (e) {
        console.error('[deposit-manual][GET]', e);
        // Route ini admin-only, jadi detail error boleh ditampilkan untuk debugging.
        return NextResponse.json(
            { error: `Gagal memuat riwayat: ${e?.message || 'unknown'}` },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const { error, supabaseAdmin, email } = await verifyAdmin(request);
    if (error) return error;

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
    }

    const userId = String(body?.userId || '').trim();
    const tipe = body?.tipe === 'kurang' ? 'kurang' : 'tambah';
    const catatan = String(body?.catatan || '').slice(0, 200);
    const jumlah = Math.floor(Number(body?.jumlah));

    if (!userId) return NextResponse.json({ error: 'Pengguna belum dipilih.' }, { status: 400 });
    if (!Number.isFinite(jumlah) || jumlah <= 0) {
        return NextResponse.json({ error: 'Jumlah harus angka lebih dari 0.' }, { status: 400 });
    }
    if (jumlah > 50_000_000) {
        return NextResponse.json({ error: 'Jumlah melebihi batas aman (Rp 50.000.000).' }, { status: 400 });
    }

    const { data: profil, error: profilErr } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, balance')
        .eq('id', userId)
        .single();

    if (profilErr || !profil) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const saldoLama = Number(profil.balance || 0);

    try {
        if (tipe === 'tambah') {
            const { colJumlah, colMetode } = await getCols(supabaseAdmin);

            // 1. Catat dulu ke tabel deposits supaya muncul di Riwayat Top Up pengguna.
            const payload = { user_id: userId, status: 'Berhasil', [colJumlah]: jumlah };
            if (colMetode) payload[colMetode] = METODE;

            const { error: insErr } = await supabaseAdmin.from('deposits').insert(payload);
            if (insErr) throw insErr;

            // 2. Trigger on_deposit_success belum tentu jalan pada INSERT (di DB ini tidak),
            //    jadi saldo dicek dulu. Ditambah manual HANYA kalau trigger tidak menambahkan —
            //    dengan begini tidak akan dobel kalau trigger-nya suatu saat aktif.
            const { data: cek, error: cekErr } = await supabaseAdmin
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single();
            if (cekErr) throw cekErr;

            if (Number(cek?.balance || 0) === saldoLama) {
                const { data: updated, error: updErr } = await supabaseAdmin
                    .from('profiles')
                    .update({ balance: saldoLama + jumlah })
                    .eq('id', userId)
                    .eq('balance', saldoLama) // guard anti race condition
                    .select('id');
                if (updErr) throw updErr;
                if (!updated || updated.length === 0) {
                    return NextResponse.json(
                        {
                            error:
                                'Deposit tercatat, tapi saldo pengguna berubah bersamaan. Cek saldo pengguna sebelum mengulang.',
                        },
                        { status: 409 }
                    );
                }
            }
        } else {
            if (saldoLama < jumlah) {
                return NextResponse.json(
                    { error: `Saldo tidak cukup. Saldo sekarang Rp ${saldoLama.toLocaleString('id-ID')}.` },
                    { status: 400 }
                );
            }
            const { data: updated, error: updErr } = await supabaseAdmin
                .from('profiles')
                .update({ balance: saldoLama - jumlah })
                .eq('id', userId)
                .eq('balance', saldoLama) // guard anti race condition
                .select('id');
            if (updErr) throw updErr;
            if (!updated || updated.length === 0) {
                return NextResponse.json(
                    { error: 'Saldo pengguna baru saja berubah. Muat ulang lalu coba lagi.' },
                    { status: 409 }
                );
            }
        }

        // Pengurangan saldo tidak masuk tabel deposits, jadi dicatat terpisah supaya
        // pelanggan tetap bisa melihatnya di Riwayat Saldo.
        if (tipe === 'kurang') {
            const { error: adjErr } = await supabaseAdmin.from('saldo_adjustments').insert({
                user_id: userId,
                jumlah,
                tipe: 'pengurangan',
                catatan: catatan || null,
                admin: email,
            });
            if (adjErr) console.error('[deposit-manual][adjustment]', adjErr);
        }

        const { data: profilBaru } = await supabaseAdmin
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        // Audit log — best-effort, gagal di sini tidak membatalkan transaksi.
        try {
            const { colAksi, colDetail, colAdmin } = await getLogCols(supabaseAdmin);
            if (colAksi) {
                const payloadLog = {
                    [colAksi]: tipe === 'tambah' ? 'Deposit Manual (Admin)' : 'Pengurangan Saldo (Admin)',
                };
                if (colDetail) {
                    payloadLog[colDetail] = `${profil.full_name || userId} — Rp ${jumlah.toLocaleString(
                        'id-ID'
                    )}${catatan ? ` | ${catatan}` : ''}`;
                }
                if (colAdmin) payloadLog[colAdmin] = email;

                const { error: logErr } = await supabaseAdmin.from('activity_log').insert(payloadLog);
                if (logErr) console.error('[deposit-manual][log]', logErr);
            } else {
                console.error('[deposit-manual][log] kolom aksi activity_log tidak ditemukan');
            }
        } catch (logErr) {
            console.error('[deposit-manual][log]', logErr);
        }

        return NextResponse.json({
            ok: true,
            tipe,
            saldo_lama: saldoLama,
            saldo_baru: Number(profilBaru?.balance ?? saldoLama),
        });
    } catch (e) {
        console.error('[deposit-manual][POST]', e);
        return NextResponse.json(
            { error: `Gagal memproses saldo: ${e?.message || 'unknown'}` },
            { status: 500 }
        );
    }
}