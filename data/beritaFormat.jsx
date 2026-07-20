import { Fragment } from 'react';

// Format ringan ala-Markdown buat isi Berita, dipakai bareng oleh
// BeritaSection.jsx (tampilan pelanggan) dan BeritaManager.jsx (preview di
// admin) — biar keduanya selalu render PERSIS sama, gak ada beda tampilan
// antara preview & hasil aslinya.
//
// Aturan penulisan:
// - Paragraf baru = pisahin pakai baris kosong (Enter dua kali)
// - Ganti baris tanpa paragraf baru = Enter sekali
// - Link = [teks yang ditampilin](https://url-tujuan)
// Cuma link http/https yang dikenali; teks lain yang kebetulan mirip format
// ini dibiarkan apa adanya sebagai teks biasa, bukan diubah jadi link, biar
// aman (gak bisa disusupin javascript: dsb).

function renderInlineWithLinks(line, keyPrefix) {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let i = 0;
    while ((match = linkRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index));
        }
        parts.push(
            <a
                key={`${keyPrefix}-link-${i++}`}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#B9FF66] underline underline-offset-2 hover:text-[#a0e655]"
            >
                {match[1]}
            </a>
        );
        lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
    }
    return parts;
}

export function renderBeritaContent(text) {
    if (!text) return null;
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
            <p key={pIdx} className="text-sm text-gray-400 leading-relaxed">
                {lines.map((line, lIdx) => (
                    <Fragment key={lIdx}>
                        {renderInlineWithLinks(line, `${pIdx}-${lIdx}`)}
                        {lIdx < lines.length - 1 && <br />}
                    </Fragment>
                ))}
            </p>
        );
    });
}