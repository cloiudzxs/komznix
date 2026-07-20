import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SuntikSosmed — Panel SMM Terpercaya untuk Followers, Likes & Views';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
                    <div
                        style={{
                            width: 90,
                            height: 90,
                            borderRadius: 24,
                            backgroundColor: '#B9FF66',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 28,
                            fontSize: 56,
                            color: '#000000',
                            fontWeight: 700,
                        }}
                    >
                        *
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
                        marginBottom: 48,
                        textAlign: 'center',
                    }}
                >
                    Naikkan performa media sosialmu, instan.
                </div>

                <div style={{ display: 'flex' }}>
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
            </div>
        ),
        { ...size }
    );
}