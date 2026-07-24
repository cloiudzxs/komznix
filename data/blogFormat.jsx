// Format penulisan buat admin (lihat juga BlogManager.jsx):
// - Heading   : baris diawali "# " (H1), "## " (H2), atau "### " (H3)
// - Paragraf  : pisahin pakai baris kosong (Enter dua kali)
// - Bold      : **teks tebal**
// - Link      : [teks yang ditampilin](https://url-tujuan)
//
// Sengaja gak pakai library markdown eksternal -- isinya simpel (blog
// SuntikSosmed cuma butuh heading/paragraf/bold/link), jadi parser custom
// tipis ini cukup dan gak nambah dependency baru ke project.

import React from 'react';

function parseInline(text, keyPrefix) {
    // Pecah teks jadi potongan berdasarkan **bold** dan [link](url), jaga
    // urutan aslinya.
    const parts = [];
    const regex = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        if (match[1] !== undefined) {
            parts.push(
                <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold text-white">
                    {match[1]}
                </strong>
            );
        } else {
            const isExternal = /^https?:\/\//i.test(match[3]);
            parts.push(
                <a
                    key={`${keyPrefix}-a-${i++}`}
                    href={match[3]}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="text-[#B9FF66] underline underline-offset-2 hover:text-[#a0e655]"
                >
                    {match[2]}
                </a>
            );
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
}

export function renderBlogContent(raw) {
    if (!raw) return null;
    const blocks = raw.replace(/\r\n/g, '\n').split(/\n{2,}/);

    return blocks
        .map((block, i) => {
            const trimmed = block.trim();
            if (!trimmed) return null;

            if (trimmed.startsWith('### ')) {
                return (
                    <h3 key={i} className="text-lg font-bold mt-2">
                        {parseInline(trimmed.slice(4), `h3-${i}`)}
                    </h3>
                );
            }
            if (trimmed.startsWith('## ')) {
                return (
                    <h2 key={i} className="text-xl font-bold mt-4">
                        {parseInline(trimmed.slice(3), `h2-${i}`)}
                    </h2>
                );
            }
            if (trimmed.startsWith('# ')) {
                return (
                    <h1 key={i} className="text-2xl font-bold mt-4">
                        {parseInline(trimmed.slice(2), `h1-${i}`)}
                    </h1>
                );
            }

            // Paragraf biasa -- baris tunggal di dalam blok yang sama tetap
            // dipisah <br />, biar penulis bisa bikin baris baru tanpa perlu
            // dianggap paragraf baru.
            const lines = trimmed.split('\n');
            return (
                <p key={i} className="text-gray-300 leading-relaxed">
                    {lines.map((line, li) => (
                        <React.Fragment key={li}>
                            {li > 0 && <br />}
                            {parseInline(line, `p-${i}-${li}`)}
                        </React.Fragment>
                    ))}
                </p>
            );
        })
        .filter(Boolean);
}

// Estimasi lama baca (buat ditampilin di halaman artikel) -- ~200 kata/menit.
export function estimateReadMinutes(raw) {
    if (!raw) return 1;
    const words = raw.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
}