import { ImageResponse } from 'next/og';

export const alt = 'SuntikSosmed — Panel SMM Terpercaya untuk Followers, Likes & Views';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// CATATAN: jangan pakai komponen dari lucide-react (atau library komponen apa
// pun) di dalam ImageResponse. Renderernya (Satori) cuma dukung sebagian kecil
// elemen & CSS -- komponen library bikin generatornya gagal dan hasilnya jadi
// halaman kosong, bukan error yang keliatan. Ikon harus ditulis sebagai <svg>
// mentah kayak di bawah ini.
function AsteriskMark({ size = 90, color = '#ffffff' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 6v12" />
            <path d="M17.196 9 6.804 15" />
            <path d="m6.804 9 10.392 6" />
        </svg>
    );
}

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#111111',
                    padding: '80px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', marginRight: 28 }}>
                        <AsteriskMark size={90} color="#ffffff" />
                    </div>
                    <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, color: '#ffffff' }}>
                        SuntikSosmed
                        <span style={{ color: '#B9FF66' }}>.</span>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        fontSize: 34,
                        color: '#9ca3af',
                        marginBottom: 44,
                        textAlign: 'center',
                    }}
                >
                    Naikkan performa media sosialmu, instan.
                </div>

                <div style={{ display: 'flex', marginBottom: 44 }}>
                    {['Followers', 'Likes', 'Views', 'Engagement'].map((label) => (
                        <div
                            key={label}
                            style={{
                                display: 'flex',
                                backgroundColor: 'rgba(185,255,102,0.1)',
                                color: '#B9FF66',
                                fontSize: 24,
                                fontWeight: 600,
                                padding: '10px 24px',
                                borderRadius: 999,
                                marginLeft: 12,
                                marginRight: 12,
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Domain ditulis di gambar: sebagian besar preview link (WhatsApp,
                    Telegram) motong atau nyembunyiin URL-nya, jadi ini satu-satunya
                    tempat orang lihat alamat situsnya pas di-share. */}
                <div style={{ display: 'flex', fontSize: 26, color: '#6b7280' }}>
                    smmsuntiksosmed.my.id
                </div>
            </div>
        ),
        { ...size }
    );
}