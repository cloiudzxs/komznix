import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smmsuntiksosmed.my.id"),
  title: "SuntikSosmed — Naikkan Followers, Likes & Views Instan, Aman!",
  description:
    "Gabung bareng ribuan reseller & kreator yang udah pakai SuntikSosmed buat naikkin followers, likes, views Instagram, TikTok, YouTube, dan platform lainnya. Proses instan, bergaransi refill, harga bersaing, pembayaran aman. Coba sekarang!",
  openGraph: {
    title: "SuntikSosmed — Naikkan Followers, Likes & Views Instan, Aman!",
    description:
      "Gabung bareng ribuan reseller & kreator yang udah pakai SuntikSosmed. Proses instan, bergaransi refill, harga bersaing.",
    url: "https://smmsuntiksosmed.my.id",
    siteName: "SuntikSosmed",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SuntikSosmed — Naikkan Followers, Likes & Views Instan, Aman!",
    description:
      "Gabung bareng ribuan reseller & kreator yang udah pakai SuntikSosmed buat naikkin followers, likes, dan views.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}