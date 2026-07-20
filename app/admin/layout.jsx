// Layout ini SENGAJA bukan buat nge-render UI (gak ada sidebar/wrapper di
// sini — itu urusan masing-masing halaman admin sendiri) — ini cuma numpuk
// metadata di atas app/layout.tsx buat SEMUA halaman di bawah /admin:
// 1. Title beda dari landing page (bukan title marketing/jualan)
// 2. noindex — Google gak akan index halaman ini, TANPA perlu nyebutin
//    path /admin di robots.txt (yang notabene file publik, siapa aja bisa
//    baca). Ini cara yang lebih aman buat "nyembunyiin" dari pencarian
//    dibanding pakai robots.txt disallow.
export const metadata = {
    title: 'Admin — SuntikSosmed',
    description: 'Panel kelola SuntikSosmed — bukan untuk pelanggan.',
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
};

export default function AdminLayout({ children }) {
    return children;
}