'use client';

import { useEffect } from 'react';

// Komponen ini gak nge-render apapun (return null) -- tugasnya cuma
// nembak 1 request ke /api/blog/track-view pas artikel ini beneran dibuka
// di browser. Ditaruh di Server Component halaman detail blog, tapi harus
// 'use client' sendiri karena butuh useEffect (yang cuma jalan di browser,
// bukan pas render di server).
export default function BlogViewTracker({ slug }) {
    useEffect(() => {
        fetch('/api/blog/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        }).catch(() => {
            // Diem-diem aja kalau gagal -- gak boleh ganggu pengalaman baca.
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    return null;
}